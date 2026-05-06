'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface MascotBannerProps {
  streak: number
  mastery: number
}

const MESSAGES = {
  inactive: [
    "Uy… buhay ka pa? 😭 Aral muna tayo.",
    "Kahit isang card lang today, okay na 😌",
    "Miss ka na ng brain cells mo… review na 👀",
    "Hindi pa huli ang lahat—start small.",
    "Wag mo hintayin exam week 😤"
  ],
  started: [
    "Good start! Tuloy mo lang 💪",
    "Isang card naging sampu na ‘yan mamaya 😏",
    "Warm-up pa lang ‘to. Keep going!",
    "Nice! Momentum na ‘to 🔥",
    "Sige pa… nandiyan ka na eh 😌"
  ],
  consistent: [
    "Grabe, tuloy-tuloy ka ah 🔥",
    "Disiplina > motivation 😤",
    "Iba ka… consistency is power 💪",
    "Ganito talaga nagiging top student 👀",
    "Keep it up—malapit ka na sa mastery."
  ],
  mastery: [
    "Easy na ‘to sayo ah 😏",
    "From ‘huh?’ to ‘gets ko na’ real quick 🔥",
    "Mastery looks good on you 💯",
    "Kaya mo na ‘to kahit nakapikit 😌",
    "Level up na—challenge yourself more!"
  ],
  struggling: [
    "Okay lang ‘yan—dito ka natututo 💪",
    "Mistakes = progress. Tuloy lang.",
    "Hindi ka bobo—practice lang kulang 😌",
    "Balikan natin ulit, kaya ‘to.",
    "Slow lang, pero sure 🔥"
  ],
  lateNight: [
    "Midnight grind? Respect 😴🔥",
    "Aral ngayon, tulog mamaya 😌",
    "Kaya pa? Isa pa 😏",
    "Future you is proud.",
    "Wag kalimutan matulog ha 😭"
  ],
  milestone: [
    "AYAN NA! 🔥 Proud ako sayo!",
    "Progress unlocked 😤",
    "Hindi ka na beginner 👀",
    "Keep going—next milestone naman!",
    "Small wins, big results 💯"
  ]
}

export default function MascotBanner({ streak, mastery }: MascotBannerProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    // Determine category based on activity
    const hour = new Date().getHours()
    let category: keyof typeof MESSAGES = 'inactive'

    if (hour >= 23 || hour <= 4) category = 'lateNight'
    else if (mastery > 90) category = 'milestone'
    else if (mastery > 70) category = 'mastery'
    else if (streak > 5) category = 'consistent'
    else if (streak > 0) category = 'started'
    else if (mastery < 20 && mastery > 0) category = 'struggling'
    else category = 'inactive'

    const possibleMessages = MESSAGES[category]
    const randomMessage = possibleMessages[Math.floor(Math.random() * possibleMessages.length)]

    // Typing effect simulation
    let i = 0
    setIsTyping(true)
    const interval = setInterval(() => {
      setMessage(randomMessage.slice(0, i))
      i++
      if (i > randomMessage.length) {
        clearInterval(interval)
        setIsTyping(false)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [streak, mastery])

  return (
    <div className="relative w-full h-full z-30 pointer-events-none">
      {/* Shadow */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/20 blur-xl rounded-[100%] scale-x-150" />

      {/* Speech Bubble */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className="absolute top-1/2 -translate-y-1/2 -left-80 bg-white text-[#3e4a3d] p-6 rounded-3xl shadow-2xl border border-slate-100 min-w-[240px] max-w-[320px] z-[60] pointer-events-auto"
          >
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-[#3e4a3d] uppercase tracking-[0.2em]">Repolyo says:</span>
              <p className="text-lg font-bold leading-relaxed">
                {message}
                {isTyping && <span className="animate-pulse inline-block ml-1">|</span>}
              </p>
            </div>
            {/* Bubble Tail (pointing right from middle) */}
            <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[15px] border-l-white shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>


      {/* Mascot GIF */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-full h-full"
      >
        <Image
          src="/repoquizgif.gif"
          alt="Repolyo"
          fill
          className="object-contain mix-blend-screen relative z-10"
          unoptimized
        />
      </motion.div>
    </div>
  )
}
