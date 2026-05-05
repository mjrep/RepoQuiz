'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Play, Shuffle, RotateCcw, Maximize2, ChevronLeft, 
  ChevronRight, X, Keyboard, HelpCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Card {
  id: string
  question: string
  answer: string
}

interface FlashcardPlayerProps {
  deckTitle: string
  cards: Card[]
  onClose: () => void
}

export default function FlashcardPlayer({ deckTitle, cards: initialCards, onClose }: FlashcardPlayerProps) {
  const [cards, setCards] = useState(initialCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [autoPlaySpeed, setAutoPlaySpeed] = useState<number | null>(null) // null, 3, 5, 10
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const router = useRouter()

  const handleNext = useCallback(() => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length)
    }, 150)
  }, [cards.length])

  const handlePrev = useCallback(() => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
    }, 150)
  }, [cards.length])

  const toggleShuffle = useCallback(() => {
    setIsShuffled(!isShuffled)
    if (!isShuffled) {
      setCards([...cards].sort(() => Math.random() - 0.5))
    } else {
      setCards(initialCards)
    }
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [isShuffled, cards, initialCards])

  const reset = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setCards(initialCards)
    setIsShuffled(false)
    setAutoPlaySpeed(null)
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setIsFlipped(v => !v); }
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 's' || e.key === 'S') toggleShuffle()
      if (e.key === 'f' || e.key === 'F') setIsFocusMode(v => !v)
      if (e.key === '?') setShowShortcuts(v => !v)
      if (e.key === 'Escape') {
        if (isFocusMode) setIsFocusMode(false)
        else if (showShortcuts) setShowShortcuts(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev, toggleShuffle, isFocusMode, showShortcuts, onClose])

  // Auto Play Timer
  useEffect(() => {
    if (autoPlaySpeed === null) return
    
    const interval = setInterval(() => {
      if (!isFlipped) {
        setIsFlipped(true)
      } else {
        handleNext()
      }
    }, autoPlaySpeed * 1000)

    return () => clearInterval(interval)
  }, [autoPlaySpeed, isFlipped, handleNext])

  const progress = ((currentIndex + 1) / cards.length) * 100

  return (
    <div className={`fixed inset-0 z-[300] bg-background flex flex-col transition-all duration-500 ${isFocusMode ? 'p-0' : 'p-6 md:p-12'}`}>
      
      {/* Header Bar */}
      {!isFocusMode && (
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Flashcard Mode <span className="text-muted-foreground font-medium ml-2">— {deckTitle}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-muted border border-border p-1 rounded-2xl">
              <button 
                onClick={() => setAutoPlaySpeed(v => v === 3 ? null : 3)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${autoPlaySpeed === 3 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                3s
              </button>
              <button 
                onClick={() => setAutoPlaySpeed(v => v === 5 ? null : 5)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${autoPlaySpeed === 5 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                5s
              </button>
              <button 
                onClick={() => setAutoPlaySpeed(v => v === 10 ? null : 10)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${autoPlaySpeed === 10 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                10s
              </button>
            </div>

            <button 
              onClick={toggleShuffle}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${isShuffled ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'}`}
            >
              <Shuffle className="w-4 h-4" /> Shuffle
            </button>
            
            <button 
              onClick={reset}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>

            <button 
              onClick={() => setIsFocusMode(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Maximize2 className="w-4 h-4" /> Focus
            </button>

            <button 
              onClick={() => setShowShortcuts(true)}
              className="p-3 rounded-2xl bg-muted border border-border text-muted-foreground hover:text-foreground transition-all"
            >
              <Keyboard className="w-5 h-5" />
            </button>

            <button 
              onClick={onClose}
              className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-all ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Progress Line */}
      <div className="w-full h-1 bg-muted relative overflow-hidden mb-12">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col items-center justify-center relative ${isFocusMode ? 'p-12' : ''}`}>
        
        {isFocusMode && (
          <button 
            onClick={() => setIsFocusMode(false)}
            className="absolute top-8 right-8 p-3 rounded-2xl bg-muted text-muted-foreground hover:text-foreground transition-all z-50"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="w-full max-w-4xl space-y-8">
          {/* Card Counter */}
          <div className="flex items-center justify-between px-4">
             <span className="text-xs font-black tracking-widest text-muted-foreground/30">{currentIndex + 1} / {cards.length}</span>
             <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">Active Learning</span>
          </div>

          {/* Flashcard */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="group relative w-full aspect-[16/9] cursor-pointer perspective-1000"
          >
            <motion.div 
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              className="w-full h-full relative preserve-3d"
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-card border border-border rounded-[3rem] p-16 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">Question</span>
                <h2 className="text-4xl md:text-5xl font-black text-foreground leading-tight">
                  {cards[currentIndex].question}
                </h2>
                <span className="text-xs font-bold text-muted-foreground/40 mt-8">Click or press <span className="bg-muted px-2 py-1 rounded-md">Space</span> to flip</span>
              </div>

              {/* Back */}
              <div className="absolute inset-0 backface-hidden bg-primary border border-primary/20 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl rotateY-180">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground/40">Answer</span>
                <h2 className="text-4xl md:text-5xl font-black text-primary-foreground leading-tight">
                  {cards[currentIndex].answer}
                </h2>
                <span className="text-xs font-bold text-primary-foreground/40 mt-8">Click to flip back</span>
              </div>
            </motion.div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between px-8 pt-8">
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all group"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Prev
            </button>
            
            <div className="flex items-center gap-2">
              {cards.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted'}`} 
                />
              ))}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all group"
            >
              Next
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-card border border-border rounded-[2.5rem] p-10 space-y-8"
            >
              <div className="flex items-center gap-4">
                <Keyboard className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-black text-foreground">Keyboard shortcuts</h2>
              </div>

              <div className="space-y-6">
                {[
                  { label: 'Flip card', key: 'Space' },
                  { label: 'Previous / Next', key: '← →' },
                  { label: 'Toggle shuffle', key: 'S' },
                  { label: 'Focus mode', key: 'F' },
                  { label: 'This overlay', key: '?' },
                  { label: 'Close overlay / exit', key: 'Esc' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-muted-foreground">{item.label}</span>
                    <span className="px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-black text-foreground">{item.key}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowShortcuts(false)}
                className="w-full py-4 bg-primary text-primary-foreground text-sm font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotateY-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
}
