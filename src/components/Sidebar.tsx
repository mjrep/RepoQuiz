'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SignOutButton from './SignOutButton'
import { LayoutDashboard, BookOpen, GraduationCap } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Decks', href: '/dashboard/library', icon: BookOpen },
    { name: 'Study', href: '/dashboard/study', icon: GraduationCap },
  ]

  return (
    <aside className="w-72 bg-card border-r border-border flex flex-col hidden lg:flex h-full sticky top-0 transition-colors duration-300">
      <div className="p-8 flex items-center gap-4">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-primary-foreground font-bold text-base">R</span>
        </div>
        <span className="text-2xl font-black tracking-tighter text-foreground">RepoQuiz</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link 
              key={item.name}
              href={item.href} 
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold transition-all group relative ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-2xl -z-10" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}`} />
              <span className="text-sm tracking-tight">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-6 border-t border-border">
        <SignOutButton />
      </div>
    </aside>
  )
}
