'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function LoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Show bar on route change start
    setLoading(true)
    const timeout = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timeout)
  }, [pathname, searchParams])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[9999] overflow-hidden bg-transparent">
      <div className="h-full bg-primary animate-progress-bar shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
      <style jsx>{`
        .animate-progress-bar {
          width: 0%;
          animation: progress 0.6s ease-in-out forwards;
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}
