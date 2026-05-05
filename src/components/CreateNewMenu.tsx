'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, ChevronDown, LayoutGrid, FolderPlus } from 'lucide-react'
import CreateDeckModal from './CreateDeckModal'
import CreateFolderModal from './CreateFolderModal'

interface CreateNewMenuProps {
  userId: string
}

export default function CreateNewMenu({ userId }: CreateNewMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
      >
        <Plus className="w-4 h-4 stroke-[3px]" />
        New
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-full right-0 mt-3 w-56 bg-card border border-border rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
          <button
            onClick={() => {
              setIsDeckModalOpen(true)
              setIsMenuOpen(false)
            }}
            className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-foreground">Deck</span>
          </button>
          
          <button
            onClick={() => {
              setIsFolderModalOpen(true)
              setIsMenuOpen(false)
            }}
            className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <FolderPlus className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-foreground">Folder</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateDeckModal 
        userId={userId} 
        isOpen={isDeckModalOpen} 
        onClose={() => setIsDeckModalOpen(false)} 
      />
      <CreateFolderModal 
        userId={userId} 
        isOpen={isFolderModalOpen} 
        onClose={() => setIsFolderModalOpen(false)} 
      />
    </div>
  )
}
