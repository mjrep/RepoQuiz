import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { GraduationCap, Sparkles, Clock, ArrowRight } from 'lucide-react'

export default async function StudyPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Explorer'

  return (
    <>
      <Topbar 
        userId={user.id} 
        displayName={displayName} 
      />

      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-12 md:px-20 py-12 space-y-12">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-primary">
              <GraduationCap className="w-8 h-8" />
              <h1 className="text-4xl font-black tracking-tight text-foreground">Study</h1>
            </div>
            <p className="text-muted-foreground font-medium text-lg">Pick up where you left off or start something new.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Daily Goal Card */}
            <div className="md:col-span-2 bg-primary rounded-[2.5rem] p-10 text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/20">
              <Sparkles className="absolute top-10 right-10 w-24 h-24 opacity-20 rotate-12" />
              <h3 className="text-3xl font-black mb-4">Daily Goal</h3>
              <p className="text-primary-foreground/80 font-medium text-lg max-w-md mb-10">You've mastered 15 terms today. Just 5 more to hit your daily target!</p>
              <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-white rounded-full w-[75%]" />
              </div>
              <div className="flex items-center justify-between font-black text-xs uppercase tracking-widest">
                <span>75% Complete</span>
                <span>20 Terms Goal</span>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-card border border-border rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center">
              <Clock className="w-12 h-12 text-primary mb-6" />
              <h4 className="text-4xl font-black mb-2 text-foreground">2.5h</h4>
              <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest">Study Time Today</p>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-2xl font-black tracking-tight text-foreground">Continue Studying</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="group bg-card border border-border rounded-3xl p-8 hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-2xl">
                      {i === 1 ? '🧬' : '🏺'}
                    </div>
                    <div>
                      <h5 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                        {i === 1 ? 'Advanced Genetics' : 'Ancient Civilizations'}
                      </h5>
                      <p className="text-sm text-muted-foreground font-medium">Last studied 2 hours ago</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
