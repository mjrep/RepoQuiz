import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/Topbar'
import Image from 'next/image'
import MascotBanner from '@/components/MascotBanner'
import { Sparkles, LayoutGrid, ArrowRight, Zap, TrendingUp } from 'lucide-react'

export default async function DashboardMainPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all core data in parallel
  const [decksRes, progressRes, profileRes] = await Promise.all([
    supabase.from('decks').select('*, cards(count)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('user_card_progress').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('full_name').eq('id', user.id).single()
  ])

  const decks = decksRes.data || []
  const allProgress = progressRes.data || []
  const profile = profileRes.data
  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Explorer'

  // Calculate Overall Mastery
  // Sum of mastery points (consecutive_correct / 3) / Total Cards * 100
  const totalCardsCount = decks.reduce((acc, d) => acc + (d.cards?.[0]?.count || 0), 0)
  const totalMasteryPoints = allProgress.reduce((acc, p) => acc + Math.min(3, p.consecutive_correct || 0), 0)
  const totalPossiblePoints = totalCardsCount * 3
  const overallMastery = totalPossiblePoints > 0 ? Math.round((totalMasteryPoints / totalPossiblePoints) * 100) : 0

  // Calculate Streak (Simple version: Count unique days in progress updates)
  const activeDays = new Set(allProgress.map(p => new Date(p.updated_at).toDateString())).size
  const streak = activeDays // For now, simple count. Real streak logic would need daily sequence check.

  return (
    <>
      <Topbar userId={user.id} displayName={displayName} userEmail={user.email} />
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
        {/* Full Width Hero Section Container */}
        <div className="w-full px-4 md:px-8 pt-6 md:pt-10 overflow-x-hidden">
          <div className="relative p-8 md:p-12 bg-primary rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-xl shadow-primary/10 flex flex-col lg:flex-row items-center justify-between gap-12 min-h-[220px] md:min-h-[340px] text-primary-foreground max-w-[1600px] mx-auto px-10 md:px-20">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -mr-24 -mt-24 rounded-full" />
            
            <div className="relative z-20 text-center lg:text-left max-w-xl">
              <h2 className="text-2xl md:text-5xl font-black mb-4 leading-tight">Welcome back, {displayName.split(' ')[0]}!</h2>
              <p className="text-primary-foreground/80 font-medium text-base md:text-xl mb-8">Continue your journey towards mastery.</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4">
                <div className="px-5 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-black text-[10px] md:text-[11px] uppercase tracking-widest">{streak} Day Activity</span>
                </div>
                <div className="px-5 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-white" />
                  <span className="font-black text-[10px] md:text-[11px] uppercase tracking-widest">Mastery at {overallMastery}%</span>
                </div>
              </div>
            </div>

            {/* Mascot with Behavior-Based Chat - HIDDEN ON MOBILE/TABLET */}
            <div className="hidden lg:block relative w-72 h-72 flex-shrink-0">
              <MascotBanner streak={streak} mastery={overallMastery} />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-8 md:py-12 space-y-8 md:space-y-10">
          {/* Recent Decks Section */}
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-[#3e4a3d]" />
                <h3 className="text-lg md:text-xl font-black tracking-tight text-[#3e4a3d]">Recent Decks</h3>
              </div>
              <Link href="/dashboard/library" className="text-[9px] font-black text-primary hover:text-foreground transition-colors flex items-center gap-2 uppercase tracking-widest">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {decks.length === 0 ? (
                <div className="col-span-full py-10 text-center bg-muted/20 rounded-[2rem] border border-dashed border-border">
                  <p className="text-muted-foreground font-medium mb-4 text-sm">No decks yet. Start your journey!</p>
                  <Link href="/dashboard/library" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest">Create First Deck</Link>
                </div>
              ) : (
                decks.slice(0, 3).map((deck) => {
                  const cardCount = deck.cards?.[0]?.count || 0
                  const deckProgress = allProgress.filter(p => p.deck_id === deck.id)
                  const deckMasteryPoints = deckProgress.reduce((acc, p) => acc + Math.min(3, p.consecutive_correct || 0), 0)
                  const deckPossiblePoints = cardCount * 3
                  const deckMastery = deckPossiblePoints > 0 ? Math.round((deckMasteryPoints / deckPossiblePoints) * 100) : 0

                  return (
                    <Link 
                      key={deck.id} 
                      href={`/dashboard/library/${deck.id}`} 
                      className="group bg-card border border-border rounded-[1.5rem] md:rounded-[2rem] p-6 hover:border-primary/50 transition-all duration-300 flex flex-col h-48 md:h-52 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-auto">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-muted rounded-xl flex items-center justify-center border border-border group-hover:border-primary/30 transition-all text-lg md:text-xl shadow-sm">📚</div>
                        <span className="px-2 py-0.5 bg-muted text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground rounded-full border border-border">Set</span>
                      </div>
                      <h4 className="text-lg md:text-xl font-black text-foreground group-hover:text-primary transition-colors line-clamp-1 mt-4">{deck.title}</h4>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-4">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500" 
                          style={{ width: `${deckMastery}%` }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                        <span>{deckMastery}% Mastered</span>
                        <span>{cardCount} Cards</span>
                      </div>
                    </Link>
                  )
                })
              )}
              
              {decks.length > 0 && (
                <Link 
                  href="/dashboard/library" 
                  className="bg-card border-2 border-dashed border-border rounded-[1.5rem] md:rounded-[2rem] p-6 flex flex-col items-center justify-center text-center group hover:border-primary transition-all shadow-sm h-48 md:h-52"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-muted rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <h4 className="text-sm md:text-base font-black text-foreground">View Library</h4>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
