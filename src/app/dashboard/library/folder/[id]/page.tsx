import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Topbar from '@/components/Topbar'
import FolderDetailContent from '@/components/FolderDetailContent'

export default async function FolderDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params

  // Fetch folder details, decks in this folder, and ALL user decks (for management)
  const [folderRes, decksRes, allUserDecksRes, allFoldersRes] = await Promise.all([
    supabase.from('folders').select('*').eq('id', id).single(),
    supabase.from('decks').select('*, cards(count)').eq('folder_id', id).order('created_at', { ascending: false }),
    supabase.from('decks').select('*, cards(count)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('folders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  ])

  const folder = folderRes.data
  const decksInFolder = decksRes.data || []
  const allUserDecks = allUserDecksRes.data || []
  const allFolders = allFoldersRes.data || []

  if (!folder) notFound()

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Explorer'

  return (
    <>
      <Topbar 
        userId={user.id} 
        displayName={displayName} 
      />

      <div className="flex-1 overflow-y-auto scroll-smooth bg-background transition-colors duration-300">
        <div className="w-full px-12 md:px-20 py-12 flex flex-col min-h-full">
          <FolderDetailContent 
            folder={folder}
            decks={decksInFolder}
            allUserDecks={allUserDecks}
            allFolders={allFolders}
            userId={user.id}
          />
        </div>
      </div>
    </>
  )
}
