import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Topbar from '@/components/Topbar'
import CreateNewMenu from '@/components/CreateNewMenu'
import LibraryContent from '@/components/LibraryContent'
import { LayoutGrid, HelpCircle } from 'lucide-react'

export default async function LibraryListViewPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch decks and folders in parallel
  const [decksRes, foldersRes] = await Promise.all([
    supabase
      .from('decks')
      .select('*, cards(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  ])

  const decks = decksRes.data || []
  const folders = foldersRes.data || []

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Explorer'

  return (
    <>
      <Topbar 
        userId={user.id} 
        displayName={displayName} 
        userEmail={user.email}
      />

      <div className="flex-1 overflow-y-auto scroll-smooth bg-background transition-colors duration-300">
        <div className="w-full px-4 md:px-12 py-6 md:py-10 flex flex-col min-h-full">
          <div className="flex-1 space-y-10">
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-foreground">
                <LayoutGrid className="w-7 h-7 text-primary" />
                <h1 className="text-3xl font-black tracking-tight">Decks</h1>
              </div>
              <CreateNewMenu userId={user.id} />
            </div>

            {/* Main Library Content (Toggle, Search, Grids) */}
            <LibraryContent 
              decks={decks} 
              folders={folders} 
              userId={user.id} 
            />
          </div>
        </div>
      </div>
    </>
  )
}
