'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, User, Check, RefreshCw, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProfileModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  currentName: string
  userEmail?: string
}

export default function ProfileModal({ userId, isOpen, onClose, currentName, userEmail }: ProfileModalProps) {
  const [fullName, setFullName] = useState(currentName)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setFullName(currentName)
      setIsSuccess(false)
    }
  }, [isOpen, currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return

    setIsSubmitting(true)
    
    // Upsert profile
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        full_name: fullName.trim(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error updating profile:', error.message)
      alert('Failed to update profile.')
      setIsSubmitting(false)
    } else {
      setIsSubmitting(false)
      setIsSuccess(true)
      setTimeout(() => {
        onClose()
        router.refresh()
      }, 1000)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={() => !isSubmitting && onClose()}
      />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center text-primary border-4 border-primary/5">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Edit Profile</h2>
          <p className="text-muted-foreground font-medium text-sm mt-1">Manage your account settings.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-primary ml-1">
              Email Address (Fixed)
            </label>
            <input
              readOnly
              type="text"
              value={userEmail || 'No email provided'}
              className="w-full bg-muted/30 border border-border rounded-2xl px-6 py-3.5 text-sm text-muted-foreground cursor-not-allowed opacity-70"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-primary ml-1">
              Full Name
            </label>
            <input
              required
              autoFocus
              type="text"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-2xl px-6 py-3.5 text-base text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 ${
                isSuccess 
                  ? 'bg-green-500 text-white shadow-green-500/20' 
                  : 'bg-primary text-primary-foreground shadow-primary/20 hover:opacity-90'
              }`}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Updated!
                </>
              ) : (
                'Save Changes'
              )}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-500 hover:bg-red-50/5 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
