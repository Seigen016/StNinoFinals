/**
 * Renders admin-editable plain-text legal content (Terms/Privacy).
 * Supports a tiny, hand-parsed subset — "## " headings and "- " bullet
 * lists — with zero HTML/Markdown execution: every block is rendered as
 * plain React text, never via dangerouslySetInnerHTML.
 */
export function LegalContent({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith('## ')) {
          return (
            <h2
              key={i}
              className="text-base font-bold text-gray-800 mb-2 mt-8 first:mt-0"
            >
              {block.slice(3).trim()}
            </h2>
          );
        }

        const lines = block
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        if (lines.length > 0 && lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1 mb-4">
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2).trim()}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="whitespace-pre-line mb-4 last:mb-0">
            {block}
          </p>
        );
      })}
    </>
  );
}
