// Pull the raw text out of a chosen file in the browser. Only that text is
// ever saved — the file itself never leaves the browser.
// Heavy parsers are loaded on demand.

export const MAX_FILE_BYTES = 50 * 1024 * 1024

const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'br', 'dd', 'div', 'dl', 'dt', 'figcaption',
  'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav',
  'ol', 'p', 'pre', 'section', 'table', 'tr', 'ul',
])

const PLAIN_TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'text', 'csv', 'tsv', 'json', 'xml', 'yaml', 'yml', 'log', 'tex',
  'fountain', 'srt', 'vtt', 'ini', 'org', 'rst', 'adoc',
])

const EXTRACTORS = {
  docx: extractDocx,
  docm: extractDocx,
  dotx: extractDocx,
  pdf: extractPdf,
  odt: extractOdf,
  ott: extractOdf,
  odp: extractOdf,
  pptx: extractPptx,
  epub: extractEpub,
  html: extractHtmlFile,
  htm: extractHtmlFile,
  xhtml: extractHtmlFile,
  rtf: extractRtf,
}

const UNSUPPORTED = {
  doc: 'Legacy .doc files can’t be read in the browser — open it in Word and save as .docx.',
  pages: 'Pages files can’t be read — export as .docx or .pdf first.',
}

export function fileExtension(name) {
  const match = /\.([^.]+)$/.exec(name)
  return match ? match[1].toLowerCase() : ''
}

export async function extractText(file) {
  if (file.size > MAX_FILE_BYTES) throw new Error('File is larger than 50 MB.')
  const ext = fileExtension(file.name)
  if (UNSUPPORTED[ext]) throw new Error(UNSUPPORTED[ext])

  let text
  if (EXTRACTORS[ext]) {
    try {
      text = await EXTRACTORS[ext](file)
    } catch (err) {
      throw new Error(`Couldn’t read this .${ext} file: ${err.message}`)
    }
  } else if (PLAIN_TEXT_EXTENSIONS.has(ext) || file.type.startsWith('text/')) {
    text = await file.text()
  } else {
    // Unknown type: accept it if it's really text underneath
    text = await readIfText(file)
    if (text === null) {
      throw new Error(`Can’t extract text from ${ext ? `.${ext}` : 'this'} files.`)
    }
  }

  text = normalize(text)
  if (!text) throw new Error('No text found in this file.')
  return text
}

export function normalize(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function readIfText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.includes(0)) return null
  const text = new TextDecoder('utf-8').decode(bytes)
  const replacements = text.split('\uFFFD').length - 1
  return replacements > text.length * 0.01 ? null : text
}

async function extractDocx(file) {
  const { default: mammoth } = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return result.value
}

async function extractPdf(file) {
  const pdfjs = await import('pdfjs-dist')
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const content = await (await pdf.getPage(i)).getTextContent()
    pages.push(content.items.map((item) => item.str + (item.hasEOL ? '\n' : '')).join(''))
  }
  const text = pages.join('\n\n')
  if (!text.trim()) throw new Error('no text layer (scanned PDF?)')
  return text
}

async function loadZip(file) {
  const { default: JSZip } = await import('jszip')
  return JSZip.loadAsync(await file.arrayBuffer())
}

function parseXml(source, type = 'application/xml') {
  return new DOMParser().parseFromString(source, type)
}

// OpenDocument (.odt/.odp): paragraphs and headings live in content.xml
async function extractOdf(file) {
  const zip = await loadZip(file)
  const xml = await zip.file('content.xml')?.async('string')
  if (!xml) throw new Error('missing content.xml')

  const lines = []
  const walk = (node, out) => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) out.push(child.nodeValue)
      else if (child.localName === 's') out.push(' '.repeat(Number(child.getAttribute('text:c')) || 1))
      else if (child.localName === 'tab') out.push('\t')
      else if (child.localName === 'line-break') out.push('\n')
      else if (child.localName === 'p' || child.localName === 'h') {
        const parts = []
        walk(child, parts)
        lines.push(parts.join(''))
      } else walk(child, out)
    }
  }
  walk(parseXml(xml).documentElement, [])
  return lines.join('\n')
}

async function extractPptx(file) {
  const zip = await loadZip(file)
  const slides = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))

  const texts = []
  for (const name of slides) {
    const doc = parseXml(await zip.file(name).async('string'))
    const paragraphs = [...doc.getElementsByTagName('a:p')].map((p) =>
      [...p.getElementsByTagName('a:t')].map((t) => t.textContent).join(''),
    )
    texts.push(paragraphs.join('\n'))
  }
  return texts.join('\n\n')
}

async function extractEpub(file) {
  const zip = await loadZip(file)
  const container = parseXml(await zip.file('META-INF/container.xml').async('string'))
  const opfPath = container.getElementsByTagName('rootfile')[0].getAttribute('full-path')
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : ''
  const opf = parseXml(await zip.file(opfPath).async('string'))

  const manifest = Object.fromEntries(
    [...opf.getElementsByTagName('item')].map((item) => [item.getAttribute('id'), item.getAttribute('href')]),
  )
  const chapters = []
  for (const ref of opf.getElementsByTagName('itemref')) {
    const href = manifest[ref.getAttribute('idref')]
    const entry = href && zip.file(decodeURIComponent(opfDir + href))
    if (entry) chapters.push(htmlToText(await entry.async('string')))
  }
  return chapters.join('\n\n')
}

async function extractHtmlFile(file) {
  return htmlToText(await file.text())
}

function htmlToText(html) {
  const doc = parseXml(html, 'text/html')
  doc.querySelectorAll('script, style, head').forEach((el) => el.remove())
  const out = []
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) out.push(child.nodeValue.replace(/\s+/g, ' '))
      else if (child.nodeType === Node.ELEMENT_NODE) {
        const block = BLOCK_TAGS.has(child.localName)
        if (block) out.push('\n')
        walk(child)
        if (block) out.push('\n')
      }
    }
  }
  walk(doc.body || doc.documentElement)
  return out.join('').replace(/\n /g, '\n')
}

// Minimal RTF → text: keeps paragraph breaks and escaped characters,
// drops control words and destination groups (fonts, colors, metadata).
async function extractRtf(file) {
  const rtf = await file.text()
  const out = []
  const stack = []
  let skip = false
  let unicodeSkip = 1
  // \'xx escapes are bytes in the document's code page (usually 1252)
  const codePage = /\\ansicpg(\d+)/.exec(rtf)?.[1] ?? '1252'
  let decoder
  try {
    decoder = new TextDecoder(`windows-${codePage}`)
  } catch {
    decoder = new TextDecoder('windows-1252')
  }

  for (let i = 0; i < rtf.length; i++) {
    const ch = rtf[i]
    if (ch === '{') {
      stack.push(skip)
    } else if (ch === '}') {
      skip = stack.pop() ?? false
    } else if (ch === '\\') {
      const next = rtf[i + 1]
      if (next === '\\' || next === '{' || next === '}') {
        if (!skip) out.push(next)
        i++
      } else if (next === '*') {
        skip = true
        i++
      } else if (next === "'") {
        if (!skip) out.push(decoder.decode(new Uint8Array([parseInt(rtf.substr(i + 2, 2), 16)])))
        i += 3
      } else if (next === '\n' || next === '\r') {
        if (!skip) out.push('\n')
        i++
      } else {
        const match = /^([a-zA-Z]+)(-?\d+)? ?/.exec(rtf.slice(i + 1))
        if (!match) continue
        const [whole, word, arg] = match
        i += whole.length
        if (['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'header', 'footer'].includes(word)) {
          skip = true
        } else if (skip) {
          continue
        } else if (word === 'par' || word === 'line') {
          out.push('\n')
        } else if (word === 'tab') {
          out.push('\t')
        } else if (word === 'uc') {
          unicodeSkip = Number(arg)
        } else if (word === 'u') {
          const code = Number(arg)
          out.push(String.fromCharCode(code < 0 ? code + 65536 : code))
          i += unicodeSkip
        }
      }
    } else if (ch !== '\n' && ch !== '\r' && !skip) {
      out.push(ch)
    }
  }
  return out.join('')
}
