'use client'

interface IdeaCardProps {
  title: string
  selected: boolean
  onSelect: () => void
  index: number
}

export default function IdeaCard({ title, selected, onSelect, index }: IdeaCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200
        hover:scale-[1.02] hover:shadow-md select-none
        ${selected
          ? 'border-[#C62828] bg-[#FFEBEE] shadow-md scale-[1.02]'
          : 'border-[#E0E0E0] bg-white hover:border-[#C62828]'
        }
      `}
    >
      {/* Scene number */}
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#BDBDBD] mb-2 block">
        Idea {index + 1}
      </span>

      {/* Title */}
      <p className={`text-[15px] font-semibold leading-snug ${selected ? 'text-[#C62828]' : 'text-[#111111]'}`}>
        {title}
      </p>

      {/* Checkmark badge */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-[#C62828] rounded-full flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  )
}
