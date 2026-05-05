'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, Code, ChevronDown, CheckCircle2, AlertCircle, X, LayoutGrid } from 'lucide-react'
import Papa from 'papaparse'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface ImportSectionProps {
  deckId: string
}

export default function ImportSection({ deckId }: ImportSectionProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const downloadCSVTemplate = () => {
    const csvContent = `question,answer,multiple_choice_options\n"What is the capital of Japan?","Tokyo","[""Kyoto"", ""Osaka"", ""Tokyo"", ""Sapporo""]"\n"What is 2 + 2?","4",`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "repoquiz_template.csv")
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setIsMenuOpen(false)
  }

  const downloadJSONTemplate = () => {
    const jsonContent = JSON.stringify([
      {
        "question": "What does SSR stand for?",
        "answer": "Server-Side Rendering",
        "multiple_choice_options": ["Server-Side Rendering", "Static Site Rendering", "Single State React"]
      },
      {
        "question": "What port does Next.js use by default?",
        "answer": "3000"
      }
    ], null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "repoquiz_template.json")
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setIsMenuOpen(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setStatus(null)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      
      try {
        let cards: any[] = []

        if (file.name.endsWith('.csv')) {
          const results = Papa.parse(content, { header: true })
          cards = results.data
            .filter((row: any) => (row.question || row.front) && (row.answer || row.back))
            .map((row: any) => {
              let mcOptions = []
              try {
                if (row.multiple_choice_options) {
                  mcOptions = typeof row.multiple_choice_options === 'string' 
                    ? JSON.parse(row.multiple_choice_options) 
                    : row.multiple_choice_options
                }
              } catch (e) {
                mcOptions = row.multiple_choice_options ? row.multiple_choice_options.split(',').map((s: string) => s.trim()) : []
              }

              return {
                deck_id: deckId,
                question: row.question || row.front,
                answer: row.answer || row.back,
                multiple_choice_options: mcOptions,
                explanation: row.explanation || ''
              }
            })
        } else if (file.name.endsWith('.json')) {
          const data = JSON.parse(content)
          cards = (Array.isArray(data) ? data : [data])
            .filter((row: any) => row.question && row.answer)
            .map((row: any) => ({
              deck_id: deckId,
              question: row.question,
              answer: row.answer,
              multiple_choice_options: row.multiple_choice_options || [],
              explanation: row.explanation || ''
            }))
        } else {
          throw new Error('Unsupported file format')
        }

        if (cards.length === 0) throw new Error('No valid cards found in file')

        const { error } = await supabase.from('cards').insert(cards)
        if (error) throw error

        setStatus({ type: 'success', message: `Successfully imported ${cards.length} cards!` })
        setTimeout(() => setIsModalOpen(false), 2000)
        router.refresh()
      } catch (err: any) {
        setStatus({ type: 'error', message: err.message || 'Failed to parse file' })
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      {/* Trigger Box */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="group border-2 border-dashed border-border rounded-[2.5rem] p-10 bg-card/20 hover:bg-card/40 hover:border-primary/50 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-8 text-foreground">
          <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all">
            <Upload className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black">Import from file</h3>
            <p className="text-muted-foreground font-medium">
              Drag & drop or click — .csv, .json (Template recommended)
            </p>
          </div>
        </div>
      </div>

      {/* Download Template Dropdown */}
      <div className="flex justify-end relative">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-bold text-[11px] uppercase tracking-widest group"
        >
          <FileText className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary" />
          Download template
          <ChevronDown className={`w-3 h-3 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-3 w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={downloadCSVTemplate}
              className="w-full p-5 flex items-start gap-4 hover:bg-muted transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-black text-foreground">CSV template</div>
                <div className="text-[10px] font-medium text-muted-foreground/60 leading-relaxed">
                  front, back, category — paste from Google Sheets or Excel
                </div>
              </div>
            </button>
            
            <div className="h-[1px] bg-border" />
            
            <button 
              onClick={downloadJSONTemplate}
              className="w-full p-5 flex items-start gap-4 hover:bg-muted transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Code className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-black text-foreground">JSON template</div>
                <div className="text-[10px] font-medium text-muted-foreground/60 leading-relaxed">
                  Full .json structure — supports quiz fields and categories
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Batch Import Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => !isUploading && setIsModalOpen(false)}
          />
          
          <div className="relative w-full max-w-3xl bg-card border border-border rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden text-foreground">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 p-3 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-12 space-y-4">
              <h2 className="text-4xl font-black tracking-tight">Batch Import Flashcards</h2>
              <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-2xl">
                Streamline your workflow by uploading your existing materials. We support structured CSV and JSON files.
              </p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative group border-2 border-dashed border-border rounded-[2.5rem] p-20 bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer text-center mb-12"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".csv,.json" 
                className="hidden" 
              />
              
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground/30 group-hover:text-primary group-hover:border-primary/30 transition-all shadow-xl">
                  <div className="relative">
                     <Upload className={`w-8 h-8 ${isUploading ? 'animate-bounce' : ''}`} />
                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black">Upload Flashcards</h3>
                  <p className="text-muted-foreground/60 font-medium max-w-xs mx-auto">
                    Drag and drop your .csv or .json file here, or click to browse.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-1.5 bg-muted rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 border border-border">CSV</span>
                  <span className="px-4 py-1.5 bg-muted rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 border border-border">JSON</span>
                </div>
              </div>

              {status && (
                <div className={`absolute inset-0 flex items-center justify-center px-10 backdrop-blur-xl animate-in fade-in duration-300 rounded-[2.5rem] ${status.type === 'success' ? 'bg-primary/20' : 'bg-destructive/20'}`}>
                  <div className="flex flex-col items-center gap-4 text-center">
                    {status.type === 'success' ? <CheckCircle2 className="w-16 h-16 text-primary" /> : <AlertCircle className="w-16 h-16 text-destructive" />}
                    <span className={`font-black text-2xl ${status.type === 'success' ? 'text-primary' : 'text-destructive'}`}>{status.message}</span>
                    <button onClick={(e) => { e.stopPropagation(); setStatus(null); }} className="mt-4 px-6 py-2 bg-card border border-border hover:bg-muted rounded-xl text-sm font-bold transition-all">
                      Try again
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-12 pt-12 border-t border-border">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">CSV REQUIREMENTS</h4>
                <p className="text-xs text-muted-foreground/60 leading-relaxed font-medium">
                  Required columns: <span className="text-foreground">question</span>, <span className="text-foreground">answer</span>. Optional: <span className="text-foreground">multiple_choice_options</span> (as JSON array).
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">JSON FORMAT</h4>
                <p className="text-xs text-muted-foreground/60 leading-relaxed font-medium">
                  An array of objects with <span className="text-foreground">question</span> and <span className="text-foreground">answer</span> keys.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
