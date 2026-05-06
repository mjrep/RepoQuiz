'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  X, Settings2, CheckCircle2, AlertCircle, 
  ChevronRight, Volume2, HelpCircle, Trophy,
  Brain
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

interface Card {
  id: string
  question: string
  answer: string
  multiple_choice_options?: string[]
}

interface Progress {
  card_id: string
  status: string
  consecutive_correct: number
}

interface QuizPlayerProps {
  deckId: string
  deckTitle: string
  cards: Card[]
  userId: string
  initialProgress: Progress[]
  onClose: () => void
  onProgressUpdate?: (progress: Progress[]) => void
}

export default function QuizPlayer({ deckId, deckTitle, cards, userId, initialProgress, onClose, onProgressUpdate }: QuizPlayerProps) {
  const [showOptions, setShowOptions] = useState(false)
  const [options, setOptions] = useState({
    roundLength: Math.min(20, cards.length),
    answerWith: 'definition' as 'term' | 'definition',
    shuffle: true,
    soundEffects: true
  })

  const [currentProgress, setCurrentProgress] = useState<Progress[]>(initialProgress)
  const [quizCards, setQuizCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)

  const supabase = createClient()

  // Sounds
  const playSound = (type: 'correct' | 'wrong') => {
    if (!options.soundEffects) return
    const audio = new Audio(type === 'correct' 
      ? 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3' 
      : 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'
    )
    audio.volume = 0.3
    audio.play().catch(() => {})
  }

  const startQuiz = () => {
    let pool = [...cards]
    if (options.shuffle) pool.sort(() => Math.random() - 0.5)
    setQuizCards(pool.slice(0, options.roundLength))
    setCurrentIndex(0)
    setQuizStarted(true)
    setShowOptions(false)
  }

  const handleAnswer = async (answer: string) => {
    if (showFeedback) return
    
    const correct = options.answerWith === 'definition' 
      ? answer === quizCards[currentIndex].answer
      : answer === quizCards[currentIndex].question
    
    setSelectedAnswer(answer)
    setIsCorrect(correct)
    setShowFeedback(true)
    playSound(correct ? 'correct' : 'wrong')

    // Update Progress
    const cardId = quizCards[currentIndex].id
    const existing = currentProgress.find(p => p.card_id === cardId)
    
    let newConsecutive = correct ? (existing?.consecutive_correct || 0) + 1 : 0
    let newStatus = 'learning'
    if (correct) {
      if (newConsecutive >= 3) newStatus = 'mastered'
      else newStatus = 'almost_done'
    } else {
      newStatus = 'learning'
    }

    const newProg = { card_id: cardId, consecutive_correct: newConsecutive, status: newStatus }
    const updatedProgress = (() => {
      const idx = currentProgress.findIndex(p => p.card_id === cardId)
      if (idx > -1) {
        const next = [...currentProgress]
        next[idx] = newProg
        return next
      }
      return [...currentProgress, newProg]
    })()

    setCurrentProgress(updatedProgress)
    if (onProgressUpdate) onProgressUpdate(updatedProgress)

    // Sync to DB
    await supabase.from('user_card_progress').upsert({
      user_id: userId,
      card_id: cardId,
      deck_id: deckId,
      consecutive_correct: newConsecutive,
      last_answered_correct: correct,
      status: newStatus,
      updated_at: new Date().toISOString()
    })
  }

  const nextQuestion = () => {
    if (currentIndex + 1 >= quizCards.length) {
      setQuizStarted(false) // Finish for now
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setShowFeedback(false)
    }
  }

  // Generate Multiple Choice Options
  const currentChoices = useMemo(() => {
    const currentCard = quizCards[currentIndex]
    if (!currentCard) return []

    // If manual options are provided (usually answers), use them
    if (options.answerWith === 'definition' && currentCard.multiple_choice_options && currentCard.multiple_choice_options.length > 0) {
      return [...currentCard.multiple_choice_options].sort(() => Math.random() - 0.5)
    }

    const correct = options.answerWith === 'definition' ? currentCard.answer : currentCard.question
    
    // Get unique answers/questions from all cards to use as distractors
    const allPossible = Array.from(new Set(cards.map(c => options.answerWith === 'definition' ? c.answer : c.question)))
    
    // Filter out the correct one and shuffle the rest
    const distractors = allPossible
      .filter(a => a.toLowerCase().trim() !== correct.toLowerCase().trim())
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    return [correct, ...distractors].sort(() => Math.random() - 0.5)
  }, [quizCards, currentIndex, options.answerWith, cards])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!quizStarted || showFeedback) {
        if (e.key === 'Enter' && showFeedback) nextQuestion()
        return
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1
        if (index >= 0 && index < currentChoices.length) {
          handleAnswer(currentChoices[index])
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [quizStarted, showFeedback, currentChoices])

  const totalPossiblePoints = cards.length * 3
  const currentPoints = currentProgress.reduce((acc, p) => acc + Math.min(3, p.consecutive_correct || 0), 0)
  const masteryPercent = Math.round((currentPoints / (totalPossiblePoints || 1)) * 100)

  const stats = {
    new: cards.length - currentProgress.length,
    learning: currentProgress.filter(p => p.status === 'learning').length,
    almostDone: currentProgress.filter(p => p.status === 'almost_done').length,
    mastered: currentProgress.filter(p => p.status === 'mastered').length,
  }

  if (!quizStarted) {
    return (
      <div className="fixed inset-0 z-[300] bg-background flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-4xl space-y-6 md:space-y-12 max-h-full overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
               <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                 <Brain className="w-5 h-5 md:w-6 md:h-6" />
               </div>
               <div className="overflow-hidden">
                 <h1 className="text-xl md:text-3xl font-black text-foreground truncate">{deckTitle}</h1>
                 <p className="text-[10px] md:text-sm font-bold text-muted-foreground/40 uppercase tracking-widest">Learn Mode</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 md:p-3 bg-muted rounded-xl md:rounded-2xl text-muted-foreground hover:text-foreground transition-all flex-shrink-0"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
          </div>

          {/* Progress Dashboard */}
          <div className="bg-card border border-border rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 space-y-6 md:space-y-10 shadow-xl">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-black text-foreground">Studying Progress</h2>
                <div className="flex items-center gap-3 bg-muted/30 p-2 pr-4 rounded-2xl border border-border/50 self-start sm:self-auto">
                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-primary/20 flex items-center justify-center text-[9px] md:text-[10px] font-black text-primary flex-shrink-0">
                     {masteryPercent}%
                   </div>
                   <div className="text-left">
                      <div className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-tight">Overall Mastery</div>
                      <div className="text-sm md:text-lg font-black text-foreground">{masteryPercent}%</div>
                   </div>
                </div>
             </div>

             <div className="space-y-2 md:space-y-4">
                {[
                  { label: 'New cards', count: stats.new, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                  { label: 'Still learning', count: stats.learning, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                  { label: 'Almost done', count: stats.almostDone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'Mastered', count: stats.mastered, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                ].map(item => (
                  <div key={item.label} className={`flex items-center justify-between p-4 md:p-6 ${item.bg} rounded-2xl md:rounded-[2rem] border border-border/50`}>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${item.color.replace('text', 'bg')}`} />
                      <span className={`text-sm md:text-lg font-black ${item.color}`}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                      <span className="text-base md:text-xl font-black text-foreground">{item.count}</span>
                      <button className="px-4 py-1.5 bg-background hover:bg-muted border border-border rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-foreground transition-all">Study</button>
                    </div>
                  </div>
                ))}
             </div>

             <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  onClick={() => setShowOptions(true)}
                  className="w-full sm:flex-1 py-4 md:py-5 bg-muted hover:bg-muted/80 text-foreground text-[10px] md:text-sm font-black uppercase tracking-widest rounded-xl md:rounded-2xl transition-all border border-border flex items-center justify-center gap-2 md:gap-3"
                >
                  <Settings2 className="w-4 h-4 md:w-5 md:h-5" /> Quiz Options
                </button>
                <button 
                  onClick={startQuiz}
                  className="w-full sm:flex-[2] py-4 md:py-5 bg-primary text-primary-foreground text-[10px] md:text-sm font-black uppercase tracking-widest rounded-xl md:rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/20"
                >
                  Start Round
                </button>
             </div>
          </div>
        </div>

        {/* Options Modal */}
        <AnimatePresence>
          {showOptions && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-xl bg-card border border-border rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 space-y-8 md:space-y-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-black text-foreground">Quiz Options</h2>
                  <button onClick={() => setShowOptions(false)} className="p-2 hover:bg-muted rounded-full text-muted-foreground"><X className="w-6 h-6" /></button>
                </div>

                <div className="space-y-8 md:space-y-10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-black text-foreground">Length of Rounds</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground/40 font-bold uppercase tracking-wider">How many cards per round</div>
                    </div>
                    <input 
                      type="number" 
                      value={options.roundLength || ''} 
                      onChange={(e) => setOptions({...options, roundLength: parseInt(e.target.value) || 0})}
                      className="w-16 md:w-20 bg-muted border border-border rounded-xl px-2 py-2 md:px-4 md:py-3 text-center font-black text-foreground" 
                    />
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">Question Format</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                      <button 
                        onClick={() => setOptions({...options, answerWith: 'term'})}
                        className={`py-3 md:py-4 rounded-xl md:rounded-2xl border text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${options.answerWith === 'term' ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border text-muted-foreground hover:text-foreground'}`}
                      >
                        Answer with Question
                      </button>
                      <button 
                        onClick={() => setOptions({...options, answerWith: 'definition'})}
                        className={`py-3 md:py-4 rounded-xl md:rounded-2xl border text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${options.answerWith === 'definition' ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border text-muted-foreground hover:text-foreground'}`}
                      >
                        Answer with Answer
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">Learning Options</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-foreground">Shuffle questions</div>
                      <button 
                        onClick={() => setOptions({...options, shuffle: !options.shuffle})}
                        className={`w-10 md:w-12 h-5 md:h-6 rounded-full transition-all relative ${options.shuffle ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <div className={`absolute top-0.5 md:top-1 w-4 h-4 rounded-full bg-background transition-all ${options.shuffle ? 'left-5 md:left-7' : 'left-0.5 md:left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-foreground">Sound effects</div>
                      <button 
                        onClick={() => setOptions({...options, soundEffects: !options.soundEffects})}
                        className={`w-10 md:w-12 h-5 md:h-6 rounded-full transition-all relative ${options.soundEffects ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <div className={`absolute top-0.5 md:top-1 w-4 h-4 rounded-full bg-background transition-all ${options.soundEffects ? 'left-5 md:left-7' : 'left-0.5 md:left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 md:pt-6">
                  <button 
                    onClick={startQuiz}
                    className="w-full py-4 md:py-5 bg-primary text-primary-foreground text-sm font-black uppercase tracking-widest rounded-xl md:rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Save & Start
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // --- QUIZ INTERFACE ---
  return (
    <div className="fixed inset-0 z-[300] bg-background flex flex-col p-4 md:p-12 overflow-hidden">
      <div className="flex items-center justify-between mb-4 md:mb-8">
         <div className="flex items-center gap-3 md:gap-6 overflow-hidden">
            <span className="px-3 py-1.5 bg-muted rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
               {currentIndex + 1} / {quizCards.length}
            </span>
            <h2 className="text-sm md:text-xl font-black text-foreground truncate">{deckTitle}</h2>
         </div>
         <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button 
              onClick={() => setShowOptions(true)}
              className="p-2 md:p-3 bg-muted rounded-xl md:rounded-2xl text-muted-foreground hover:text-foreground transition-all"
            >
              <Settings2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button onClick={onClose} className="p-2 md:p-3 bg-destructive/10 rounded-xl md:rounded-2xl text-destructive hover:bg-destructive/20 transition-all">
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
         </div>
      </div>

      <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-8 md:mb-12">
        <motion.div 
          animate={{ width: `${((currentIndex + 1) / quizCards.length) * 100}%` }}
          className="h-full bg-primary"
        />
      </div>

      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="w-full max-w-4xl bg-card border border-border rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-10 space-y-4 md:space-y-6 shadow-2xl relative overflow-hidden flex flex-col max-h-full">
          {/* Progress Indicator inside Card */}
          <div className="absolute top-4 right-4 md:top-6 md:right-8">
             <div className="px-2 py-0.5 md:px-3 md:py-1 bg-primary/10 rounded-full flex items-center gap-1.5 md:gap-2">
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-primary">Active Card</span>
             </div>
          </div>

          <div className="space-y-1">
            <div className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Question</div>
            <h1 className="text-lg md:text-2xl font-black text-foreground leading-tight">
              {options.answerWith === 'definition' ? quizCards[currentIndex].question : quizCards[currentIndex].answer}
            </h1>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
            <div className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Select the matching answer</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
               {currentChoices.map((choice, idx) => {
                 const isSelected = selectedAnswer === choice
                 const isCorrectChoice = choice === (options.answerWith === 'definition' ? quizCards[currentIndex].answer : quizCards[currentIndex].question)
                 
                 let variant = "bg-muted border-border text-foreground hover:border-primary/50"
                 if (showFeedback) {
                   if (isCorrectChoice) {
                     variant = "bg-emerald-500 border-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                   } else if (isSelected && !isCorrectChoice) {
                     variant = "bg-red-500 border-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                   } else {
                     variant = "bg-muted border-border text-muted-foreground opacity-30"
                   }
                 }

                 return (
                   <button
                     key={idx}
                     onClick={() => !showFeedback && handleAnswer(choice)}
                     className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all text-left group relative ${variant} ${!showFeedback ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}`}
                   >
                     <div className={`w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-black transition-colors ${showFeedback && isCorrectChoice ? 'bg-white text-emerald-600' : showFeedback && isSelected && !isCorrectChoice ? 'bg-white text-red-500' : 'bg-card border border-border text-foreground group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                       {idx + 1}
                     </div>
                     <span className="text-xs md:text-sm font-black leading-tight line-clamp-2 md:line-clamp-3">{choice}</span>
                   </button>
                 )
               })}
            </div>
          </div>

          {showFeedback && (
            <motion.div 
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="pt-4 md:pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 md:gap-4">
                {isCorrect ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-[9px] md:text-[10px]">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> Nice work!
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-[9px] md:text-[10px]">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5" /> Not quite...
                  </div>
                )}
              </div>
              <button 
                onClick={nextQuestion}
                className="w-full sm:w-auto px-6 md:px-8 py-3 bg-primary text-primary-foreground text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl hover:scale-[1.05] transition-all"
              >
                Press Enter to Continue
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
