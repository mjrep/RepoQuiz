import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { GraduationCap, Sparkles, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function StudyPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch real data
  const { data: decks } = await supabase
    .from('decks')
    .select('*, cards(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: allProgress } = await supabase
    .from('user_card_progress')
    .select('*, decks(title, id)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Explorer'

  // Calculate Terms Mastered Today
  const today = new Date().toDateString()
  const masteredToday = allProgress?.filter(p => 
    p.status === 'mastered' && new Date(p.updated_at).toDateString() === today
  ).length || 0

  const dailyGoal = 20
  const progressPercent = Math.min(100, Math.round((masteredToday / dailyGoal) * 100))

  // Get recently studied decks (unique decks from allProgress)
  const recentDeckIds = Array.from(new Set(allProgress?.map(p => p.deck_id))).slice(0, 4)
  const recentlyStudiedDecks = recentDeckIds.map(id => {
    const prog = allProgress?.find(p => p.deck_id === id)
    return {
      id: id,
      title: prog?.decks?.title || 'Unknown Deck',
      lastStudied: new Date(prog?.updated_at || '').toLocaleDateString()
    }
  }).filter(d => d.title !== 'Unknown Deck')

  return (
    <>
      <Topbar 
        userId={user.id} 
        displayName={displayName} 
        userEmail={user.email}
      />

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-6 md:py-10 space-y-8 md:space-y-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary">
              <GraduationCap className="w-6 h-6 md:w-7 md:h-7" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Study</h1>
            </div>
            <p className="text-muted-foreground font-medium text-sm md:text-base">Pick up where you left off or start something new.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daily Goal Card */}
            <div className="md:col-span-2 bg-primary rounded-[2rem] p-8 text-primary-foreground relative overflow-hidden shadow-xl shadow-primary/20 flex flex-col justify-center min-h-[180px]">
              <Sparkles className="absolute top-6 right-6 w-16 h-16 opacity-20 rotate-12" />
              <h3 className="text-xl md:text-2xl font-black mb-2">Daily Goal</h3>
              <p className="text-primary-foreground/80 font-medium text-sm md:text-base max-w-md mb-6">
                {masteredToday >= dailyGoal 
                  ? "Goal achieved! You've mastered your target for today." 
                  : `You've mastered ${masteredToday} terms today. Keep pushing to hit ${dailyGoal}!`}
              </p>
              <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between font-black text-[9px] uppercase tracking-widest">
                <span>{progressPercent}% Complete</span>
                <span>{dailyGoal} Terms Goal</span>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-card border border-border rounded-[2rem] p-8 flex flex-col justify-center items-center text-center shadow-sm">
              <Clock className="w-10 h-10 text-primary mb-4" />
              <h4 className="text-3xl font-black mb-1 text-foreground">
                {Math.round(allProgress?.length || 0)}
              </h4>
              <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest leading-tight">Total Terms<br/>In Progress</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg md:text-xl font-black tracking-tight text-foreground">Continue Studying</h3>
            
            {recentlyStudiedDecks.length === 0 ? (
              <div className="py-12 text-center bg-muted/20 rounded-[2rem] border border-dashed border-border">
                <p className="text-muted-foreground font-medium mb-4 text-sm">No recent activity. Start studying a deck!</p>
                <Link href="/dashboard/library" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest inline-block transition-transform hover:scale-105 active:scale-95">Go to Library</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {recentlyStudiedDecks.map((deck) => (
                  <Link 
                    key={deck.id} 
                    href={`/dashboard/library/${deck.id}`}
                    className="group bg-card border border-border rounded-2xl md:rounded-[2rem] p-6 hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-muted rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl border border-border group-hover:border-primary/20 transition-all">
                        📚
                      </div>
                      <div>
                        <h5 className="text-lg font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {deck.title}
                        </h5>
                        <p className="text-[11px] text-muted-foreground font-medium">Last active: {deck.lastStudied}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-2" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
