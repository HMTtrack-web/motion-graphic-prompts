'use client'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingSpinner({ message = 'Generating with Gemini AI...', size = 'md' }: LoadingSpinnerProps) {
  const isSm = size === 'sm'

  if (isSm) {
    return (
      <div className="inline-flex items-center gap-2">
        <div
          style={{
            width: '18px',
            height: '18px',
            border: '2px solid #eee',
            borderTop: '2px solid #C62828',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block',
          }}
        />
        {message && <span className="text-xs font-semibold text-[#C62828]">{message}</span>}
      </div>
    )
  }

  const dim = size === 'lg' ? 24 : 20

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      <div
        style={{
          width: `${dim}px`,
          height: `${dim}px`,
          border: '2px solid #eee',
          borderTop: '2px solid #C62828',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          display: 'inline-block',
        }}
      />
      {message && (
        <p className="text-sm font-semibold text-[#C62828]">{message}</p>
      )}
    </div>
  )
}
