import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import DeckUploader from '@/components/DeckUploader'

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Ensure user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the specific deck and verify ownership
  const { data: deck } = await supabase
    .from('decks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!deck) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Navigation / Breadcrumb */}
        <Link
          href="/dashboard"
          className="text-gray-500 hover:text-white transition-all mb-10 inline-flex items-center gap-2 group text-sm font-bold uppercase tracking-widest"
        >
          <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          Back to Dashboard
        </Link>

        {/* Deck Header */}
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Study Deck
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-4 leading-tight">{deck.title}</h1>
          <p className="text-gray-500 text-xl max-w-2xl leading-relaxed">
            {deck.description || 'No description provided for this study deck.'}
          </p>
        </header>

        {/* Uploader Section */}
        <section className="relative">
          <div className="absolute inset-0 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative bg-[#0d0d0d] border border-[#1a1a1a] rounded-[3.5rem] p-8 md:p-16 shadow-2xl overflow-hidden">
            <div className="mb-12">
              <h2 className="text-2xl font-black mb-3">Batch Import Flashcards</h2>
              <p className="text-gray-500 leading-relaxed">
                Streamline your workflow by uploading your existing materials. We support structured CSV and JSON files.
              </p>
            </div>
            
            <DeckUploader deckId={id} />
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-[#1a1a1a]">
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">CSV Requirements</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Required columns: <code className="text-gray-400">question</code>, <code className="text-gray-400">answer</code>. 
                  Optional: <code className="text-gray-400">multiple_choice_options</code> (as JSON array).
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">JSON Format</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  An array of objects with <code className="text-gray-400">question</code> and <code className="text-gray-400">answer</code> keys.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
