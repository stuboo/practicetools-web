import type { Block } from '../types'
import { btnPrimary } from './styles'

const SAFE_HREF = /^(https?:|mailto:|tel:)/i

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="mt-6 text-xl font-bold">{block.text}</h2>
    case 'paragraph':
      return <p className="mt-3">{block.text}</p>
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul'
      return (
        <Tag className={`mt-3 space-y-1 pl-6 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </Tag>
      )
    }
    case 'callout':
      return (
        <div
          role="note"
          data-tone={block.tone}
          className={`mt-4 rounded-lg border-l-4 p-4 ${
            block.tone === 'warning'
              ? 'border-amber-500 bg-amber-50 text-amber-900'
              : 'border-blue-500 bg-blue-50 text-blue-900'
          }`}
        >
          {block.text}
        </div>
      )
    case 'video':
      return (
        <figure className="mt-4">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(block.youtubeId)}`}
              title={block.caption ?? 'Video'}
              loading="lazy"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          {block.caption && <figcaption className="mt-1 text-sm text-gray-600">{block.caption}</figcaption>}
        </figure>
      )
    case 'image':
      return (
        <img
          src={block.src.startsWith('/previsit/') ? block.src : `/previsit/${block.src.replace(/^\/+/, '')}`}
          alt={block.alt}
          loading="lazy"
          className="mt-4 h-auto max-w-full rounded-lg"
        />
      )
    case 'link':
      return SAFE_HREF.test(block.href) ? (
        <p className="mt-3">
          <a
            href={block.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center font-semibold text-blue-700 underline"
          >
            {block.text}
          </a>
        </p>
      ) : (
        <p className="mt-3">{block.text}</p>
      )
  }
}

type Props = {
  blocks: Block[]
  completed: boolean
  onComplete: () => void
}

export default function InfoModule({ blocks, completed, onComplete }: Props) {
  return (
    <div>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
      <div className="mt-8">
        {completed ? (
          <p className="font-semibold text-green-800">Done. You finished this step.</p>
        ) : (
          <button type="button" className={btnPrimary} onClick={onComplete}>
            Mark complete
          </button>
        )}
      </div>
    </div>
  )
}
