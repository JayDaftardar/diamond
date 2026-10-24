import { Play } from 'lucide-react'
import { useState } from 'react'
import { fmt, m } from '#/lib/i18n'

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

/**
 * YouTube player. Shows a thumbnail first and only loads YouTube's player after a click,
 * which keeps the page fast and sends no data to YouTube until the visitor presses play.
 * Uses the privacy-enhanced youtube-nocookie.com domain. Only the 11-character id is ever
 * stored, and it is re-checked here before use.
 */
export function YouTubeEmbed({
  videoId,
  title,
}: {
  videoId: string
  title: string
}) {
  const [playing, setPlaying] = useState(false)
  if (!VIDEO_ID.test(videoId)) return null
  const label = fmt(m.treatments.videoTitle, { title })

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-navy-950 shadow-card">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={label}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button
          type="button"
          className="group absolute inset-0 size-full cursor-pointer"
          onClick={() => setPlaying(true)}
          aria-label={`${m.treatments.playVideo}: ${title}`}
        >
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover opacity-90 transition duration-700 ease-smooth group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <span
            className="absolute inset-0 grid place-items-center"
            aria-hidden="true"
          >
            <span className="grid size-18 place-items-center rounded-full bg-blue-600 text-white shadow-float transition duration-200 group-hover:scale-105 group-hover:bg-blue-700 group-active:scale-95 motion-reduce:transition-none">
              <Play className="size-7 translate-x-0.5 fill-current" />
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
