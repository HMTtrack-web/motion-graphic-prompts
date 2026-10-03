'use client'

import { useState } from 'react'
import { SceneImagePrompt } from '@/types'
import CopyButton from './CopyButton'

interface SceneCardProps {
  scene: SceneImagePrompt
  onRegenerate?: (sceneNumber: number) => Promise<void>
  showMotionPrompt?: boolean
  motionPrompt?: string
}

export default function SceneCard({ scene, onRegenerate, showMotionPrompt = false, motionPrompt }: SceneCardProps) {
  const [regenerating, setRegenerating] = useState(false)

  const handleRegenerate = async () => {
    if (!onRegenerate || regenerating) return
    setRegenerating(true)
    try {
      await onRegenerate(scene.scene_number)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="glass-card overflow-hidden h-full flex flex-col justify-between">
      <div>
        {/* Scene header */}
        <div className="bg-white/50 border-b border-black/5 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#C62828] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Scene {scene.scene_number}
            </span>
          </div>
          {onRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#C62828] hover:bg-[#FFEBEE] px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {regenerating ? (
                <div className="loading-spinner-circle" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }} />
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4-4.64 4.36A9 9 0 013.51 15" />
                </svg>
              )}
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          )}
        </div>

        {showMotionPrompt ? (
          /* Stacked layout inside card for 3-column grid in Stage 5 */
          <div className="p-3 flex flex-col gap-3">
            {/* Image Prompt */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#555555] mb-1.5 flex items-center gap-1">
                🖼️ Image Prompt
              </p>
              <p className="text-[12px] italic text-[#555555] mb-2 leading-relaxed">
                &ldquo;{scene.script_line}&rdquo;
              </p>
              <div className="bg-black/5 border border-black/5 rounded-lg p-2.5 mb-2">
                <pre className="text-[11px] font-mono text-[#111111] whitespace-pre-wrap break-words leading-relaxed">
                  {scene.image_prompt}
                </pre>
              </div>
              <CopyButton text={scene.image_prompt} label="Copy Image Prompt" size="sm" />
            </div>

            {/* Motion Prompt */}
            <div className="pt-2.5 border-t border-black/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#555555] mb-1.5 flex items-center gap-1">
                🎬 Motion Prompt (Google Flow)
              </p>
              {motionPrompt ? (
                <>
                  <div className="bg-black/5 border border-black/5 rounded-lg p-2.5 mb-2">
                    <pre className="text-[11px] font-mono text-[#111111] whitespace-pre-wrap break-words leading-relaxed">
                      {motionPrompt}
                    </pre>
                  </div>
                  <CopyButton text={motionPrompt} label="Copy Motion Prompt" size="sm" />
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 h-16">
                  <div className="loading-spinner-circle" style={{ width: '16px', height: '16px' }} />
                  <span className="text-[11px] text-[#888888]">Generating motion...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Single layout for Stage 4 */
          <div className="p-3 flex flex-col">
            {/* Script line */}
            <p className="text-[12px] italic text-[#555555] mb-2 leading-relaxed">
              &ldquo;{scene.script_line}&rdquo;
            </p>

            {/* Image prompt */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#111111] mb-1.5 flex items-center gap-1">
              🖼️ Image Generation Prompt
            </p>
            <div className="bg-black/5 border border-black/5 rounded-lg p-2.5 mb-2.5">
              <pre className="text-[11px] font-mono text-[#111111] whitespace-pre-wrap break-words leading-relaxed">
                {scene.image_prompt}
              </pre>
            </div>

            {/* Typography text */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#111111] mb-1.5 flex items-center gap-1">
              🔤 Typography Text
            </p>
            <div className="bg-[#FFEBEE]/80 border border-[#C62828]/25 rounded-lg px-2.5 py-1.5 mb-3">
              <p className="text-[13px] font-bold text-[#C62828]">{scene.typography_text}</p>
            </div>

            {/* Copy button */}
            <div className="mt-auto">
              <CopyButton text={scene.image_prompt} label="Copy Image Prompt" size="sm" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
