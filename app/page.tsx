'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getDailyIdeas, saveDailyIdeas, getHistory } from '@/lib/localStorage'
import { ProjectHistory } from '@/types'
import { useProjectStore } from '@/store/useProjectStore'
import HistoryCard from '@/components/HistoryCard'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function HomePage() {
  const router = useRouter()
  const { setTopic, setSelectedIdea, setCurrentStage, reset } = useProjectStore()
  const [dailyIdeas, setDailyIdeas] = useState<string[]>([])
  const [loadingIdeas, setLoadingIdeas] = useState(true)
  const [history, setHistory] = useState<ProjectHistory[]>([])

  // Fluid mouse tracking state
  const [coords, setCoords] = useState({ x: 0, y: 0, rawX: 0, rawY: 0 })
  const targetCoords = useRef({ x: 0, y: 0, rawX: 0, rawY: 0 })
  const currentCoords = useRef({ x: 0, y: 0, rawX: 0, rawY: 0 })
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    // Smooth lerp mouse tracking loop
    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2 // -1 to 1
      const normY = (e.clientY / window.innerHeight - 0.5) * 2 // -1 to 1
      targetCoords.current = {
        x: normX,
        y: normY,
        rawX: e.clientX,
        rawY: e.clientY,
      }
    }

    const animate = () => {
      const lerpFactor = 0.06 // smooth liquid inertia
      currentCoords.current.x += (targetCoords.current.x - currentCoords.current.x) * lerpFactor
      currentCoords.current.y += (targetCoords.current.y - currentCoords.current.y) * lerpFactor
      currentCoords.current.rawX += (targetCoords.current.rawX - currentCoords.current.rawX) * lerpFactor
      currentCoords.current.rawY += (targetCoords.current.rawY - currentCoords.current.rawY) * lerpFactor

      setCoords({
        x: currentCoords.current.x,
        y: currentCoords.current.y,
        rawX: currentCoords.current.rawX,
        rawY: currentCoords.current.rawY,
      })

      rafId.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove)
    rafId.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [])

  useEffect(() => {
    const cursor = document.getElementById('liquid-cursor')
    const move = (e: MouseEvent) => {
      if (cursor) {
        cursor.style.left = e.clientX + 'px'
        cursor.style.top = e.clientY + 'px'
      }
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  useEffect(() => {
    // Load history
    setHistory(getHistory().slice(0, 5))

    // Load daily ideas
    const cached = getDailyIdeas()
    if (cached && cached.length > 0) {
      setDailyIdeas(cached)
      setLoadingIdeas(false)
      return
    }

    const DEFAULT_FALLBACK_IDEAS = [
      "The Truth About Why You Can't Focus Anymore",
      "Why Staying Consistent Feels So Hard",
      "Nobody Tells You How Apps Exploit Your Brain",
      "The Hidden Cost of Cheap Dopamine",
      "The Real Reason You Buy Things You Don't Need",
    ]

    fetch('/api/generate/daily-ideas')
      .then((r) => r.json())
      .then((data) => {
        if (data.ideas && Array.isArray(data.ideas) && data.ideas.length > 0) {
          saveDailyIdeas(data.ideas)
          setDailyIdeas(data.ideas)
        } else {
          setDailyIdeas(DEFAULT_FALLBACK_IDEAS)
        }
      })
      .catch(() => {
        setDailyIdeas(DEFAULT_FALLBACK_IDEAS)
      })
      .finally(() => setLoadingIdeas(false))
  }, [])

  const handleStartWithTopic = (topic: string) => {
    reset()
    setTopic(topic)
    setSelectedIdea('')
    setCurrentStage(1)
    router.push('/stage/1')
  }

  const handleStart = () => {
    reset()
    setCurrentStage(1)
    router.push('/stage/1')
  }

  const handleStartWithScript = () => {
    reset()
    router.push('/script-input')
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden select-none font-sans">
      {/* Liquid cursor orb (follows mouse, see useEffect above) */}
      <div id="liquid-cursor" />

      {/* ============================================================ */}
      {/* 1. FIXED BRAND NAME: Pinned top-left at the red liquid ribbon */}
      {/* ============================================================ */}
      <header className="fixed top-6 left-8 z-50 pointer-events-auto">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push('/')}>
          <span className="text-[21px] font-black tracking-tight text-[#8b0000] drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] transition-transform group-hover:scale-105">
            MotionGraphicPrompts
          </span>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. LIQUID BACKGROUND LAYER (Floats smoothly with cursor)      */}
      {/* ============================================================ */}
      <div
        className="fixed pointer-events-none -z-10 transition-transform will-change-transform ease-out"
        style={{
          inset: '-45px',
          backgroundImage: 'url(/liquid_cream_bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translate3d(${coords.x * -24}px, ${coords.y * -20}px, 0) scale(1.05)`,
        }}
      >
        {/* Dynamic ambient specular reflection tracking cursor */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-80"
          style={{
            background: `radial-gradient(circle 550px at ${coords.rawX}px ${coords.rawY}px, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.1) 45%, transparent 75%)`,
          }}
        />
      </div>

      {/* ============================================================ */}
      {/* 3. INTERACTIVE CONTENT (Floats in 3D parallax with cursor)    */}
      {/* ============================================================ */}
      <main className="relative z-10 flex-1 flex flex-col justify-between pt-24 pb-12 px-6">
        {/* HERO SECTION */}
        <section
          className="hero-glass max-sm:!px-4 max-sm:!py-10 max-w-[840px] mx-auto w-full text-center mt-6 mb-14 hero-enter transition-transform will-change-transform"
          style={{
            transform: `translate3d(${coords.x * 12}px, ${coords.y * 10}px, 0) rotateX(${coords.y * -1.8}deg) rotateY(${coords.x * 1.8}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Main Headline */}
          <h1 className="text-[38px] md:text-[52px] font-extrabold text-[#111111] leading-[1.12] tracking-tight mb-4 drop-shadow-[0_2px_12px_rgba(255,255,255,0.6)]">
            Turn Ideas Into<br />
            <span className="text-[#111111]">Scroll-Stopping Motion</span>
          </h1>

          {/* Subtext */}
          <p className="text-[15px] md:text-[17px] text-[#444444] font-medium mb-8 max-w-[500px] mx-auto leading-relaxed drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)]">
            Transform any topic into compelling motion graphic prompts in seconds.
          </p>


          {/* 3D Liquid Jelly Pill Button */}
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={handleStart}
              className="ruby-jelly-btn group px-8 py-3.5 rounded-full inline-flex items-center gap-2.5 text-white font-bold text-[15px] tracking-wide active:scale-95"
            >
              <span>Start Creating</span>
              <span className="text-[17px] transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>
            <p className="text-[12px] text-[#444444] font-medium mt-3 tracking-wide drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
              No sign-up. Free to use.
            </p>
          </div>

          {/* Divider */}
          <p className="text-[13px] text-[#444444] font-medium mt-10 mb-5 tracking-wide">
            — or choose your path —
          </p>

          {/* Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {/* Card 1: Topic to Motion (existing flow) */}
            <div className="glass-card p-5 flex flex-col">
              <span className="text-[26px] mb-2" aria-hidden="true">✨</span>
              <h3 className="text-[17px] font-bold text-[#111111] mb-1">Topic to Motion</h3>
              <p className="text-[13.5px] text-[#444444] leading-relaxed mb-5">
                Enter a topic, get viral ideas, script, and all prompts
              </p>
              <button
                onClick={handleStart}
                className="mt-auto w-full bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold text-[14px] px-4 py-2.5 rounded-xl transition-colors"
              >
                Start with a Topic →
              </button>
            </div>

            {/* Card 2: Script to Motion (new flow) */}
            <div className="glass-card p-5 flex flex-col">
              <span className="text-[26px] mb-2" aria-hidden="true">📝</span>
              <h3 className="text-[17px] font-bold text-[#111111] mb-1">Script to Motion</h3>
              <p className="text-[13.5px] text-[#444444] leading-relaxed mb-5">
                Already have a script? Skip ahead and get your scene prompts instantly
              </p>
              <button
                onClick={handleStartWithScript}
                className="mt-auto w-full border-2 border-[#C62828] text-[#C62828] hover:bg-[#C62828] hover:text-white bg-transparent font-bold text-[14px] px-4 py-2.5 rounded-xl transition-colors"
              >
                Paste My Script →
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. TODAY'S TRENDING TOPICS (Liquid Frosted Glass Cards)      */}
        {/* ============================================================ */}
        <section
          className="glass-card max-w-[860px] mx-auto w-full mb-12 p-6 transition-transform will-change-transform"
          style={{
            transform: `translate3d(${coords.x * 6}px, ${coords.y * 6}px, 0)`,
          }}
        >
          {/* Section Header Pill */}
          <div className="liquid-header-pill inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl mb-5 shadow-sm">
            <div className="w-7 h-7 rounded-full bg-[#1b3b4b] flex items-center justify-center shadow-inner">
              <span className="text-white text-xs">🔥</span>
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-[#111111] leading-tight">
                Today&apos;s Trending Video Topics
              </h2>
              <p className="text-[11px] text-[#444444] font-medium">
                Click any topic to start building your prompts
              </p>
            </div>
          </div>

          {loadingIdeas && dailyIdeas.length === 0 && (
            <div className="py-6">
              <LoadingSpinner message="Loading trending topics..." size="sm" />
            </div>
          )}

          {dailyIdeas.length > 0 && (
            <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
              {dailyIdeas.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => handleStartWithTopic(idea)}
                  className="glass-card text-left p-4 flex flex-col justify-between group min-h-[105px]"
                >
                  <p className="text-[13.5px] font-bold text-[#111111] leading-snug group-hover:text-[#990000] transition-colors line-clamp-3">
                    {idea}
                  </p>
                  <span className="text-[11.5px] font-bold text-[#b71c1c] mt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Use this topic
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>


        {/* ============================================================ */}
        {/* 5. RECENT PROJECTS SECTION                                   */}
        {/* ============================================================ */}
        <section
          className="glass-card max-w-[860px] mx-auto w-full mb-8 p-6 transition-transform will-change-transform"
          style={{
            transform: `translate3d(${coords.x * 4}px, ${coords.y * 4}px, 0)`,
          }}
        >
          {/* Header Pill */}
          <div className="liquid-header-pill inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl mb-4 shadow-sm">
            <div className="w-7 h-7 rounded-full bg-[#1b3b4b] flex items-center justify-center shadow-inner">
              <span className="text-white text-xs">📂</span>
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-[#111111] leading-tight">
                Recent Projects
              </h2>
              <p className="text-[11px] text-[#444444] font-medium">
                Continue where you left off
              </p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="glass-card p-6 text-center border-dashed border-white/80">
              <p className="text-[#444444] text-[13.5px] font-medium mb-1.5">No projects yet.</p>
              <button
                onClick={handleStart}
                className="text-[#b71c1c] font-bold text-[13px] hover:underline"
              >
                Start your first one →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((project) => (
                <div key={project.id} className="glass-card overflow-hidden">
                  <div className="px-4 pt-3">
                    <span className="inline-block text-[11px] font-semibold text-[#555555] bg-gray-200/80 rounded-full px-2.5 py-0.5">
                      {project.isDirectScript ? '📝 Script Flow' : '✨ Topic Flow'}
                    </span>
                  </div>
                  <HistoryCard project={project} />
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* ============================================================ */}
      {/* 6. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="relative z-10 py-4 text-center">
        <p className="text-[12px] font-medium text-[#444444] tracking-wide drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
          An initiative by HMT
        </p>
      </footer>
    </div>
  )
}
