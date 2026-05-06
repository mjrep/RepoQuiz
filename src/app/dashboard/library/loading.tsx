export default function LibraryLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <div className="h-16 border-b border-border bg-card animate-pulse" />
      <div className="flex-1 p-8 md:p-12 space-y-10">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-muted rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded-xl animate-pulse" />
        </div>
        <div className="h-12 w-full bg-muted rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-[1.5rem] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
