'use client'

import { useState } from 'react'

interface SceneErrorCardProps {
  sceneNumber: number
  scriptLine: string
  message: string
  onRetry: (sceneNumber: number) => Promise<void>
}

/** Shown in place of a scene card when only that scene failed to generate. */
export default function SceneErrorCard({ sceneNumber, scriptLine, message, onRetry }: SceneErrorCardProps) {
  const [retrying, setRetrying] = useState(false)

  const handleRetry = async () => {
    if (retrying) return
    setRetrying(true)
    try {
      await onRetry(sceneNumber)
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="glass-card border-[#C62828]/40 overflow-hidden h-full flex flex-col justify-between">
      <div>
        <div className="bg-[#FFEBEE]/80 px-3 py-2 flex items-center justify-between border-b border-[#C62828]/20">
          <span className="bg-[#C62828] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Scene {sceneNumber}
          </span>
        </div>
        <div className="p-3">
          <p className="text-[12px] italic text-[#555555] mb-2 leading-relaxed">&ldquo;{scriptLine}&rdquo;</p>
          <div className="bg-[#FFEBEE]/80 border border-[#C62828]/30 rounded-lg p-2.5 mb-2">
            <p className="text-[12px] font-semibold text-[#C62828] flex items-center justify-between">
              <span>⚠ Failed to generate.</span>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="underline font-bold hover:text-[#B71C1C] cursor-pointer ml-1"
              >
                [Retry]
              </button>
            </p>
            {message && message !== 'Failed to generate.' && (
              <p className="text-[10px] text-[#C62828]/80 mt-1">{message}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-3 pt-0">
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#C62828] hover:bg-[#B71C1C] disabled:opacity-60 disabled:cursor-not-allowed px-3 py-2 rounded-lg transition-colors shadow-sm"
        >
          {retrying && (
            <div className="loading-spinner-circle" style={{ width: '12px', height: '12px', borderWidth: '1.5px', borderTopColor: '#FFFFFF' }} />
          )}
          {retrying ? 'Retrying...' : 'Retry Scene'}
        </button>
      </div>
    </div>
  )
}
