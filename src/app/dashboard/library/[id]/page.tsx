'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  Star, Share2, MoreHorizontal, ChevronRight, 
  Layers, Pencil, Check, Folder as FolderIcon, RefreshCw, Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Topbar from '@/components/Topbar'
import DeckEditor from '@/components/DeckEditor'
import ImportSection from '@/components/ImportSection'
import FlashcardPlayer from '@/components/FlashcardPlayer'
import QuizPlayer from '@/components/QuizPlayer'

export default function LibraryDeckHubPage({ 
  params,
  searchParams 
}: { 
  params: any,
  searchParams: any
}) {
  const [deck, setDeck] = useState<any>(null)
  const [cards, setCards] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<any>(null)
  const [resolvedSearchParams, setResolvedSearchParams] = useState<any>(null)

  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isMoveOpen, setIsMoveOpen] = useState(false)
  const [folders, setFolders] = useState<any[]>([])
  const [isCopying, setIsCopying] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const p = await params
      const sp = await searchParams
      setResolvedParams(p)
      setResolvedSearchParams(sp)

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const [deckRes, cardsRes, progressRes, foldersRes] = await Promise.all([
        supabase.from('decks').select('*').eq('id', p.id).single(),
        supabase.from('cards').select('*').eq('deck_id', p.id).order('created_at', { ascending: true }),
        supabase.from('user_card_progress').select('*').eq('deck_id', p.id).eq('user_id', user?.id),
        supabase.from('folders').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
      ])

      setDeck(deckRes.data)
      setCards(cardsRes.data || [])
      setProgress(progressRes.data || [])
      setFolders(foldersRes.data || [])
      setLoading(false)
    }
    init()

    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false)
        setIsMoveOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [params, searchParams, supabase])

  if (loading || !deck || !resolvedParams) return null

  const isEditing = resolvedSearchParams?.editing === 'true'
  const authorName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous Learner'

  // --- HANDLERS ---
  const handleTogglePin = async () => {
    const newStatus = !deck.is_favorite
    setDeck({ ...deck, is_favorite: newStatus })
    await supabase.from('decks').update({ is_favorite: newStatus }).eq('id', deck.id)
    router.refresh()
  }

  const handleShare = async () => {
    setIsCopying(true)
    await navigator.clipboard.writeText(window.location.href)
    setTimeout(() => setIsCopying(false), 2000)
  }

  const handleClearProgress = async () => {
    if (!confirm('Clear all your progress for this deck? This cannot be undone.')) return
    setProgress([])
    await supabase.from('user_card_progress').delete().eq('deck_id', deck.id).eq('user_id', user?.id)
    setIsMoreOpen(false)
    router.refresh()
  }

  const handleDeleteDeck = async () => {
    if (!confirm('Delete this deck permanently?')) return
    await supabase.from('decks').delete().eq('id', deck.id)
    router.push('/dashboard/library')
  }

  const handleMoveToFolder = async (folderId: string | null) => {
    setDeck({ ...deck, folder_id: folderId })
    await supabase.from('decks').update({ folder_id: folderId }).eq('id', deck.id)
    setIsMoveOpen(false)
    setIsMoreOpen(false)
    router.refresh()
  }

  return (
    <>
      <Topbar 
        userId={user?.id || ''} 
        displayName={authorName} 
      />

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="w-full px-4 md:px-12 py-6 md:py-8 space-y-6 md:space-y-8">
          
          {/* Breadcrumbs & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
              <Link href="/dashboard/library" className="hover:text-primary transition-colors">Decks</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground truncate max-w-[150px] md:max-w-[200px]">{deck.title}</span>
            </div>
            <div className="flex items-center gap-2 relative" ref={moreMenuRef}>
              <button 
                onClick={handleTogglePin}
                className={`p-2 rounded-lg bg-card border border-border transition-all ${deck.is_favorite ? 'text-yellow-500 border-yellow-500/50 bg-yellow-500/5' : 'text-muted-foreground hover:text-primary'}`}
              >
                <Star className={`w-4 h-4 ${deck.is_favorite ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={handleShare}
                className={`p-2 rounded-lg bg-card border border-border transition-all flex items-center gap-2 ${isCopying ? 'text-emerald-500 border-emerald-500/50 bg-emerald-500/5' : 'text-muted-foreground hover:text-primary'}`}
              >
                {isCopying ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {isCopying && <span className="text-[10px] font-black uppercase tracking-widest">Copied!</span>}
              </button>
              <div className="relative">
                <button 
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={`p-2 rounded-lg bg-card border border-border transition-all ${isMoreOpen ? 'text-primary border-primary/50' : 'text-muted-foreground hover:text-primary'}`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                <AnimatePresence>
                  {isMoreOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-2xl shadow-2xl z-50 py-2 overflow-hidden"
                    >
                      <Link href={`/dashboard/library/${deck.id}?editing=true`} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-muted text-muted-foreground transition-colors flex items-center gap-3">
                        <Pencil className="w-3.5 h-3.5" /> Edit Deck
                      </Link>
                      
                      <div className="relative">
                        <button 
                          onClick={() => setIsMoveOpen(!isMoveOpen)}
                          className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-muted text-muted-foreground transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3"><FolderIcon className="w-3.5 h-3.5" /> Move to Folder</div>
                          <ChevronRight className={`w-3 h-3 transition-transform ${isMoveOpen ? 'rotate-90' : ''}`} />
                        </button>
                        {isMoveOpen && (
                          <div className="bg-muted/30 py-1 max-h-32 overflow-y-auto">
                            <button onClick={() => handleMoveToFolder(null)} className="w-full text-left px-8 py-2 text-[9px] font-bold text-muted-foreground hover:text-primary transition-colors">None (Unfile)</button>
                            {folders.map(f => (
                              <button key={f.id} onClick={() => handleMoveToFolder(f.id)} className="w-full text-left px-8 py-2 text-[9px] font-bold text-muted-foreground hover:text-primary transition-colors truncate">{f.name}</button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={handleClearProgress}
                        className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-muted text-muted-foreground transition-colors flex items-center gap-3 border-t border-border mt-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Clear Progress
                      </button>
                      <button 
                        onClick={handleDeleteDeck}
                        className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-3"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Deck
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-8">
              <ImportSection deckId={deck.id} />
              <DeckEditor 
                deckId={deck.id} 
                initialTitle={deck.title} 
                initialDescription={deck.description || ''} 
                cards={cards || []}
              />
            </div>
          ) : (
            <>
              {/* Title & Info - Compact */}
              <div className="space-y-3">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground leading-tight">{deck.title}</h1>
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary flex items-center justify-center text-[9px] md:text-[10px] font-bold text-primary-foreground">
                      {authorName.charAt(0)}
                    </div>
                    <span className="text-[11px] md:text-xs font-bold text-foreground">{authorName}</span>
                  </div>
                  <div className="h-3 w-[1px] bg-border hidden md:block" />
                  <span className="px-3 py-0.5 bg-muted border border-border rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {cards?.length || 0} Terms
                  </span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed max-w-2xl">
                  {deck.description || "Master these concepts through active recall and spaced repetition."}
                </p>
              </div>

              {/* Modes Grid - Compact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setIsFlashcardsOpen(true)}
                  className="bg-card border border-border rounded-[2rem] p-5 md:p-6 flex flex-col items-start group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden shadow-sm"
                >
                  <div className="text-muted-foreground/30 group-hover:text-primary transition-colors mb-3 md:mb-4">
                    <Layers className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-lg md:text-xl font-black mb-1 text-foreground">Flashcard Mode</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground font-medium mb-4 md:mb-6">
                    Flip through cards at your own pace.
                  </p>
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 group-hover:text-primary transition-colors">
                    {cards?.length || 0} CARDS
                    <ChevronRight className="w-2 h-2 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                <div 
                  onClick={() => setIsQuizOpen(true)}
                  className="bg-card border border-border rounded-[2rem] p-5 md:p-6 flex flex-col items-start group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden shadow-sm"
                >
                  <div className="text-muted-foreground/30 group-hover:text-primary transition-colors mb-3 md:mb-4">
                    <Pencil className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg md:text-xl font-black text-foreground">Quiz Mode</h3>
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground font-medium mb-4 md:mb-6">
                    Instant feedback quiz system.
                  </p>
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 group-hover:text-primary transition-colors">
                    {cards?.length || 0} QUESTIONS
                    <ChevronRight className="w-2 h-2 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>

              {/* Import Section - Compact */}
              <ImportSection deckId={deck.id} />

              {/* Studying Progress Summary Dashboard */}
              <div className="bg-card border border-border rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 space-y-6 md:space-y-8 shadow-sm">
                 <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-black text-foreground">Studying Progress</h2>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hidden sm:inline">Overall Mastery</span>
                       <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary/20 flex items-center justify-center text-[9px] md:text-[10px] font-black text-primary">
                         {Math.round((progress.reduce((acc, p) => acc + Math.min(3, p.consecutive_correct || 0), 0) / ((cards.length * 3) || 1)) * 100)}%
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-2 md:gap-3">
                    {[
                      { label: 'New cards', count: cards.length - progress.length, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                      { label: 'Still learning', count: progress.filter(p => p.status === 'learning').length, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                      { label: 'Almost done', count: progress.filter(p => p.status === 'almost_done').length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                      { label: 'Mastered', count: progress.filter(p => p.status === 'mastered').length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    ].map(item => (
                      <div key={item.label} className={`flex items-center justify-between p-3 md:p-4 ${item.bg} rounded-xl md:rounded-2xl border border-border/50`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${item.color.replace('text', 'bg')}`} />
                          <span className={`text-[11px] md:text-sm font-black ${item.color}`}>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3 md:gap-4">
                          <span className="text-sm md:text-base font-black text-foreground">{item.count}</span>
                          <button 
                            onClick={() => setIsQuizOpen(true)}
                            className="px-3 md:px-4 py-1.5 bg-background hover:bg-muted border border-border rounded-lg md:rounded-xl text-[7px] md:text-[8px] font-black uppercase tracking-widest text-foreground transition-all"
                          >
                            Study
                          </button>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Terms Section */}
              <div className="space-y-6 pt-8 border-t border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg md:text-xl font-black tracking-tight text-foreground">Terms in this set</h2>
                  <Link href={`/dashboard/library/${deck.id}?editing=true`} className="px-3 md:px-4 py-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all">
                    Edit Set
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-3 pb-24">
                  {cards && cards.map((card) => {
                    const cardProg = progress.find(p => p.card_id === card.id)
                    const status = cardProg?.status || 'new'
                    
                    const statusColors: any = {
                      new: 'bg-pink-500/10 text-pink-500',
                      learning: 'bg-purple-500/10 text-purple-500',
                      almost_done: 'bg-blue-500/10 text-blue-500',
                      mastered: 'bg-emerald-500/10 text-emerald-500'
                    }

                    const statusLabels: any = {
                      new: 'New',
                      learning: 'Learning',
                      almost_done: 'Almost Done',
                      mastered: 'Mastered'
                    }

                    return (
                      <div key={card.id} className="bg-card border border-border rounded-2xl p-4 md:p-6 flex flex-col items-start gap-4 md:gap-6 group hover:border-primary/50 transition-all relative overflow-hidden">
                        <div className="w-full space-y-2">
                          <div className={`inline-flex px-2 py-0.5 rounded-md text-[7px] md:text-[8px] font-black uppercase tracking-widest ${statusColors[status]}`}>
                            {statusLabels[status]}
                          </div>
                          <div className="text-base md:text-lg font-black text-foreground leading-tight">{card.question}</div>
                        </div>
                        <div className="w-full h-px bg-border md:hidden" />
                        <div className="text-[11px] md:text-sm text-muted-foreground font-medium leading-relaxed">{card.answer}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Flashcard Player Modal */}
      {isFlashcardsOpen && (
        <FlashcardPlayer 
          deckTitle={deck.title}
          cards={cards}
          onClose={() => setIsFlashcardsOpen(false)}
        />
      )}

      {/* Quiz Player Modal */}
      {isQuizOpen && (
        <QuizPlayer 
          deckId={deck.id}
          deckTitle={deck.title}
          cards={cards}
          userId={user?.id || ''}
          initialProgress={progress}
          onClose={() => setIsQuizOpen(false)}
          onProgressUpdate={(newProg) => setProgress(newProg)}
        />
      )}
    </>
  )
}
