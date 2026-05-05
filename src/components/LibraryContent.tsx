'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  LayoutGrid, Star, Folder as FolderIcon, ChevronDown, 
  MoreVertical, Edit2, Trash2, Pin, Copy, Move, X, Check,
  Clock
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

interface Deck {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  folder_id: string | null
  is_favorite?: boolean
  cards?: { count: number }[]
}

interface Folder {
  id: string
  name: string
  created_at: string
}

interface LibraryContentProps {
  decks: Deck[]
  folders: Folder[]
  userId: string
}

type SortOption = 'latest' | 'oldest' | 'az' | 'za' | 'most_cards' | 'least_cards'

function formatRelativeTime(dateString: string) {
  const now = new Date()
  const past = new Date(dateString)
  const diffInMs = now.getTime() - past.getTime()
  const diffInSecs = Math.floor(diffInMs / 1000)
  const diffInMins = Math.floor(diffInSecs / 60)
  const diffInHours = Math.floor(diffInMins / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInSecs < 60) return 'just now'
  if (diffInMins < 60) return `${diffInMins}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 30) return `${diffInDays}d ago`
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function LibraryContent({ decks: initialDecks, folders: initialFolders, userId }: LibraryContentProps) {
  // --- OPTIMISTIC STATE ---
  const [localDecks, setLocalDecks] = useState(initialDecks)
  const [localFolders, setLocalFolders] = useState(initialFolders)
  
  const [view, setView] = useState<'folders' | 'all'>('folders')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [renamingFolderName, setRenamingFolderName] = useState('')
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Keep local state in sync when props change (from other components or server refresh)
  useEffect(() => {
    setLocalDecks(initialDecks)
    setLocalFolders(initialFolders)
  }, [initialDecks, initialFolders])

  const sortOptions = [
    { label: 'Latest to oldest', value: 'latest' as SortOption },
    { label: 'Oldest to latest', value: 'oldest' as SortOption },
    { label: 'A to Z', value: 'az' as SortOption },
    { label: 'Z to A', value: 'za' as SortOption },
  ]

  const sortedAndFilteredDecks = useMemo(() => {
    let result = [...localDecks].filter(deck => 
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deck.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    result.sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1
      if (!a.is_favorite && b.is_favorite) return 1

      switch (sortBy) {
        case 'latest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'az': return a.title.localeCompare(b.title)
        case 'za': return b.title.localeCompare(a.title)
        default: return 0
      }
    })

    return result
  }, [localDecks, searchQuery, sortBy])

  const foldersWithDecks = localFolders.map(folder => ({
    ...folder,
    decks: sortedAndFilteredDecks.filter(deck => deck.folder_id === folder.id)
  }))

  const decksNotInFolders = sortedAndFilteredDecks.filter(deck => !deck.folder_id)

  const handleRenameFolder = async (folderId: string) => {
    if (!renamingFolderName.trim()) return
    
    // Optimistic Update
    setLocalFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: renamingFolderName.trim() } : f))
    setEditingFolderId(null)
    setOpenFolderMenuId(null)

    const { error } = await supabase
      .from('folders')
      .update({ name: renamingFolderName.trim() })
      .eq('id', folderId)
    
    if (error) {
      alert('Failed to rename folder')
      setLocalFolders(initialFolders) // Rollback
    } else {
      router.refresh()
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure? Decks inside will be unfiled.')) return
    
    // Optimistic Update
    setLocalFolders(prev => prev.filter(f => f.id !== folderId))
    setLocalDecks(prev => prev.map(d => d.folder_id === folderId ? { ...d, folder_id: null } : d))

    await supabase.from('decks').update({ folder_id: null }).eq('folder_id', folderId)
    const { error } = await supabase.from('folders').delete().eq('id', folderId)
    
    if (error) {
      alert('Failed to delete folder')
      setLocalFolders(initialFolders)
      setLocalDecks(initialDecks)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Search Bar */}
      <div className="relative group w-full">
        <input 
          type="text" 
          placeholder="Search decks..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card border border-border rounded-2xl px-6 py-3.5 text-base focus:outline-none focus:border-primary transition-all shadow-sm group-hover:border-primary/50 placeholder:text-muted-foreground/30"
        />
      </div>

      <div className="flex flex-row items-center justify-between gap-6">
        <div className="relative">
          <button 
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors text-muted-foreground whitespace-nowrap"
          >
            Filter: {sortOptions.find(o => o.value === sortBy)?.label}
            <ChevronDown className={`w-3 h-3 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isSortOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 py-2"
              >
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value)
                      setIsSortOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors ${sortBy === option.value ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex bg-card border border-border p-1 rounded-xl shadow-sm">
          <button 
            onClick={() => setView('folders')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              view === 'folders' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Folders
          </button>
          <button 
            onClick={() => setView('all')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              view === 'all' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All decks
          </button>
        </div>
      </div>

      {view === 'folders' ? (
        <div className="space-y-8 pb-20">
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {foldersWithDecks.map((folder) => (
                <motion.div
                  layout
                  key={folder.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-card border border-border rounded-[1.5rem] p-4 hover:border-primary/50 transition-all duration-300 flex flex-col h-[140px] relative shadow-sm"
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                      <FolderIcon className="w-5 h-5 fill-primary/20" />
                    </div>
                    
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenFolderMenuId(openFolderMenuId === folder.id ? null : folder.id)
                        }}
                        className={`p-2 transition-all rounded-full hover:bg-muted ${openFolderMenuId === folder.id ? 'bg-muted text-foreground' : 'text-muted-foreground/40 hover:text-foreground'}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      <AnimatePresence>
                        {openFolderMenuId === folder.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-xl shadow-2xl z-[100] py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setEditingFolderId(folder.id)
                                setRenamingFolderName(folder.name)
                              }}
                              className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-muted text-muted-foreground transition-colors flex items-center gap-2"
                            >
                              <Edit2 className="w-3 h-3" /> Rename
                            </button>
                            <button 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteFolder(folder.id)
                              }}
                              className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {editingFolderId === folder.id ? (
                    <div className="mt-2 flex items-center gap-2 relative z-20">
                      <input 
                        autoFocus
                        className="bg-muted border border-border rounded-lg px-2 py-1 text-xs font-bold w-full focus:outline-none focus:border-primary"
                        value={renamingFolderName}
                        onChange={(e) => setRenamingFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(folder.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button onClick={(e) => { e.stopPropagation(); handleRenameFolder(folder.id); }} className="text-primary hover:text-primary/80"><Check className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(null); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="mt-2 flex-1 flex flex-col justify-end relative z-10 pointer-events-none">
                      <h4 className="text-lg font-black tracking-tight text-foreground truncate group-hover:text-primary transition-colors">{folder.name}</h4>
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{folder.decks.length} decks</span>
                    </div>
                  )}
                  
                  {!editingFolderId && (
                    <Link href={`/dashboard/library/folder/${folder.id}`} className="absolute inset-0 z-0 rounded-[1.5rem]" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {decksNotInFolders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">
                NOT IN A FOLDER ({decksNotInFolders.length})
              </h3>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {decksNotInFolders.map((deck) => (
                    <DeckCard 
                      key={deck.id} 
                      deck={deck} 
                      folders={localFolders} 
                      setLocalDecks={setLocalDecks}
                      initialDecks={initialDecks}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
          <AnimatePresence mode="popLayout">
            {sortedAndFilteredDecks.length > 0 ? (
              sortedAndFilteredDecks.map((deck) => (
                <DeckCard 
                  key={deck.id} 
                  deck={deck} 
                  folders={localFolders} 
                  setLocalDecks={setLocalDecks}
                  initialDecks={initialDecks}
                />
              ))
            ) : (
              <motion.div layout className="col-span-full py-32 bg-card/20 border border-dashed border-border rounded-[3rem] text-center">
                <LayoutGrid className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-10" />
                <h4 className="text-xl font-black mb-2 text-foreground">No decks found</h4>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

interface DeckCardProps {
  deck: Deck
  folders: Folder[]
  setLocalDecks: React.Dispatch<React.SetStateAction<Deck[]>>
  initialDecks: Deck[]
}

function DeckCard({ deck, folders, setLocalDecks, initialDecks }: DeckCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const cardCount = deck.cards?.[0]?.count || 0

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Optimistic Update
    setLocalDecks(prev => prev.map(d => d.id === deck.id ? { ...d, is_favorite: !d.is_favorite } : d))
    setIsMenuOpen(false)

    const { error } = await supabase
      .from('decks')
      .update({ is_favorite: !deck.is_favorite })
      .eq('id', deck.id)
    
    if (error) {
      alert('Failed to update favorite')
      setLocalDecks(initialDecks)
    } else {
      router.refresh()
    }
  }

  const handleDeleteDeck = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this deck?')) return
    
    // Optimistic Update
    setLocalDecks(prev => prev.filter(d => d.id !== deck.id))

    const { error } = await supabase.from('decks').delete().eq('id', deck.id)
    if (error) {
      alert('Failed to delete deck')
      setLocalDecks(initialDecks)
    } else {
      router.refresh()
    }
  }

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMenuOpen(false)
    
    const { data: deckData } = await supabase.from('decks').select('*').eq('id', deck.id).single()
    if (!deckData) return
    
    const { data: newDeck, error: deckErr } = await supabase
      .from('decks')
      .insert([{ ...deckData, id: undefined, title: `${deckData.title} (Copy)`, created_at: undefined }])
      .select().single()
    
    if (deckErr || !newDeck) { alert('Failed to duplicate deck'); return; }
    
    const { data: cards } = await supabase.from('cards').select('*').eq('deck_id', deck.id)
    if (cards && cards.length > 0) {
      const newCards = cards.map(c => ({ ...c, id: undefined, deck_id: newDeck.id, created_at: undefined }))
      await supabase.from('cards').insert(newCards)
    }
    router.refresh()
  }

  const handleMoveToFolder = async (e: React.MouseEvent, folderId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Optimistic Update
    setLocalDecks(prev => prev.map(d => d.id === deck.id ? { ...d, folder_id: folderId } : d))
    setIsMenuOpen(false)

    const { error } = await supabase.from('decks').update({ folder_id: folderId }).eq('id', deck.id)
    if (error) {
      alert('Failed to move deck')
      setLocalDecks(initialDecks)
    } else {
      router.refresh()
    }
  }

  return (
    <motion.div 
      layout
      className="group relative" 
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className="bg-card border border-border rounded-[1.5rem] p-5 hover:border-primary/50 transition-all duration-300 h-[160px] shadow-sm flex flex-col">
        <div className="flex items-start justify-between mb-2 relative z-10">
          <div className="space-y-1 pr-6 flex-1 min-w-0">
            <h4 className="text-lg font-black tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
              {deck.title}
            </h4>
            <p className="text-[11px] text-muted-foreground/60 line-clamp-2 leading-tight">
              {deck.description || 'No description provided.'}
            </p>
          </div>
          
          <div className="flex items-center gap-0">
            <button 
              onClick={handleToggleFavorite}
              className={`p-1.5 transition-all hover:scale-110 ${deck.is_favorite ? 'text-yellow-400' : 'text-muted-foreground/10 hover:text-yellow-400/40'}`}
            >
              <Star className={`w-4 h-4 ${deck.is_favorite ? 'fill-current' : ''}`} />
            </button>
            
            <div className="relative">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                className={`p-1.5 transition-all rounded-full hover:bg-muted ${isMenuOpen ? 'bg-muted text-foreground' : 'text-muted-foreground/40 hover:text-foreground'}`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-2xl shadow-2xl z-[150] py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button onClick={handleToggleFavorite} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-muted text-muted-foreground transition-colors flex items-center gap-3">
                      <Pin className="w-3.5 h-3.5" /> {deck.is_favorite ? 'Unpin' : 'Pin to top'}
                    </button>
                    <button onClick={handleDuplicate} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-muted text-muted-foreground transition-colors flex items-center gap-3">
                      <Copy className="w-3.5 h-3.5" /> Duplicate
                    </button>
                    <div className="px-4 py-1 text-[9px] font-black uppercase tracking-widest text-primary/40 border-t border-border mt-1">Move to</div>
                    <div className="max-h-32 overflow-y-auto">
                      <button 
                        onClick={(e) => handleMoveToFolder(e, null)} 
                        className="w-full text-left px-6 py-2 text-[10px] font-bold text-muted-foreground hover:bg-muted transition-colors"
                      >
                        None (Unfile)
                      </button>
                      {folders.map(f => (
                        <button 
                          key={f.id} 
                          onClick={(e) => handleMoveToFolder(e, f.id)} 
                          className="w-full text-left px-6 py-2 text-[10px] font-bold text-muted-foreground hover:bg-muted transition-colors truncate"
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={handleDeleteDeck} 
                      className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-destructive/10 text-destructive border-t border-border transition-colors flex items-center gap-3"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/30 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
              <Clock className="w-2.5 h-2.5" />
              {formatRelativeTime(deck.updated_at || deck.created_at)}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-primary font-bold">
              {cardCount} terms
            </span>
          </div>
          {deck.is_favorite && (
             <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-1">
               <Pin className="w-2.5 h-2.5" /> Pinned
             </span>
          )}
        </div>
        
        <Link href={`/dashboard/library/${deck.id}`} className="absolute inset-0 z-0" />
      </div>
    </motion.div>
  )
}
