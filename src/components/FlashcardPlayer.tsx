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
  const [isSortingMode, setIsSortingMode] = useState(false)
  const [knowCards, setKnowCards] = useState<Set<string>>(new Set())
  const [dontKnowCards, setDontKnowCards] = useState<Set<string>>(new Set())

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

  const progress = ((currentIndex + 1) / cards.length) * 100

  const getFontSize = (text: string) => {
    if (text.length > 200) return 'text-lg md:text-xl'
    if (text.length > 100) return 'text-xl md:text-2xl'
    if (text.length > 50) return 'text-2xl md:text-3xl'
    return 'text-3xl md:text-5xl'
  }

  const reset = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setCards(initialCards)
    setIsShuffled(false)
    setAutoPlaySpeed(null)
    setKnowCards(new Set())
    setDontKnowCards(new Set())
    setIsSortingMode(false)
  }

  const handleSortCard = useCallback((isKnown: boolean) => {
    const cardId = cards[currentIndex].id
    if (isKnown) {
      setKnowCards(prev => new Set(prev).add(cardId))
      setDontKnowCards(prev => {
        const next = new Set(prev)
        next.delete(cardId)
        return next
      })
    } else {
      setDontKnowCards(prev => new Set(prev).add(cardId))
      setKnowCards(prev => {
        const next = new Set(prev)
        next.delete(cardId)
        return next
      })
    }
    
    // Automatically move to next card
    if (currentIndex < cards.length - 1) {
      handleNext()
    }
  }, [cards, currentIndex, handleNext])

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



  return (
    <div className={`fixed inset-0 z-[300] bg-background flex flex-col transition-all duration-500 ${isFocusMode ? 'p-0' : 'p-4 md:p-12'}`}>
      
      {/* Header Bar */}
      {!isFocusMode && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-12">
          <div className="flex items-center justify-between w-full md:w-auto">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground truncate">
              Flashcards <span className="text-muted-foreground font-medium ml-1 hidden sm:inline">— {deckTitle}</span>
            </h1>
            <button 
              onClick={onClose}
              className="md:hidden p-2 rounded-xl bg-destructive/10 text-destructive"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <div className="flex bg-muted border border-border p-1 rounded-xl md:rounded-2xl flex-shrink-0">
              {[3, 5, 10].map(s => (
                <button 
                  key={s}
                  onClick={() => setAutoPlaySpeed(v => v === s ? null : s)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${autoPlaySpeed === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {s}s
                </button>
              ))}
            </div>

            <button 
              onClick={toggleShuffle}
              className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl border transition-all text-[9px] md:text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${isShuffled ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-border text-muted-foreground hover:text-foreground'}`}
            >
              <Shuffle className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Shuffle</span>
            </button>
            
            <button 
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl bg-muted border border-border text-muted-foreground transition-all text-[9px] md:text-[10px] font-black uppercase tracking-widest flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Reset</span>
            </button>

            <button 
              onClick={() => setIsSortingMode(!isSortingMode)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${isSortingMode ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-muted border-border text-muted-foreground hover:text-foreground'}`}
            >
              <HelpCircle className="w-4 h-4" /> Sorting
            </button>

            <button 
              onClick={() => setIsFocusMode(true)}
              className="hidden sm:flex items-center gap-2 px-5 py-3 rounded-2xl bg-muted border border-border text-muted-foreground transition-all text-[10px] font-black uppercase tracking-widest flex-shrink-0"
            >
              <Maximize2 className="w-4 h-4" /> Focus
            </button>

            <button 
              onClick={onClose}
              className="hidden md:flex p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Progress Line */}
      <div className="w-full h-1 bg-muted relative overflow-hidden mb-8 md:mb-12">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col items-center justify-center relative ${isFocusMode ? 'p-6 md:p-12' : ''}`}>
        
        {isFocusMode && (
          <button 
            onClick={() => setIsFocusMode(false)}
            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 rounded-xl md:rounded-2xl bg-muted text-muted-foreground hover:text-foreground transition-all z-50"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="w-full max-w-4xl space-y-4 md:space-y-8">
          {/* Card Counter */}
          <div className="flex items-center justify-between px-2 md:px-4">
             <span className="text-[10px] md:text-xs font-black tracking-widest text-muted-foreground/30">{currentIndex + 1} / {cards.length}</span>
             <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">Active Learning</span>
          </div>

          {/* Flashcard */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="group relative w-full aspect-[4/5] sm:aspect-[16/9] cursor-pointer perspective-1000"
          >
            <motion.div 
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              className="w-full h-full relative preserve-3d"
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-card border border-border rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-4 md:space-y-6 shadow-2xl overflow-y-auto custom-scrollbar">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20 flex-shrink-0">Question</span>
                <h2 className={`${getFontSize(cards[currentIndex].question)} font-black text-foreground leading-tight px-4`}>
                  {cards[currentIndex].question}
                </h2>
                <span className="text-[10px] font-bold text-muted-foreground/40 mt-2 md:mt-4 flex-shrink-0">Click or press <span className="bg-muted px-2 py-1 rounded-md">Space</span> to flip</span>
              </div>

              {/* Back */}
              <div className="absolute inset-0 backface-hidden bg-primary border border-primary/20 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-4 md:space-y-6 shadow-2xl rotateY-180 overflow-y-auto custom-scrollbar">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground/40 flex-shrink-0">Answer</span>
                <h2 className={`${getFontSize(cards[currentIndex].answer)} font-black text-primary-foreground leading-tight px-4`}>
                  {cards[currentIndex].answer}
                </h2>
                <span className="text-[10px] font-bold text-primary-foreground/40 mt-2 md:mt-4 flex-shrink-0">Click to flip back</span>
              </div>
            </motion.div>
          </div>
          {/* Navigation & Sorting Controls */}
          <div className="flex flex-col items-center gap-6 pt-4">
            {isSortingMode ? (
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="flex items-center justify-center gap-6 w-full max-w-sm">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSortCard(false); }}
                    className="flex-1 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 group shadow-sm font-black uppercase tracking-widest text-[10px]"
                  >
                    <X className="w-5 h-5 transition-transform group-hover:scale-110" />
                    Don't Know
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSortCard(true); }}
                    className="flex-1 py-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-3 group shadow-sm font-black uppercase tracking-widest text-[10px]"
                  >
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:scale-110" />
                    Known
                  </button>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{knowCards.size} <span className="text-muted-foreground font-medium">Known</span></span>
                  </div>
                  <div className="w-[1px] h-3 bg-border" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{dontKnowCards.size} <span className="text-muted-foreground font-medium">To Review</span></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full px-4 md:px-8">
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all group"
                >
                  <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  Prev
                </button>
                
                <div className="hidden sm:flex items-center gap-2">
                  {cards.length < 20 && cards.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted'}`} 
                    />
                  ))}
                  {cards.length >= 20 && (
                    <span className="text-[10px] font-black text-muted-foreground/50">{currentIndex + 1} / {cards.length}</span>
                  )}
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all group"
                >
                  Next
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            )}
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary), 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary), 0.4);
        }
      `}</style>
    </div>
  )
}
