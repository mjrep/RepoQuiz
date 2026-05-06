'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface Card {
  id: string
  question: string
  answer: string
  multiple_choice_options: string[]
}

export default function StudyPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState<'flashcard' | 'quiz'>('flashcard')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isSortingMode, setIsSortingMode] = useState(false)
  const [knowCards, setKnowCards] = useState<Set<string>>(new Set())
  const [dontKnowCards, setDontKnowCards] = useState<Set<string>>(new Set())
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', id)
        .order('id', { ascending: true })

      if (!error && data) {
        setCards(data)
      }
      setLoading(false)
    }

    if (id) fetchCards()
  }, [id, supabase])

  // CRITICAL STATE MANAGEMENT: Reset states when navigating
  const goToNextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setIsFlipped(false)
      setSelectedOption(null)
    } else {
      setShowSummary(true)
    }
  }

  const handleSortCard = (isKnown: boolean) => {
    const cardId = cards[currentIndex].id
    if (isKnown) {
      setKnowCards(prev => {
        const next = new Set(prev)
        next.add(cardId)
        return next
      })
      setDontKnowCards(prev => {
        const next = new Set(prev)
        next.delete(cardId)
        return next
      })
    } else {
      setDontKnowCards(prev => {
        const next = new Set(prev)
        next.add(cardId)
        return next
      })
      setKnowCards(prev => {
        const next = new Set(prev)
        next.delete(cardId)
        return next
      })
    }
    
    if (currentIndex < cards.length - 1) {
      goToNextCard()
    } else {
      setShowSummary(true)
    }
  }

  const goToPrevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setIsFlipped(false)
      setSelectedOption(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black mb-4">No cards found in this deck.</h2>
        <Link
          href={`/dashboard/deck/${id}`}
          className="bg-blue-600 px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all"
        >
          Go Back & Add Cards
        </Link>
      </div>
    )
  }

  const currentCard = cards[currentIndex]
  const progress = ((currentIndex + 1) / cards.length) * 100

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      {/* Top Progress Bar */}
      <div className="h-1.5 w-full bg-[#1a1a1a] sticky top-0 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-8">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/deck/${id}`}
              className="w-10 h-10 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center hover:bg-white hover:text-black transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                Study Session
              </span>
              <h1 className="text-lg font-bold leading-none">Card {currentIndex + 1} of {cards.length}</h1>
            </div>
          </div>

          {/* Mode & Sorting Toggle Switch */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Study Mode */}
            <div className="flex bg-[#141414] border border-[#262626] rounded-2xl p-1 p-x-1.5">
              <button
                onClick={() => setStudyMode('flashcard')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  studyMode === 'flashcard' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'
                }`}
              >
                Flashcard
              </button>
              <button
                onClick={() => setStudyMode('quiz')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  studyMode === 'quiz' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'
                }`}
              >
                Quiz
              </button>
            </div>

            {/* Sorting Mode Toggle */}
            {studyMode === 'flashcard' && (
              <button
                onClick={() => setIsSortingMode(!isSortingMode)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${
                  isSortingMode 
                    ? 'bg-blue-600/10 border-blue-500 text-blue-500 shadow-lg shadow-blue-500/10' 
                    : 'bg-[#141414] border-[#262626] text-gray-500 hover:border-gray-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 transition-all ${isSortingMode ? 'bg-blue-500 border-blue-500' : 'border-gray-700'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">Sorting Mode</span>
              </button>
            )}
          </div>
        </div>

        {/* Study Area / Summary Area */}
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          {showSummary ? (
            <div className="w-full max-w-2xl bg-[#141414] border border-[#262626] rounded-[3rem] p-12 text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black mb-4">Session Complete!</h2>
              <p className="text-gray-500 mb-12">You've reached the end of the deck.</p>
              
              <div className="grid grid-cols-2 gap-6 mb-12">
                <div className="p-8 rounded-[2rem] bg-green-500/10 border border-green-500/20">
                  <div className="text-4xl font-black text-green-500 mb-2">{knowCards.size}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-green-500/50">Known</div>
                </div>
                <div className="p-8 rounded-[2rem] bg-red-500/10 border border-red-500/20">
                  <div className="text-4xl font-black text-red-500 mb-2">{dontKnowCards.size}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-red-500/50">To Review</div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    setCurrentIndex(0)
                    setIsFlipped(false)
                    setShowSummary(false)
                    setKnowCards(new Set())
                    setDontKnowCards(new Set())
                  }}
                  className="w-full py-5 bg-white text-black rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Restart Session
                </button>
                <Link
                  href={`/dashboard/deck/${id}`}
                  className="w-full py-5 bg-[#262626] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-[#333] transition-all"
                >
                  Return to Deck
                </Link>
              </div>
            </div>
          ) : studyMode === 'flashcard' ? (
            <div className="w-full max-w-2xl perspective-1000">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`relative w-full aspect-[4/3] cursor-pointer transition-all duration-700 preserve-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-[#141414] border border-[#262626] rounded-[3rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-600 mb-8">Question</span>
                  <p className="text-2xl md:text-4xl font-bold leading-tight">{currentCard.question}</p>
                  <div className="mt-12 text-blue-500/50 text-xs font-bold uppercase tracking-widest animate-pulse">Click to Reveal</div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-blue-600 border border-blue-400 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl">
                  <span className="text-xs font-black uppercase tracking-widest text-white/50 mb-8">Answer</span>
                  <p className="text-2xl md:text-4xl font-bold leading-tight text-white">{currentCard.answer}</p>
                </div>
              </div>

              {/* Navigation & Sorting Controls */}
              <div className="flex flex-col items-center gap-8 mt-12">
                {isSortingMode ? (
                  <div className="flex items-center justify-center gap-6 w-full max-w-sm">
                    <button
                      onClick={() => handleSortCard(false)}
                      className="flex-1 py-6 rounded-[2rem] bg-red-500/10 border-2 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <svg className="w-8 h-8 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-[10px] font-black uppercase tracking-widest">Don't Know</span>
                    </button>
                    <button
                      onClick={() => handleSortCard(true)}
                      className="flex-1 py-6 rounded-[2rem] bg-green-500/10 border-2 border-green-500/50 text-green-500 hover:bg-green-500 hover:text-white transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <svg className="w-8 h-8 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[10px] font-black uppercase tracking-widest">I Know This</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={goToPrevCard}
                      disabled={currentIndex === 0}
                      className="w-16 h-16 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center hover:border-white transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                    >
                      <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={goToNextCard}
                      disabled={currentIndex === cards.length - 1}
                      className="w-16 h-16 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center hover:border-white transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                    >
                      <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Sorting Stats Indicator */}
                {isSortingMode && (
                  <div className="flex gap-4">
                    <div className="px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">{knowCards.size} Known</span>
                    </div>
                    <div className="px-4 py-2 bg-red-500/10 rounded-full border border-red-500/20">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{dontKnowCards.size} To Review</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-2xl flex flex-col animate-in fade-in slide-in-from-bottom-4">
              <div className="mb-12 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-6 block">Question</span>
                <h2 className="text-2xl md:text-4xl font-bold leading-tight px-4">{currentCard.question}</h2>
              </div>

              {currentCard.multiple_choice_options && currentCard.multiple_choice_options.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {currentCard.multiple_choice_options.map((option, idx) => {
                    const isCorrect = option === currentCard.answer
                    const isSelected = selectedOption === option
                    
                    let bgClass = 'bg-[#141414] border-[#262626] hover:border-[#3a3a3a]'
                    if (selectedOption) {
                      if (isCorrect) bgClass = 'bg-green-500/20 border-green-500/50 text-green-400'
                      else if (isSelected) bgClass = 'bg-red-500/20 border-red-500/50 text-red-400'
                      else bgClass = 'bg-[#0d0d0d] border-[#1a1a1a] opacity-50'
                    }

                    return (
                      <button
                        key={idx}
                        disabled={!!selectedOption}
                        onClick={() => setSelectedOption(option)}
                        className={`
                          w-full p-6 md:p-8 rounded-[2rem] border-2 text-lg md:text-xl font-bold transition-all text-left flex items-center gap-6
                          ${bgClass}
                          active:scale-[0.98] disabled:active:scale-100
                        `}
                      >
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-black transition-all ${
                          isSelected ? 'bg-current text-[#0a0a0a] border-current' : 'border-[#262626] text-gray-500'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        {option}
                      </button>
                    )
                  })}
                  
                  {selectedOption && (
                    <button
                      onClick={goToNextCard}
                      disabled={currentIndex === cards.length - 1}
                      className="mt-8 w-full py-6 bg-white text-black rounded-[2rem] font-black text-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-2xl disabled:opacity-20"
                    >
                      {currentIndex === cards.length - 1 ? 'End of Session' : 'Next Question'}
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 border border-[#1a1a1a] rounded-[3rem] bg-[#0d0d0d]">
                  <span className="text-4xl mb-6">⚠️</span>
                  <p className="text-gray-500 text-center max-w-xs leading-relaxed">
                    This card is strictly Q&A. Switch to <span className="text-white font-bold">Flashcard Mode</span> to study it.
                  </p>
                  <button
                    onClick={() => setStudyMode('flashcard')}
                    className="mt-8 text-blue-500 font-black uppercase tracking-widest text-xs hover:text-blue-400 transition-colors"
                  >
                    Switch Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  )
}
