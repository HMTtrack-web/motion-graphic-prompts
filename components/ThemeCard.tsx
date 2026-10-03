'use client'

import { Theme } from '@/types'

interface ThemeCardProps {
  theme: Theme
  selected: boolean
  recommended: boolean
  onSelect: () => void
  children?: React.ReactNode
}

const THEME_VISUALS: Record<string, { preview: string; tag: string }> = {
  Editorial: {
    preview: 'bg-[#FAF8F5]',
    tag: 'Best for: Psychology, Motivation, Mindset',
  },
  Technical: {
    preview: 'bg-[#1A1A2E]',
    tag: 'Best for: Finance, IT, Strategy',
  },
  Academic: {
    preview: 'bg-[#FFFDE7]',
    tag: 'Best for: Education, Behavioral Design, History',
  },
  Custom: {
    preview: 'bg-gradient-to-br from-gray-100 to-gray-200',
    tag: 'Your own colors and style',
  },
}

export default function ThemeCard({ theme, selected, recommended, onSelect, children }: ThemeCardProps) {
  const visuals = THEME_VISUALS[theme.name] || THEME_VISUALS.Custom

  return (
    <div
      onClick={onSelect}
      className={`
        relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200
        hover:shadow-md select-none
        ${selected
          ? 'border-[#C62828] shadow-md'
          : 'border-[#E0E0E0] bg-white hover:border-[#C62828]'
        }
      `}
    >
      {/* Recommended badge */}
      {recommended && (
        <div className="absolute -top-3 right-3 bg-[#C62828] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
          <span>⭐</span> Recommended
        </div>
      )}

      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-[#C62828] rounded-full flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Color preview swatch */}
      <div className={`h-16 rounded-lg mb-3 ${visuals.preview} flex items-center justify-center overflow-hidden`}>
        {theme.name !== 'Custom' && (
          <div
            className="w-8 h-8 rounded-full opacity-80"
            style={{ backgroundColor: theme.accent_color }}
          />
        )}
        {theme.name === 'Custom' && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.bg_color || '#ffffff' }} />
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.accent_color || '#C62828' }} />
          </div>
        )}
      </div>

      {/* Theme name */}
      <h3 className="text-[15px] font-bold text-[#111111] mb-1">
        {theme.name === 'Editorial' ? '🎨 Signature Editorial' :
         theme.name === 'Technical' ? '⚡ Dark Technical' :
         theme.name === 'Academic' ? '📚 High-Contrast Academic' :
         '✏️ Custom'}
      </h3>

      {/* Tag */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C62828] mb-2">
        {visuals.tag}
      </p>

      {/* Description */}
      {theme.name !== 'Custom' && (
        <p className="text-[13px] text-[#555555] leading-snug">{theme.description}</p>
      )}

      {/* Custom color pickers */}
      {theme.name === 'Custom' && children}
    </div>
  )
}
