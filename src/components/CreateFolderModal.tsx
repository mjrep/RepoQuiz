'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { FolderPlus, X } from 'lucide-react'

interface CreateFolderModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export default function CreateFolderModal({ userId, isOpen, onClose }: CreateFolderModalProps) {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    const finalUserId = user?.id || userId

    const { error } = await supabase
      .from('folders')
      .insert([
        {
          user_id: finalUserId,
          name: name.trim(),
        },
      ])

    if (error) {
      console.error('Error creating folder:', error.message)
      setIsSubmitting(false)
      alert('Failed to create folder. Please try again.')
    } else {
      setIsSubmitting(false)
      setName('')
      onClose()
      router.refresh()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={() => !isSubmitting && onClose()}
      />
      
      <div className="relative w-full max-w-lg bg-card border border-border rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl mx-auto mb-6 flex items-center justify-center text-primary">
            <FolderPlus className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">New Folder</h2>
          <p className="text-muted-foreground font-medium mt-1">Organize your study sets efficiently.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-primary ml-1">
              Folder Name
            </label>
            <input
              required
              autoFocus
              type="text"
              placeholder="e.g., Medical Finals"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-2xl px-6 py-4 text-lg text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl font-bold text-sm text-muted-foreground hover:bg-muted transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] bg-primary text-primary-foreground px-6 py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-primary/20 active:scale-95"
            >
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
