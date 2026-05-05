'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, Folder as FolderIcon, MoreHorizontal, 
  Search, CheckCircle2, X, Edit2, Trash2, Link2, ListChecks
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import LibraryContent from '@/components/LibraryContent'

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

interface FolderDetailContentProps {
  folder: Folder
  decks: Deck[]
  allUserDecks: Deck[]
  allFolders: Folder[]
  userId: string
}

export default function FolderDetailContent({ 
  folder, 
  decks, 
  allUserDecks,
  allFolders,
  userId 
}: FolderDetailContentProps) {
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [manageSearch, setManageSearch] = useState('')
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>(decks.map(d => d.id))
  
  const router = useRouter()
  const supabase = createClient()

  const handleSaveChanges = async () => {
    // 1. Decks to add to folder (selected but not currently in folder)
    const toAdd = selectedDeckIds.filter(id => !decks.find(d => d.id === id))
    // 2. Decks to remove (currently in folder but not selected)
    const toRemove = decks.filter(d => !selectedDeckIds.includes(d.id)).map(d => d.id)

    if (toAdd.length > 0) {
      await supabase.from('decks').update({ folder_id: folder.id }).in('id', toAdd)
    }
    if (toRemove.length > 0) {
      await supabase.from('decks').update({ folder_id: null }).in('id', toRemove)
    }

    setIsManageOpen(false)
    router.refresh()
  }

  const handleDeleteFolder = async () => {
    if (!confirm('Are you sure? Decks inside will be unfiled.')) return
    await supabase.from('decks').update({ folder_id: null }).eq('folder_id', folder.id)
    const { error } = await supabase.from('folders').delete().eq('id', folder.id)
    if (error) alert('Failed to delete folder')
    else router.push('/dashboard/library')
  }

  const totalCards = decks.reduce((acc, deck) => acc + (deck.cards?.[0]?.count || 0), 0)

  const filteredManageDecks = allUserDecks.filter(deck => 
    deck.title.toLowerCase().includes(manageSearch.toLowerCase()) &&
    (!deck.folder_id || deck.folder_id === folder.id) // Only show unfiled decks or decks already in this folder
  )

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="space-y-10">
        <Link 
          href="/dashboard/library" 
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-primary transition-all group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Your Decks
        </Link>

        <div className="flex items-center justify-between border-b border-border pb-8">
          <div className="flex items-center gap-5">
            <FolderIcon className="w-8 h-8 text-primary fill-primary/20" />
            <h1 className="text-5xl font-black tracking-tight text-foreground">{folder.name}</h1>
          </div>
          
          <div className="relative group/foldermenu">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 bg-card border border-border rounded-2xl text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-[1.5rem] shadow-2xl z-50 py-2 overflow-hidden">
                <button className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-foreground hover:bg-muted transition-colors">
                  <Edit2 className="w-4 h-4" /> Rename
                </button>
                <button 
                  onClick={() => { setIsManageOpen(true); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                >
                  <ListChecks className="w-4 h-4" /> Manage decks
                </button>
                <button className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-muted-foreground/40 hover:bg-muted transition-colors border-t border-border mt-1">
                  <div className="flex items-center gap-3">
                    <Link2 className="w-4 h-4" /> Share link
                  </div>
                  <span className="text-[8px] bg-muted px-1.5 py-0.5 rounded-md">SOON</span>
                </button>
                <button 
                  onClick={handleDeleteFolder}
                  className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors border-t border-border mt-1"
                >
                  <Trash2 className="w-4 h-4" /> Delete folder
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-xs font-bold text-muted-foreground/60 flex items-center gap-2">
          <span>{decks.length} {decks.length === 1 ? 'deck' : 'decks'}</span>
          <span>•</span>
          <span>{totalCards} {totalCards === 1 ? 'card' : 'cards'}</span>
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="w-full aspect-[2.5/1] border-2 border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center space-y-6 bg-card/10">
          <FolderIcon className="w-10 h-10 text-primary/40" />
          <p className="text-muted-foreground font-medium">This folder is empty.</p>
          <button 
            onClick={() => setIsManageOpen(true)}
            className="flex items-center gap-2 px-8 py-3 bg-[#1db954] hover:bg-[#1ed760] text-black text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
          >
            <ListChecks className="w-4 h-4" />
            Manage decks
          </button>
        </div>
      ) : (
        <LibraryContent 
          decks={decks} 
          folders={allFolders} 
          userId={userId} 
        />
      )}

      {/* Manage Decks Modal */}
      {isManageOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#181818] border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight text-white">Manage decks</h2>
                  <p className="text-sm font-bold text-primary">{folder.name}</p>
                </div>
                <button onClick={() => setIsManageOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <input 
                  type="text"
                  placeholder="Search decks..."
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {filteredManageDecks.map(deck => (
                  <label 
                    key={deck.id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-transparent rounded-2xl hover:border-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <input 
                        type="checkbox"
                        checked={selectedDeckIds.includes(deck.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedDeckIds([...selectedDeckIds, deck.id])
                          else setSelectedDeckIds(selectedDeckIds.filter(id => id !== deck.id))
                        }}
                        className="w-5 h-5 rounded-md border-white/20 bg-transparent text-primary focus:ring-offset-0 focus:ring-0 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{deck.title}</span>
                        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">{deck.cards?.[0]?.count || 0} cards</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-8 pt-0 space-y-3">
              <button 
                onClick={handleSaveChanges}
                className="w-full py-4 bg-[#1db954] hover:bg-[#1ed760] text-black text-sm font-black uppercase tracking-widest rounded-2xl transition-all"
              >
                Save changes
              </button>
              <button 
                onClick={() => setIsManageOpen(false)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
