'use client'

interface SceneSkeletonCardProps {
  sceneNumber: number
  isGenerating?: boolean
}

export default function SceneSkeletonCard({
  sceneNumber,
  isGenerating = false,
}: SceneSkeletonCardProps) {
  return (
    <div
      style={{
        minHeight: '320px',
        background: '#FFFFFF',
        backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)',
        backgroundSize: '18px 18px',
        borderRadius: '16px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '2px solid #111',
        boxShadow: isGenerating
          ? '0 0 0 2px #111, 0 12px 32px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.15)'
          : '0 0 0 2px #000, 0 8px 24px rgba(0,0,0,0.25)',
        transition: 'box-shadow 0.3s ease, border 0.3s ease',
        boxSizing: 'border-box',
      }}
      className="h-full select-none"
    >
      <div>
        {/* Scene number badge: visible but gray (#bbb) */}
        <div className="flex items-center justify-between">
          <span
            style={{
              background: '#F0F0F0',
              color: '#888888',
              border: '1px solid #DDDDDD',
            }}
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
          >
            Scene {sceneNumber}
          </span>
          {isGenerating && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#111111]">
              <span className="w-2 h-2 rounded-full bg-[#111111] animate-ping" />
              Generating...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
