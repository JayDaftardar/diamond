import { useEffect, useRef } from 'react'
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
    <div className="field">
      <span id={`${id}-label`} className="field__label">
        {label}
      </span>
      {hint ? (
        <span className="field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      <div className="rich" data-invalid={error ? '' : undefined}>
        <div className="rich__tools" role="toolbar" aria-label={t.label}>
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              className="rich__tool"
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
          className="rich__area prose"
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
      {error ? <p className="field__error">{error}</p> : null}
    </div>
  )
}
