'use client'

import { ProjectHistory } from '@/types'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import { restoreProjectFromHistory } from '@/lib/localStorage'

interface HistoryCardProps {
  project: ProjectHistory
}

export default function HistoryCard({ project }: HistoryCardProps) {
  const router = useRouter()
  const { setTopic, setSelectedIdea, setScript, setScenePlan, setTheme, setImagePrompts, setMotionPrompts, setCurrentStage, setIsDirectScript } =
    useProjectStore()

  const handleContinue = () => {
    const state = restoreProjectFromHistory(project)
    setTopic(state.topic)
    setSelectedIdea(state.selected_idea)
    setScript(state.script)
    setScenePlan(state.scene_plan)
    setTheme(state.theme)
    setImagePrompts(state.image_prompts)
    setMotionPrompts(state.motion_prompts)
    setCurrentStage(state.current_stage)
    setIsDirectScript(state.isDirectScript)
    router.push(`/stage/${state.current_stage}`)
  }

  const date = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="p-4 flex items-center justify-between gap-4 group">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[#0f2b38] group-hover:text-[#8b0000] transition-colors truncate">
          {project.selected_title}
        </p>
        <p className="text-[12px] text-[#4b606c] truncate mt-0.5">{project.topic}</p>
        <p className="text-[11px] text-[#718096] mt-1">{date} · Stage {project.current_stage} of 5</p>
      </div>
      <button
        onClick={handleContinue}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold text-[#b71c1c] bg-white/70 border border-[#b71c1c]/30 hover:bg-[#b71c1c] hover:text-white transition-all shadow-sm"
      >
        Continue
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
