'use client'

import { useEffect, useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'

export default function ProgressBar() {
  const loading = useProjectStore((s) => s.loading)
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (loading) {
      setVisible(true)
      setWidth(0)
      // Animate to ~85% while loading
      const t1 = setTimeout(() => setWidth(30), 50)
      const t2 = setTimeout(() => setWidth(60), 500)
      const t3 = setTimeout(() => setWidth(85), 1500)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    } else {
      // Complete animation then hide
      setWidth(100)
      const t = setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 400)
      return () => clearTimeout(t)
    }
  }, [loading])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1">
      <div
        className="h-full bg-[#C62828] transition-all duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
