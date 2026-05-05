'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Image as ImageIcon, Type, Code, Bold, Italic, ChevronDown, Trash2, Edit3, Check, X } from 'lucide-react'

interface Card {
  id: string
  question: string
  answer: string
  multiple_choice_options?: string[]
  explanation?: string
}

interface DeckEditorProps {
  deckId: string
  initialTitle: string
  initialDescription: string
  cards: Card[]
}

export default function DeckEditor({ deckId, initialTitle, initialDescription, cards }: DeckEditorProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isQuizEnabled, setIsQuizEnabled] = useState(false)
  const [quizOptions, setQuizOptions] = useState(['', '', '', ''])
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0)
  const [explanation, setExplanation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsSubmitting(true)

    const cardData: any = {
      deck_id: deckId,
      question: question.trim(),
      answer: answer.trim(),
    }

    if (isQuizEnabled) {
      cardData.multiple_choice_options = quizOptions.filter(opt => opt.trim() !== '')
      cardData.explanation = explanation.trim()
    } else {
      cardData.multiple_choice_options = []
      cardData.explanation = null
    }

    let error
    if (editingCardId) {
      const { error: updateError } = await supabase
        .from('cards')
        .update(cardData)
        .eq('id', editingCardId)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('cards')
        .insert([cardData])
      error = insertError
    }

    if (error) {
      console.error('Error saving card:', error.message)
      setIsSubmitting(false)
      alert('Failed to save card. Please try again.')
    } else {
      resetForm()
      setIsSubmitting(false)
      router.refresh()
    }
  }

  const resetForm = () => {
    setQuestion('')
    setAnswer('')
    setQuizOptions(['', '', '', ''])
    setExplanation('')
    setIsQuizEnabled(false)
    setEditingCardId(null)
  }

  const handleEditCard = (card: Card) => {
    setEditingCardId(card.id)
    setQuestion(card.question)
    setAnswer(card.answer)
    
    if (card.multiple_choice_options && card.multiple_choice_options.length > 0) {
      setIsQuizEnabled(true)
      const newOptions = ['', '', '', '']
      card.multiple_choice_options.forEach((opt, i) => {
        if (i < 4) newOptions[i] = opt
      })
      setQuizOptions(newOptions)
      setExplanation(card.explanation || '')
    } else {
      setIsQuizEnabled(false)
      setQuizOptions(['', '', '', ''])
      setExplanation('')
    }
    
    // Scroll to form
    const formElement = document.getElementById('add-card-form')
    formElement?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleDeleteCard = async (cardId: string) => {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId)
    
    if (error) {
      alert('Failed to delete card')
    } else {
      if (editingCardId === cardId) resetForm()
      router.refresh()
    }
  }

  const handleSaveDeck = () => {
    router.push(`/dashboard/library/${deckId}`)
  }

  const handleCancel = () => {
    router.push(`/dashboard/library`)
  }

  const updateQuizOption = (index: number, value: string) => {
    const newOptions = [...quizOptions]
    newOptions[index] = value
    setQuizOptions(newOptions)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-32 transition-colors duration-300">
      
      {/* Added Cards List */}
      {cards.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
            CARDS ({cards.length})
          </h3>
          <div className="space-y-4">
            {cards.map((card, index) => (
              <div 
                key={card.id} 
                className={`bg-card border rounded-3xl p-6 flex items-center justify-between group transition-all shadow-sm ${
                  editingCardId === card.id ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-6 overflow-hidden">
                  <span className="text-xs font-black text-muted-foreground/50">{index + 1}</span>
                  <div className="space-y-1 overflow-hidden">
                    <h4 className="font-black text-foreground truncate">{card.question}</h4>
                    <p className="text-xs text-muted-foreground/80 truncate font-medium">{card.answer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditCard(card)}
                    className={`p-2 transition-colors ${editingCardId === card.id ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Card Section */}
      <div id="add-card-form" className="bg-card border border-border rounded-[2.5rem] p-10 space-y-10 shadow-2xl transition-all relative overflow-hidden">
        {editingCardId && (
          <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-in slide-in-from-left duration-500" />
        )}
        
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-foreground tracking-tight">
            {editingCardId ? 'Edit Card' : 'Add Card'}
          </h2>
          {editingCardId && (
            <button 
              onClick={resetForm}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSaveCard} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Front Box */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">
                FRONT (QUESTION) *
              </label>
              <div className="bg-muted border border-border rounded-3xl overflow-hidden focus-within:border-primary/50 transition-all">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
                  <div className="flex items-center gap-4 text-muted-foreground/60">
                    <Bold className="w-4 h-4 hover:text-foreground cursor-pointer transition-colors" />
                    <Italic className="w-4 h-4 hover:text-foreground cursor-pointer transition-colors" />
                    <Code className="w-4 h-4 hover:text-foreground cursor-pointer transition-colors" />
                    <div className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors">
                      <Type className="w-4 h-4" />
                      <span className="text-[10px] font-bold">[_]</span>
                    </div>
                  </div>
                  <button type="button" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 hover:text-foreground transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    Add image
                  </button>
                </div>
                <textarea
                  required
                  placeholder="What is...?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-transparent px-6 py-6 text-lg text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-h-[160px] resize-none"
                />
              </div>
            </div>

            {/* Back Box */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">
                BACK (ANSWER) *
              </label>
              <div className="bg-muted border border-border rounded-3xl overflow-hidden focus-within:border-primary/50 transition-all">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
                  <div className="flex items-center gap-4 text-muted-foreground/60">
                    <Bold className="w-4 h-4 hover:text-foreground cursor-pointer transition-colors" />
                    <Italic className="w-4 h-4 hover:text-foreground cursor-pointer transition-colors" />
                    <Code className="w-4 h-4 hover:text-foreground cursor-pointer transition-colors" />
                    <div className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors">
                      <Type className="w-4 h-4" />
                      <span className="text-[10px] font-bold">[_]</span>
                    </div>
                  </div>
                  <button type="button" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 hover:text-foreground transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    Add image
                  </button>
                </div>
                <textarea
                  placeholder="The answer is..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full bg-transparent px-6 py-6 text-lg text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-h-[160px] resize-none"
                />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground/40 italic ml-2">Optional if front has &#123;&#123;&#125;&#125; blanks</p>
            </div>
          </div>

          <div className="space-y-8">
            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <input 
                type="checkbox" 
                className="hidden peer" 
                checked={isQuizEnabled}
                onChange={(e) => setIsQuizEnabled(e.target.checked)}
              />
              <div className="w-6 h-6 rounded-lg border-2 border-border bg-muted peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                 <Check className={`w-4 h-4 text-primary-foreground scale-0 peer-checked:scale-100 transition-transform`} />
              </div>
              <span className={`text-sm font-black uppercase tracking-widest transition-colors ${isQuizEnabled ? 'text-primary' : 'text-muted-foreground/80 group-hover:text-foreground'}`}>
                Add quiz options
              </span>
            </label>

            {isQuizEnabled && (
              <div className="bg-muted border border-border rounded-[2rem] p-8 space-y-6 animate-in slide-in-from-top-4 duration-300 shadow-inner">
                <div className="grid grid-cols-1 gap-4">
                  {['A', 'B', 'C', 'D'].map((letter, index) => (
                    <div key={letter} className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setCorrectOptionIndex(index)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          correctOptionIndex === index 
                            ? 'border-primary bg-primary' 
                            : 'border-muted-foreground/40 hover:border-primary/50'
                        }`}
                      >
                        {correctOptionIndex === index && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
                      </button>
                      <span className="text-[10px] font-black text-muted-foreground/60 w-4">{letter}</span>
                      <input
                        type="text"
                        placeholder={index === 0 ? "Answer A (required)" : `Answer ${letter}`}
                        value={quizOptions[index]}
                        onChange={(e) => updateQuizOption(index, e.target.value)}
                        className={`flex-1 bg-card border border-border rounded-xl px-6 py-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-all ${
                          correctOptionIndex === index ? 'border-primary/50 ring-1 ring-primary/10 shadow-sm' : ''
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <textarea
                    placeholder="Explanation (optional)"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    rows={2}
                    className="w-full bg-card border border-border rounded-xl px-6 py-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (editingCardId ? 'Update Card' : '+ Add Card')}
          </button>
        </form>
      </div>

      {/* Save / Cancel Footer */}
      <div className="flex items-center justify-between pt-10 border-t border-border">
        <button 
          onClick={handleCancel}
          className="text-muted-foreground hover:text-foreground font-black text-sm uppercase tracking-widest transition-colors px-6 py-2"
        >
          Cancel
        </button>
        <button 
          onClick={handleSaveDeck}
          className="bg-foreground text-background px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-2xl active:scale-95"
        >
          Save Deck
        </button>
      </div>
    </div>
  )
}
