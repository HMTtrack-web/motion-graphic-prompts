'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
  fullWidth?: boolean
  size?: 'sm' | 'md'
}

export default function CopyButton({
  text,
  label = 'Copy',
  className = '',
  fullWidth = false,
  size = 'md',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleCopy = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    }
  }, [text])

  const isSm = size === 'sm'

  return (
    <button
      onClick={handleCopy}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 border
        ${isSm ? 'px-2.5 py-1.5 text-xs gap-1.5 rounded-md' : 'px-4 py-2 text-sm gap-2 rounded-lg'}
        ${copied
          ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
          : 'bg-white text-[#C62828] border-[#C62828] hover:bg-[#FFEBEE]'
        }
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {copied ? (
        <>
          <svg className={isSm ? "w-3.5 h-3.5" : "w-4 h-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className={isSm ? "w-3.5 h-3.5" : "w-4 h-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}
