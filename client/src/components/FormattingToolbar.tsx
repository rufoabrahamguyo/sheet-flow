import React from 'react'
import type { CellFormat } from '../types'
import type { EditCommand } from './Header'
import './FormattingToolbar.css'

const FONT_FAMILIES = ['Default...', 'Calibri', 'Arial', 'Times New Roman', 'Courier New', 'Georgia']
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20]
const ZOOM_LEVELS = [50, 75, 90, 100, 125, 150, 200]
const NUMBER_FORMATS: { value: CellFormat['numberFormat']; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'date', label: 'Date' },
]

interface FormattingToolbarProps {
  selectedFormat?: CellFormat | null
  onFormatChange: (format: Partial<CellFormat>) => void
  onEditCommand?: (cmd: EditCommand) => void
  disabled?: boolean
}

function TbBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`sf-tb__btn ${active ? 'is-active' : ''}`}
    >
      {children}
    </button>
  )
}

export function FormattingToolbar({
  selectedFormat,
  onFormatChange,
  onEditCommand,
  disabled = false,
}: FormattingToolbarProps) {
  const fmt = selectedFormat ?? {}
  const noCell = disabled

  return (
    <div className="sf-tb">
      {/* Group 1: Search, Undo, Redo, Print, Format Painter, Zoom */}
      <div className="sf-tb__group">
        <TbBtn onClick={() => onEditCommand?.('find')} disabled={noCell} title="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M16 16l4 4" strokeLinecap="round"/></svg>
        </TbBtn>
        <TbBtn onClick={() => onEditCommand?.('undo')} disabled={noCell} title="Undo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 7H4v5"/><path d="M4 12a8 8 0 0112 6"/></svg>
        </TbBtn>
        <TbBtn onClick={() => onEditCommand?.('redo')} disabled={noCell} title="Redo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 7h5v5"/><path d="M20 12a8 8 0 00-12-6"/></svg>
        </TbBtn>
        <TbBtn onClick={() => {}} disabled={noCell} title="Print">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/></svg>
        </TbBtn>
        <TbBtn onClick={() => {}} disabled={noCell} title="Format Painter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
        </TbBtn>
        <select className="sf-tb__select" defaultValue={100} title="Zoom">
          {ZOOM_LEVELS.map((z) => (
            <option key={z} value={z}>{z}%</option>
          ))}
        </select>
      </div>

      <div className="sf-tb__sep" />

      {/* Group 2: Number formatting */}
      <div className="sf-tb__group">
        <button type="button" className="sf-tb__btn sf-tb__btn--icon" title="Number format">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 14h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
        </button>
        <TbBtn onClick={() => onFormatChange({ numberFormat: 'currency' })} disabled={noCell} title="Currency">
          £
        </TbBtn>
        <TbBtn onClick={() => onFormatChange({ numberFormat: 'percentage' })} active={fmt.numberFormat === 'percentage'} disabled={noCell} title="Percentage">
          %
        </TbBtn>
        <TbBtn onClick={() => {}} disabled={noCell} title="Decrease decimal">.0←</TbBtn>
        <TbBtn onClick={() => {}} disabled={noCell} title="Increase decimal">.00→</TbBtn>
        <TbBtn onClick={() => onFormatChange({ numberFormat: 'number' })} disabled={noCell} title="Format as number">
          123
        </TbBtn>
      </div>

      <div className="sf-tb__sep" />

      {/* Group 3: Font and text */}
      <div className="sf-tb__group">
        <select
          className="sf-tb__select sf-tb__select--font"
          value={fmt.fontFamily ?? 'Default...'}
          disabled={noCell}
          onChange={(e) => onFormatChange({ fontFamily: e.target.value === 'Default...' ? undefined : e.target.value })}
          title="Font"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <div className="sf-tb__fontSize">
          <TbBtn onClick={() => onFormatChange({ fontSize: Math.max(8, (fmt.fontSize ?? 10) - 1) })} disabled={noCell} title="Decrease size">−</TbBtn>
          <input
            type="text"
            className="sf-tb__fontSizeInput"
            value={fmt.fontSize ?? 10}
            readOnly
            tabIndex={-1}
          />
          <TbBtn onClick={() => onFormatChange({ fontSize: (fmt.fontSize ?? 10) + 1 })} disabled={noCell} title="Increase size">+</TbBtn>
        </div>
        <TbBtn onClick={() => onFormatChange({ bold: !fmt.bold })} active={fmt.bold} disabled={noCell} title="Bold"><b>B</b></TbBtn>
        <TbBtn onClick={() => onFormatChange({ italic: !fmt.italic })} active={fmt.italic} disabled={noCell} title="Italic"><i>I</i></TbBtn>
        <TbBtn onClick={() => onFormatChange({ strikethrough: !fmt.strikethrough })} active={fmt.strikethrough} disabled={noCell} title="Strikethrough">
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </TbBtn>
        <TbBtn onClick={() => onFormatChange({ fontColor: fmt.fontColor ? undefined : '#000' })} active={!!fmt.fontColor} disabled={noCell} title="Text color">
          <span className="sf-tb__fontColor">A</span>
        </TbBtn>
        <TbBtn onClick={() => onFormatChange({ fillColor: fmt.fillColor ? undefined : '#ffeb3b' })} active={!!fmt.fillColor} disabled={noCell} title="Fill color">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12z"/></svg>
        </TbBtn>
      </div>

      <div className="sf-tb__sep" />

      {/* Group 4: Alignment */}
      <div className="sf-tb__group">
        <TbBtn onClick={() => {}} disabled={noCell} title="Borders">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v18h18V3H3zm2 2h2v2H5V5zm4 0h2v2H9V5zm4 0h2v2h-2V5zm4 0h2v14h-2V5zM5 9h2v2H5V9zm4 0h2v2H9V9zm4 0h2v2h-2V9zM5 13h2v2H5v-2zm4 0h2v2H9v-2zm4 0h2v2h-2v-2z"/></svg>
        </TbBtn>
        <TbBtn onClick={() => {}} disabled={noCell} title="Merge cells">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 6v12M16 6v12M4 10h8M4 14h8M12 10h8M12 14h8"/></svg>
        </TbBtn>
        <TbBtn onClick={() => onFormatChange({ horizontalAlign: 'left' })} active={fmt.horizontalAlign === 'left'} disabled={noCell} title="Align left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5h16v2H4zm0 4h12v2H4zm0 4h16v2H4zm0 4h8v2H4z"/></svg>
        </TbBtn>
        <TbBtn onClick={() => onFormatChange({ horizontalAlign: 'center' })} active={fmt.horizontalAlign === 'center' || !fmt.horizontalAlign} disabled={noCell} title="Center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 7h16v2H4zm2 4h12v2H6zm-2 4h16v2H4zm2 4h12v2H6z"/></svg>
        </TbBtn>
        <TbBtn onClick={() => onFormatChange({ horizontalAlign: 'right' })} active={fmt.horizontalAlign === 'right'} disabled={noCell} title="Align right">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5h16v2H4zm4 4h12v2H8zm-4 4h16v2H4zm4 4h12v2H8z"/></svg>
        </TbBtn>
        <TbBtn onClick={() => onFormatChange({ verticalAlign: 'top' })} active={fmt.verticalAlign === 'top'} disabled={noCell} title="Top align">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v2H4zm0 4h12v2H4zm0 4h8v2H4z"/></svg>
        </TbBtn>
        <TbBtn onClick={() => onFormatChange({ wrapText: !fmt.wrapText })} active={fmt.wrapText} disabled={noCell} title="Wrap text">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h10a2 2 0 110 4H4M4 18h6"/></svg>
        </TbBtn>
        <TbBtn onClick={() => {}} disabled={noCell} title="Text rotation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4v10l4-4 4 4V4"/><path d="M15 20h4"/></svg>
        </TbBtn>
      </div>

      <div className="sf-tb__sep" />

      {/* Group 5: Insert and data */}
      <div className="sf-tb__group">
        <TbBtn onClick={() => {}} disabled={noCell} title="Insert link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        </TbBtn>
        <TbBtn onClick={() => {}} disabled={noCell} title="Comment">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
        </TbBtn>
        <TbBtn onClick={() => {}} disabled={noCell} title="Insert chart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3v18h18"/><path d="M7 14v4M12 10v8M17 6v12"/></svg>
        </TbBtn>
        <TbBtn onClick={() => {}} disabled={noCell} title="Filter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
        </TbBtn>
        <TbBtn onClick={() => {}} disabled={noCell} title="Functions">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg>
        </TbBtn>
        <TbBtn onClick={() => {}} disabled={noCell} title="Sum">
          <span style={{ fontWeight: 700 }}>Σ</span>
        </TbBtn>
      </div>
    </div>
  )
}
