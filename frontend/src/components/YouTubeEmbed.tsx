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
    <div className="video-frame">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={label}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          className="video-frame__poster"
          onClick={() => setPlaying(true)}
          aria-label={`${m.treatments.playVideo}: ${title}`}
        >
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
          />
          <span className="video-frame__play" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M8 5v14l11-7Z" fill="currentColor" />
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}
