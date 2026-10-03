'use client'

import { useState, useRef, useEffect } from 'react'

interface StageActionPanelProps {
  completedCount: number
  totalCount: number
  isReady: boolean
  isGenerating: boolean
  nextLabel: string
  onNext: () => void
  onCopyAll: () => Promise<void> | void
  onRegenerateAll: () => Promise<void> | void
  onBack: () => void
}

export default function StageActionPanel({
  completedCount,
  totalCount,
  isReady,
  isGenerating,
  nextLabel,
  onNext,
  onCopyAll,
  onRegenerateAll,
  onBack,
}: StageActionPanelProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleCopy = async () => {
    if (completedCount === 0) return
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    try {
      await onCopyAll()
      setCopied(true)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy all:', err)
    }
  }

  const percent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0

  return (
    <>
      {/* DESKTOP FIXED RIGHT-SIDE VERTICAL PANEL (>= 1024px) */}
      <aside
        className="hidden lg:flex flex-col select-none"
        style={{
          position: 'fixed',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '160px',
        }}
        aria-label="Actions panel"
      >
        {/* 1. PROGRESS INDICATOR (top) */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E0E0E0',
            borderRadius: '10px',
            padding: '8px 12px',
            boxSizing: 'border-box',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[12px] font-bold ${isReady ? 'text-[#2E7D32]' : 'text-[#111111]'}`}>
              {isReady ? 'Done ✓' : `${completedCount} / ${totalCount || 3}`}
            </span>
            <span className="text-[11px] font-bold text-[#888888]">
              {percent}%
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#888888', margin: '0 0 6px 0', lineHeight: 1.2 }}>
            {completedCount} of {totalCount || 3} scenes
          </p>
          <div
            style={{
              height: '4px',
              width: '100%',
              background: '#FFEBEE',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${percent}%`,
                background: isReady ? '#2E7D32' : '#C62828',
                borderRadius: '9999px',
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>

        {/* 2. NEXT BUTTON */}
        <button
          onClick={onNext}
          disabled={!isReady}
          style={{
            background: '#C62828',
            color: '#FFFFFF',
            borderRadius: '10px',
            padding: '10px 14px',
            width: '100%',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: isReady ? 'pointer' : 'not-allowed',
            opacity: isReady ? 1 : 0.4,
            boxShadow: isReady ? '0 0 16px rgba(198,40,40,0.4)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {nextLabel}
        </button>

        {/* 3. COPY ALL BUTTON */}
        <button
          onClick={handleCopy}
          disabled={completedCount === 0}
          style={{
            background: copied ? '#2E7D32' : '#FFFFFF',
            border: copied ? '1.5px solid #2E7D32' : '1.5px solid #C62828',
            color: copied ? '#FFFFFF' : '#C62828',
            borderRadius: '10px',
            padding: '10px 14px',
            width: '100%',
            fontSize: '13px',
            fontWeight: 600,
            cursor: completedCount === 0 ? 'not-allowed' : 'pointer',
            opacity: completedCount === 0 ? 0.4 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy All'}
        </button>

        {/* 4. REGENERATE ALL BUTTON */}
        <button
          onClick={onRegenerateAll}
          disabled={isGenerating || totalCount === 0}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E0E0E0',
            color: '#555555',
            borderRadius: '10px',
            padding: '10px 14px',
            width: '100%',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isGenerating || totalCount === 0 ? 'not-allowed' : 'pointer',
            opacity: isGenerating || totalCount === 0 ? 0.4 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          {isGenerating ? '🔄 Working...' : '🔄 Regenerate All'}
        </button>

        {/* 5. BACK BUTTON (bottom) */}
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: '1px solid #E0E0E0',
            color: '#555555',
            borderRadius: '10px',
            padding: '10px 14px',
            width: '100%',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          ← Back
        </button>
      </aside>

      {/* MOBILE FLOATING BOTTOM BAR (< 1024px) */}
      <div
        className="flex lg:hidden items-center justify-between gap-2"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 100,
          background: '#FFFFFF',
          padding: '12px 16px',
          borderTop: '1px solid #E0E0E0',
          boxSizing: 'border-box',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: '1px solid #E0E0E0',
            color: '#555555',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ← Back
        </button>

        {/* Regenerate All */}
        <button
          onClick={onRegenerateAll}
          disabled={isGenerating || totalCount === 0}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E0E0E0',
            color: '#555555',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: isGenerating || totalCount === 0 ? 'not-allowed' : 'pointer',
            opacity: isGenerating || totalCount === 0 ? 0.4 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {isGenerating ? '🔄 ...' : '🔄 Regenerate'}
        </button>

        {/* Copy All */}
        <button
          onClick={handleCopy}
          disabled={completedCount === 0}
          style={{
            background: copied ? '#2E7D32' : '#FFFFFF',
            border: copied ? '1.5px solid #2E7D32' : '1.5px solid #C62828',
            color: copied ? '#FFFFFF' : '#C62828',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: completedCount === 0 ? 'not-allowed' : 'pointer',
            opacity: completedCount === 0 ? 0.4 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {copied ? '✓ Copied' : '📋 Copy All'}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={!isReady}
          style={{
            background: '#C62828',
            color: '#FFFFFF',
            borderRadius: '8px',
            padding: '8px 14px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            cursor: isReady ? 'pointer' : 'not-allowed',
            opacity: isReady ? 1 : 0.4,
            boxShadow: isReady ? '0 0 12px rgba(198,40,40,0.4)' : 'none',
            whiteSpace: 'nowrap',
            flex: 1,
            maxWidth: '140px',
          }}
        >
          {nextLabel}
        </button>
      </div>
    </>
  )
}
