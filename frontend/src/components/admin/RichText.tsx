import { useEffect, useRef } from 'react'
import { FieldError } from './Fields'
import { m } from '#/lib/i18n'

interface RichTextProps {
  id: string
  label: string
  hint?: string
  error?: string
  /** HTML in; the server cleans it again on save, so only simple formatting survives. */
  value: string
  onChange: (html: string) => void
}

/**
 * A small formatting editor: bold, italic, two heading sizes, lists and links.
 * It edits HTML directly in the browser (contentEditable). The backend sanitises the
 * result against an allowlist, so pasted styling or scripts never reach the website.
 */
export function RichText({
  id,
  label,
  hint,
  error,
  value,
  onChange,
}: RichTextProps) {
  const editor = useRef<HTMLDivElement>(null)
  const t = m.admin.editor

  // Load the starting value once. After that the editor owns its content, so the cursor
  // never jumps while typing.
  useEffect(() => {
    if (editor.current) editor.current.innerHTML = value
  }, [])

  function run(command: string, argument?: string) {
    editor.current?.focus()
    document.execCommand(command, false, argument)
    emit()
  }

  function emit() {
    const html = editor.current?.innerHTML ?? ''
    // An emptied editor leaves a stray <br>; treat that as no text.
    onChange(html === '<br>' ? '' : html)
  }

  function addLink() {
    const url = window.prompt(t.linkPrompt, 'https://')
    if (url) run('createLink', url)
  }

  const tools: Array<{ label: string; run: () => void }> = [
    { label: t.bold, run: () => run('bold') },
    { label: t.italic, run: () => run('italic') },
    { label: t.heading, run: () => run('formatBlock', 'h2') },
    { label: t.subheading, run: () => run('formatBlock', 'h3') },
    { label: t.paragraph, run: () => run('formatBlock', 'p') },
    { label: t.bullets, run: () => run('insertUnorderedList') },
    { label: t.numbers, run: () => run('insertOrderedList') },
    { label: t.link, run: addLink },
    { label: t.unlink, run: () => run('unlink') },
  ]

  return (
    <div className="grid min-w-0 gap-2">
      <span id={`${id}-label`} className="font-semibold text-navy-950">
        {label}
      </span>
      {hint ? (
        <span className="text-[0.9375rem] text-slate-700" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      <div
        className={
          'overflow-hidden rounded-lg bg-white ring-1 transition focus-within:ring-2 focus-within:ring-blue-600 ' +
          (error
            ? 'ring-2 ring-red-600'
            : 'ring-slate-300 hover:ring-slate-500')
        }
      >
        <div
          className="flex flex-wrap gap-1.5 border-b border-slate-200 bg-slate-50 p-2"
          role="toolbar"
          aria-label={t.label}
        >
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              className="min-h-9 rounded-md bg-white px-3 text-[0.9375rem] font-semibold text-navy-950 ring-1 ring-slate-300 transition ring-inset hover:bg-blue-50 hover:ring-blue-600"
              // Keep the text selection while a toolbar button is pressed.
              onMouseDown={(event) => event.preventDefault()}
              onClick={tool.run}
            >
              {tool.label}
            </button>
          ))}
        </div>
        <div
          id={id}
          ref={editor}
          className="richtext max-h-[32rem] min-h-48 max-w-none overflow-y-auto px-4 py-3 focus:outline-none richtext-headings:font-heading richtext-headings:font-semibold"
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-labelledby={`${id}-label`}
          aria-describedby={hint ? `${id}-hint` : undefined}
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
        />
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  )
}
