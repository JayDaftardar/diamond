/**
 * Embedded presentation (Google Slides, OneDrive / PowerPoint Online).
 * The server only ever returns a link that passed the host allowlist, and the frame is
 * sandboxed on top of that: scripts may run (the viewer needs them) but the frame cannot
 * navigate our page, submit forms, or open downloads.
 */
export function PresentationFrame({
  url,
  title,
}: {
  url: string
  title: string
}) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200">
      <iframe
        src={url}
        title={title}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerPolicy="no-referrer"
        allowFullScreen
        className="absolute inset-0 size-full border-0"
      />
    </div>
  )
}
