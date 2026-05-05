'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, GraduationCap } from 'lucide-react'

export default function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Decks', href: '/dashboard/library', icon: BookOpen },
    { name: 'Study', href: '/dashboard/study', icon: GraduationCap },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-[200] px-6 py-4 flex items-center justify-around backdrop-blur-xl bg-card/80">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link 
            key={item.name}
            href={item.href} 
            className={`flex flex-col items-center gap-1 transition-all ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
