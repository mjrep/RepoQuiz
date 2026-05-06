export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Topbar Placeholder */}
      <div className="h-16 border-b border-border bg-card animate-pulse" />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10">
        {/* Hero Section Placeholder */}
        <div className="max-w-[1600px] mx-auto h-[340px] bg-muted rounded-[2.5rem] animate-pulse" />
        
        {/* Decks Grid Placeholder */}
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 bg-muted rounded-[2rem] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
