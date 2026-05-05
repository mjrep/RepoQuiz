'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 px-5 py-3 w-full rounded-2xl font-bold text-muted-foreground hover:text-red-500 hover:bg-red-50/10 transition-all group"
    >
      <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      <span className="text-sm tracking-tight">Sign Out</span>
    </button>
  )
}
