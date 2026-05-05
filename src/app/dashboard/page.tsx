import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/Topbar'
import { Sparkles, LayoutGrid, ArrowRight, Zap, TrendingUp } from 'lucide-react'

export default async function DashboardMainPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: decks } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Explorer'

  return (
    <>
      <Topbar userId={user.id} displayName={displayName} />
      
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="w-full px-12 md:px-20 py-12 space-y-12">
          {/* Hero Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 relative p-12 bg-primary rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/10 flex flex-col justify-center min-h-[320px] text-primary-foreground">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-3xl -mr-32 -mt-32 rounded-full" />
              <h2 className="text-5xl font-black mb-4">Welcome back, {displayName.split(' ')[0]}!</h2>
              <p className="text-primary-foreground/80 font-medium text-xl max-w-xl mb-10">You're on a roll. Continue your journey towards mastery.</p>
              <div className="flex items-center gap-6">
                <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-black text-xs uppercase tracking-widest">5 Day Streak</span>
                </div>
                <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-white" />
                  <span className="font-black text-xs uppercase tracking-widest">Mastery up 12%</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-[3rem] p-10 flex flex-col items-center justify-center text-center">
              <div className="relative w-36 h-36 mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" className="stroke-muted" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" className="stroke-primary transition-all duration-1000" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset="75.36" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-foreground">70%</span>
                </div>
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">Daily Goal</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Almost there!</p>
            </div>
          </div>

          {/* Recent Decks Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-black tracking-tight text-foreground">Recent Decks</h3>
              </div>
              <Link href="/dashboard/library" className="text-xs font-black text-primary hover:text-foreground transition-colors flex items-center gap-2 uppercase tracking-widest">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {decks && decks.slice(0, 3).map((deck) => (
                <Link 
                  key={deck.id} 
                  href={`/dashboard/library/${deck.id}`} 
                  className="group bg-card border border-border rounded-[2.5rem] p-8 hover:border-primary/50 transition-all duration-300 flex flex-col h-64"
                >
                  <div className="flex items-start justify-between mb-auto">
                    <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center border border-border group-hover:border-primary/30 transition-all text-2xl shadow-sm">📚</div>
                    <span className="px-3 py-1 bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground rounded-full border border-border">Set</span>
                  </div>
                  <h4 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors line-clamp-1 mt-6">{deck.title}</h4>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-6">
                    <div className="h-full bg-primary rounded-full w-[45%]" />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                    <span>45% Mastered</span>
                    <span>12 Cards</span>
                  </div>
                </Link>
              ))}
              
              <Link 
                href="/dashboard/library" 
                className="bg-card border-2 border-dashed border-border rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group hover:border-primary transition-all"
              >
                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-black text-foreground">See more</h4>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
