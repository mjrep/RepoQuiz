import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function DeckDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params

  // Fetching data in parallel to reduce load times
  const [deckResponse, cardsResponse] = await Promise.all([
    supabase.from('decks').select('*, profiles(full_name)').eq('id', id).single(),
    supabase.from('cards').select('*').eq('deck_id', id).order('created_at', { ascending: true })
  ])

  const deck = deckResponse.data
  const cards = cardsResponse.data

  if (!deck) {
    notFound()
  }

  const authorName = (deck.profiles as any)?.full_name || 'Anonymous Learner'

  return (
    <div className="h-screen w-full bg-[#f8f7f2] text-[#3e4a3d] font-sans flex overflow-hidden">
      
      {/* Sidebar - Matching Width */}
      <aside className="w-80 bg-white border-r border-[#edece6] flex flex-col hidden lg:flex h-full">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#7c9070] rounded-xl flex items-center justify-center shadow-lg shadow-[#7c9070]/20">
            <span className="text-white font-bold text-base">R</span>
          </div>
          <span className="text-2xl font-black tracking-tighter text-[#3e4a3d]">RepoQuiz</span>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          <Link href="/dashboard" className="flex items-center gap-4 px-5 py-3.5 text-gray-400 hover:text-[#7c9070] hover:bg-[#f0f2eb] rounded-2xl font-bold transition-all group">
            <svg className="w-5 h-5 group-hover:text-[#7c9070]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </Link>
          <Link href="/dashboard/library" className="flex items-center gap-4 px-5 py-3.5 bg-[#e8eae3] text-[#3e4a3d] rounded-2xl font-bold transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Library
          </Link>
          <a href="#" className="flex items-center gap-4 px-5 py-3.5 text-gray-400 hover:text-[#7c9070] hover:bg-[#f0f2eb] rounded-2xl font-bold transition-all group">
            <svg className="w-5 h-5 group-hover:text-[#7c9070]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            Flashcards
          </a>
          <a href="#" className="flex items-center gap-4 px-5 py-3.5 text-gray-400 hover:text-[#7c9070] hover:bg-[#f0f2eb] rounded-2xl font-bold transition-all group">
            <svg className="w-5 h-5 group-hover:text-[#7c9070]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Quizzes
          </a>
        </nav>

        <div className="px-8 mb-8">
           <div className="p-8 bg-[#7c9070] rounded-[2rem] text-white shadow-xl shadow-[#7c9070]/20">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Upgrade</p>
              <h4 className="text-sm font-black mb-4 leading-tight">Unlock AI deck generation and offline mode.</h4>
              <button className="w-full py-3 bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all">Upgrade Now</button>
           </div>
        </div>

        <div className="p-6 border-t border-[#edece6]">
          <SignOutButton />
        </div>
      </aside>

      {/* Main Study Hub Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header - Fixed */}
        <header className="h-16 px-10 border-b border-[#edece6] bg-white/50 backdrop-blur-xl flex items-center justify-between z-40">
           <div className="flex items-center gap-8">
              <span className="text-sm font-bold text-gray-400">Dashboard</span>
              <span className="text-sm font-bold text-[#7c9070] border-b-2 border-[#7c9070] h-16 flex items-center">Library</span>
           </div>
           <div className="flex items-center gap-6">
              <button className="text-gray-400 hover:text-[#7c9070] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </button>
              <Link href="/dashboard" className="bg-[#7c9070] text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#6b7d61] shadow-lg shadow-[#7c9070]/20">Create Set</Link>
              <div className="w-8 h-8 rounded-full bg-[#7c9070] flex items-center justify-center text-white text-[10px] font-black border-2 border-white shadow-sm">
                {authorName.charAt(0)}
              </div>
           </div>
        </header>

        {/* Study Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-[#f8f7f2] scroll-smooth">
          <div className="p-12 max-w-6xl mx-auto space-y-12">
            
            {/* Breadcrumbs & Title Area */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>Library</span>
                <span className="text-gray-300">›</span>
                <span className="text-gray-500 truncate">{deck.title}</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-6xl font-serif font-black tracking-tight text-[#3e4a3d] leading-tight">
                  {deck.title}
                </h1>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#7c9070] flex items-center justify-center text-[10px] text-white">
                        {authorName.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-[#7c9070] hover:underline cursor-pointer">{authorName}</span>
                   </div>
                   <span className="text-gray-300">|</span>
                   <span className="px-3 py-1 bg-white border border-[#edece6] rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">
                     {cards?.length || 0} Terms
                   </span>
                </div>
                <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-4xl">
                  {deck.description || "Comprehensive foundational concepts for this study set. Designed for active recall and long-term mastery."}
                </p>
              </div>
            </div>

            {/* Interaction Modes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Flashcards', desc: 'Practice with cards', icon: '🎴' },
                { title: 'Learn', desc: 'Master every term', icon: '🧠' },
                { title: 'Test', desc: 'Assess knowledge', icon: '📝' },
                { title: 'Match', desc: 'Race against time', icon: '🧩' },
              ].map((mode) => (
                <div key={mode.title} className="bg-white border border-[#edece6] rounded-[2.5rem] p-10 flex flex-col items-center text-center group hover:border-[#7c9070]/30 hover:shadow-xl transition-all cursor-pointer">
                  <div className="w-16 h-16 bg-[#f8f7f2] rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:scale-110 transition-transform">
                    {mode.icon}
                  </div>
                  <h3 className="text-xl font-black mb-2 text-[#3e4a3d]">{mode.title}</h3>
                  <p className="text-xs text-gray-400 font-medium">{mode.desc}</p>
                </div>
              ))}
            </div>

            {/* Terms Section Header */}
            <div className="pt-12 flex items-center justify-between border-t border-[#edece6]">
              <h2 className="text-3xl font-black tracking-tight text-[#3e4a3d]">
                Terms in this set ({cards?.length || 0})
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search terms..." 
                    className="w-72 bg-white border border-[#edece6] rounded-full px-12 py-3.5 focus:outline-none focus:border-[#7c9070] text-sm font-medium shadow-sm transition-all"
                  />
                  <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <button className="p-3.5 bg-white border border-[#edece6] rounded-full text-gray-400 hover:text-[#7c9070] transition-all shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4.5h18m-18 5h18m-18 5h18m-18 5h18" /></svg>
                </button>
              </div>
            </div>

            {/* Term Cards List */}
            <div className="space-y-6">
              {cards && cards.length > 0 ? (
                cards.map((card) => (
                  <div key={card.id} className="bg-white border border-[#edece6] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-start gap-12 group hover:shadow-lg transition-all border-l-8 hover:border-l-[#7c9070] border-l-transparent">
                    <div className="flex-1">
                      <p className="text-2xl font-black text-[#3e4a3d] leading-tight">
                        {card.question}
                      </p>
                    </div>
                    <div className="hidden md:block w-px h-16 bg-[#edece6] self-center" />
                    <div className="flex-[2]">
                      <p className="text-lg text-gray-500 font-medium leading-relaxed">
                        {card.answer}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 bg-white/50 border border-dashed border-[#edece6] rounded-[3rem] text-center">
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No terms uploaded yet.</p>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="flex justify-center pt-8 pb-20">
               <Link 
                href={`/dashboard/deck/${id}`}
                className="bg-[#3e4a3d] text-white px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-[#2c352c] transition-all shadow-2xl shadow-[#3e4a3d]/20 active:scale-[0.98]"
               >
                 Add or Remove Terms
               </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
