'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { createClient } from '@/utils/supabase/client'

interface DeckUploaderProps {
  deckId: string
}

interface FlashcardData {
  question: string
  answer: string
  multiple_choice_options?: string[] | string
}

export default function DeckUploader({ deckId }: DeckUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFile = async (file: File) => {
    setIsUploading(true)
    setStatus(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        let parsedData: any[] = []

        if (file.name.endsWith('.json')) {
          parsedData = JSON.parse(text)
        } else if (file.name.endsWith('.csv')) {
          const results = Papa.parse(text, { header: true, skipEmptyLines: true })
          parsedData = results.data
          
          if (results.errors.length > 0) {
            throw new Error('Malformed CSV file structure.')
          }
        } else {
          throw new Error('Unsupported file format. Please use .csv or .json.')
        }

        if (!Array.isArray(parsedData)) {
          throw new Error('Data must be an array of objects.')
        }

        const mappedCards = parsedData.map((item: any) => {
          let options: string[] = []
          
          // CRITICAL LOGIC: Robust parsing for multiple_choice_options
          try {
            if (item.multiple_choice_options) {
              if (Array.isArray(item.multiple_choice_options)) {
                options = item.multiple_choice_options
              } else if (typeof item.multiple_choice_options === 'string') {
                // Handle cases where CSV stringifies the array
                const cleaned = item.multiple_choice_options.trim()
                if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
                  options = JSON.parse(cleaned)
                } else if (cleaned) {
                  // Fallback for comma-separated strings if not JSON
                  options = cleaned.split(',').map((o: string) => o.trim())
                }
              }
            }
          } catch (err) {
            console.warn('Failed to parse options for a row, defaulting to empty array', err)
            options = []
          }

          return {
            deck_id: deckId,
            question: item.question || '',
            answer: item.answer || '',
            multiple_choice_options: options,
          }
        }).filter(card => card.question && card.answer) // Only insert cards with content

        if (mappedCards.length === 0) {
          throw new Error('No valid cards found in the file. Ensure you have "question" and "answer" columns.')
        }

        const { error } = await supabase.from('cards').insert(mappedCards)

        if (error) throw error

        setStatus({ type: 'success', message: `Successfully uploaded ${mappedCards.length} flashcards!` })
        if (fileInputRef.current) fileInputRef.current.value = ''
      } catch (err: any) {
        setStatus({ type: 'error', message: err.message || 'An unexpected error occurred during upload.' })
      } finally {
        setIsUploading(false)
      }
    }

    reader.readAsText(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-[2rem] p-12 transition-all cursor-pointer
          flex flex-col items-center justify-center text-center
          ${isDragging ? 'border-blue-500 bg-blue-500/5 scale-[1.01]' : 'border-[#262626] bg-[#0d0d0d] hover:border-[#3a3a3a]'}
          ${isUploading ? 'opacity-50 pointer-events-none' : 'opacity-100'}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          accept=".csv, .json"
          className="hidden"
        />

        <div className="w-16 h-16 bg-[#141414] rounded-2xl flex items-center justify-center mb-6 border border-[#262626]">
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-3xl">📤</span>
          )}
        </div>

        <h3 className="text-xl font-bold mb-2">
          {isUploading ? 'Uploading Cards...' : 'Upload Flashcards'}
        </h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Drag and drop your .csv or .json file here, or click to browse.
        </p>

        <div className="mt-8 flex gap-3 text-[10px] font-black uppercase tracking-widest text-gray-600">
          <span className="px-3 py-1 bg-[#1a1a1a] rounded-full border border-[#262626]">CSV</span>
          <span className="px-3 py-1 bg-[#1a1a1a] rounded-full border border-[#262626]">JSON</span>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-2xl text-sm font-medium text-center animate-in fade-in slide-in-from-top-2 ${
          status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {status.message}
        </div>
      )}
    </div>
  )
}
