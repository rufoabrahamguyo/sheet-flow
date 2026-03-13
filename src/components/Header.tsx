import React, { useMemo, useState } from 'react'
import './Header.css'

export type EditCommand =
  | 'undo'
  | 'redo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'find'
  | 'replace'
  | 'selectAll'

export function Header({
  onEditCommand,
  hasSelection = false,
  rightSlot,
}: {
  onEditCommand?: (cmd: EditCommand) => void
  hasSelection?: boolean
  rightSlot?: React.ReactNode
}) {
  const items = useMemo(
    () => ['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools', 'Gemini', 'Extensions', 'Help'] as const,
    []
  )
  const [activeTab, setActiveTab] = useState<(typeof items)[number] | null>(null)

  const handleMenuClick = (item: (typeof items)[number]) => {
    setActiveTab((prev) => (prev === item ? null : item))
  }

  return (
    <header className="sf-header">
      <div className="sf-header__topRow">
        <div className="sf-header__leftTop">
          <div className="sf-header__appIcon" aria-hidden="true">
            <SheetIcon />
          </div>
          <div className="sf-header__titleGroup">
            <div className="sf-header__titleLine">
              <span className="sf-header__title">Untitled spreadsheet</span>
              <IconButton label="Star" className="sf-header__iconButton">
                <StarIcon />
              </IconButton>
              <IconButton label="Move" className="sf-header__iconButton sf-hide-sm">
                <FolderIcon />
              </IconButton>
              <IconButton label="Cloud status" className="sf-header__iconButton sf-hide-sm">
                <CloudIcon />
              </IconButton>
            </div>
            <div className="sf-header__menuRow">
              {items.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`sf-header__menuItem ${activeTab === item ? 'is-active' : ''}`}
                  onClick={() => handleMenuClick(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sf-header__rightTop">
          {rightSlot}
          <IconButton label="Version history" className="sf-header__iconButton sf-hide-sm">
            <ClockIcon />
          </IconButton>
          <IconButton label="Comments" className="sf-header__iconButton sf-hide-sm">
            <CommentIcon />
          </IconButton>
          <IconButton label="Meet" className="sf-header__iconButton sf-hide-sm">
            <VideoIcon />
          </IconButton>

          <button type="button" className="sf-header__shareButton">
            <span className="sf-header__shareInner">
              <LockIcon />
              <span className="sf-header__shareText">Share</span>
              <ChevronDownIcon />
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'Edit' && (
        <div className="sf-ribbon" role="region" aria-label="Edit toolbar">
          <div className="sf-ribbon__group">
            <div className="sf-ribbon__groupTitle">Clipboard</div>
            <div className="sf-ribbon__row">
              <RibbonButton
                label="Cut"
                onClick={() => onEditCommand?.('cut')}
                disabled={!hasSelection}
              >
                <CutIcon />
              </RibbonButton>
              <RibbonButton
                label="Copy"
                onClick={() => onEditCommand?.('copy')}
                disabled={!hasSelection}
              >
                <CopyIcon />
              </RibbonButton>
              <RibbonButton label="Paste" onClick={() => onEditCommand?.('paste')}>
                <PasteIcon />
              </RibbonButton>
            </div>
          </div>

          <div className="sf-ribbon__divider" />

          <div className="sf-ribbon__group">
            <div className="sf-ribbon__groupTitle">History</div>
            <div className="sf-ribbon__row">
              <RibbonButton label="Undo" onClick={() => onEditCommand?.('undo')}>
                <UndoIcon />
              </RibbonButton>
              <RibbonButton label="Redo" onClick={() => onEditCommand?.('redo')}>
                <RedoIcon />
              </RibbonButton>
            </div>
          </div>

          <div className="sf-ribbon__divider" />

          <div className="sf-ribbon__group">
            <div className="sf-ribbon__groupTitle">Find</div>
            <div className="sf-ribbon__row">
              <RibbonButton label="Find" onClick={() => onEditCommand?.('find')}>
                <SearchIcon />
              </RibbonButton>
              <RibbonButton label="Replace" onClick={() => onEditCommand?.('replace')}>
                <ReplaceIcon />
              </RibbonButton>
              <RibbonButton label="Select all" onClick={() => onEditCommand?.('selectAll')}>
                <SelectAllIcon />
              </RibbonButton>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function IconButton({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <button type="button" aria-label={label} title={label} className={className}>
      {children}
    </button>
  )
}

function RibbonButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className="sf-ribbon__btn"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <span className="sf-ribbon__btnIcon" aria-hidden="true">
        {children}
      </span>
      <span className="sf-ribbon__btnText">{label}</span>
    </button>
  )
}

function SheetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 3h9l3 3v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        fill="#188038"
      />
      <path d="M15 3v3h3" fill="#34a853" />
      <path
        d="M8 10h8M8 13h8M8 16h8"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 17.3l-5.3 3 1.4-6-4.6-4 6.1-.6L12 4l2.4 5.7 6.1.6-4.6 4 1.4 6-5.3-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 18.5h9a4 4 0 0 0 .6-8A5.5 5.5 0 0 0 6.8 9.2 3.6 3.6 0 0 0 7.5 18.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 7v6l4 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v6A3.5 3.5 0 0 1 15.5 16H10l-4 4v-4.5A3.5 3.5 0 0 1 5 12.5v-6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.5A2.5 2.5 0 0 1 7 5h7a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 14 19H7a2.5 2.5 0 0 1-2.5-2.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M16.5 10l3-2v8l-3-2v-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 10V8.2A4.5 4.5 0 0 1 12 3.7a4.5 4.5 0 0 1 4.5 4.5V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.5 10h11a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 10l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7l8 5-8 5M12 12l8-9M12 12l8 9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 9.1a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4ZM6.2 19.3a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 9h10v12H9V9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PasteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4h6l1 2h3v16H5V6h3l1-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 4a2 2 0 0 0 0 4h6a2 2 0 0 0 0-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 7H4v5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 12c2-4 6-6 10-5 3.7.9 6 4.3 6 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 7h5v5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 12c-2-4-6-6-10-5-3.7.9-6 4.3-6 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ReplaceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 7h10M7 12h6M7 17h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M17 10l2 2-2 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SelectAllIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6h12v12H6V6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
