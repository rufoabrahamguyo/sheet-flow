import React from 'react'
import './FormattingToolbar.css'

interface FormattingToolbarProps {
  onBold: () => void
  onItalic: () => void
  boldActive?: boolean
  italicActive?: boolean
}

export function FormattingToolbar({
  onBold,
  onItalic,
  boldActive = false,
  italicActive = false,
}: FormattingToolbarProps) {
  return (
    <div className="sf-toolbar">
      <button
        type="button"
        onClick={onBold}
        title="Bold"
        className={`sf-toolbar__btn ${boldActive ? 'is-active' : ''}`}
      >
        <span aria-hidden="true" className="sf-toolbar__label sf-toolbar__label--bold">
          B
        </span>
        <span className="sf-toolbar__text">Bold</span>
      </button>
      <button
        type="button"
        onClick={onItalic}
        title="Italic"
        className={`sf-toolbar__btn ${italicActive ? 'is-active' : ''}`}
      >
        <span aria-hidden="true" className="sf-toolbar__label sf-toolbar__label--italic">
          I
        </span>
        <span className="sf-toolbar__text">Italic</span>
      </button>
    </div>
  )
}
