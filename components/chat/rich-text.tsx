import { parseRichText, type Inline } from '@/lib/chat/rich-text'

const Text = ({ content }: { content: Inline[] }) => (
  <>
    {content.map((part, i) =>
      part.bold ? (
        <strong key={i} className="font-semibold text-foreground">
          {part.text}
        </strong>
      ) : (
        <span key={i}>{part.text}</span>
      ),
    )}
  </>
)

/** La respuesta del asistente con su formato (negritas, listas, títulos), sin interpretar HTML. */
export function RichText({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-2">
      {parseRichText(source).map((block, i) => {
        if (block.kind === 'heading') {
          return (
            <p key={i} className="font-semibold text-foreground">
              <Text content={block.content} />
            </p>
          )
        }
        if (block.kind === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List key={i} className={`flex flex-col gap-1 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'} marker:text-primary`}>
              {block.items.map((item, j) => (
                <li key={j}>
                  <Text content={item} />
                </li>
              ))}
            </List>
          )
        }
        return (
          <p key={i}>
            <Text content={block.content} />
          </p>
        )
      })}
    </div>
  )
}
