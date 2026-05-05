'use client'

import Link from 'next/link'
import CreateNewMenu from './CreateNewMenu'
import ThemeToggle from './ThemeToggle'

interface TopbarProps {
  userId: string
  displayName: string
  leftContent?: React.ReactNode
}

export default function Topbar({ userId, displayName, leftContent }: TopbarProps) {
  return (
    <header className="h-20 px-10 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between z-40 sticky top-0 transition-colors">
      <div className="flex-1 max-w-2xl">
        {leftContent || (
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search everything..." 
              className="w-full bg-muted border border-border rounded-2xl px-12 py-2.5 focus:outline-none focus:border-primary text-sm font-medium transition-all group-hover:border-primary/50"
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <CreateNewMenu userId={userId} />
        <div className="w-10 h-10 rounded-full border-2 border-card shadow-md bg-primary flex items-center justify-center text-primary-foreground font-bold transition-transform hover:scale-105 cursor-pointer">
          {displayName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
