/**
 * El formato sencillo que usa el modelo (negritas, listas y títulos con #),
 * convertido en bloques para mostrarlo sin interpretar HTML.
 */
export type Inline = { text: string; bold: boolean }
export type Block =
  | { kind: 'heading'; content: Inline[] }
  | { kind: 'paragraph'; content: Inline[] }
  | { kind: 'list'; ordered: boolean; items: Inline[][] }

/** "Hola **mundo**" → [{Hola, normal}, {mundo, negrita}]. Un ** sin cerrar (mientras se escribe) se muestra normal. */
export function parseInline(text: string): Inline[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  return parts.map((part) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? { text: part.slice(2, -2), bold: true }
      : { text: part.replace(/\*\*/g, ''), bold: false },
  )
}

export function parseRichText(source: string): Block[] {
  const blocks: Block[] = []
  for (const raw of source.replace(/\r/g, '').split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const heading = /^#{1,6}\s+(.*)$/.exec(line)
    const bullet = /^[-*•]\s+(.*)$/.exec(line)
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line)
    const item = bullet ?? numbered
    if (heading) {
      blocks.push({ kind: 'heading', content: parseInline(heading[1]) })
    } else if (item) {
      const ordered = Boolean(numbered)
      const last = blocks.at(-1)
      if (last?.kind === 'list' && last.ordered === ordered) last.items.push(parseInline(item[1]))
      else blocks.push({ kind: 'list', ordered, items: [parseInline(item[1])] })
    } else {
      blocks.push({ kind: 'paragraph', content: parseInline(line) })
    }
  }
  return blocks
}
