'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const validatePassword = (pass: string) => {
    const hasNumber = /\d/.test(pass)
    const isLongEnough = pass.length >= 8
    return hasNumber && isLongEnough
  }

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!isLogin) {
      if (!name.trim()) {
        setError('Name is required')
        setLoading(false)
        return
      }
      if (!validatePassword(password)) {
        setError('Password must be at least 8 characters and contain a number')
        setLoading(false)
        return
      }
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })
        if (signUpError) throw signUpError

        // Explicitly create profile if needed (backup for trigger)
        if (user) {
          await supabase.from('profiles').upsert({
            id: user.id,
            full_name: name.trim(),
            updated_at: new Date().toISOString(),
          })
        }
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f2] font-sans overflow-hidden relative">
      
      {/* Desktop View */}
      <div className="hidden lg:block">
        
        {/* Brand Image Panel */}
        <div 
          className={`absolute top-0 bottom-0 w-1/2 transition-all duration-1000 ease-in-out z-30 overflow-hidden shadow-2xl bg-[#3e4a3d]
            ${isLogin ? 'left-1/2' : 'left-0'}
          `}
        >
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isLogin ? 'opacity-100' : 'opacity-0'}`}>
            <Image src="/login-bg.jpg" alt="Login" fill className="object-cover" priority />
          </div>
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isLogin ? 'opacity-0' : 'opacity-100'}`}>
            <Image src="/signup-bg.png" alt="Signup" fill className="object-cover" priority />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#000]/60 via-transparent to-transparent opacity-60" />
          
          <div className="absolute bottom-16 left-12 right-12 transition-all duration-700">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/10 p-12 rounded-[2.5rem] shadow-2xl">
              <h3 className="text-4xl font-black text-white mb-4 leading-tight tracking-tight">
                {isLogin ? "Master your subjects." : "Join the focus flow."}
              </h3>
              <p className="text-white/70 text-lg font-medium leading-relaxed max-w-md">
                {isLogin
                  ? "Experience active recall and spaced repetition in the most beautiful interface ever made for students."
                  : "Create an account to start your personalized learning journey with RepoQuiz."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form Panel - Enlarged */}
        <div 
          className={`absolute top-0 bottom-0 w-1/2 flex items-center justify-center p-16 lg:p-32 transition-all duration-1000 ease-in-out z-20 bg-[#f8f7f2]
            ${isLogin ? 'left-0' : 'left-1/2'}
          `}
        >
          <div className="w-full max-w-lg">
            <div className="mb-14">
              <div className="flex items-center gap-8 mb-16">
                <div className="relative w-40 h-40">
                  <Image 
                    src="/logo.png" 
                    alt="RepoQuiz Logo" 
                    fill
                    priority 
                    className="object-contain"
                  />
                </div>
                <span className="text-7xl font-black tracking-tighter text-[#3e4a3d]">RepoQuiz</span>
              </div>
              <h1 className="text-5xl font-black text-[#3e4a3d] mb-6 tracking-tight leading-tight">
                {isLogin ? 'Welcome back' : 'Start your journey'}
              </h1>
              <p className="text-[#7c9070] text-xl font-medium leading-relaxed">
                {isLogin ? 'Login to continue your mastery.' : 'Everything you need to focus, all in one place.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-8">
              {!isLogin && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                  <label className="text-xs font-black uppercase tracking-[0.25em] text-[#7c9070]/80 ml-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-8 py-5 bg-white border border-[#e5e7eb] rounded-[1.5rem] text-lg text-[#3e4a3d] placeholder-gray-400 focus:outline-none focus:border-[#7c9070] focus:ring-8 focus:ring-[#7c9070]/5 transition-all shadow-sm"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.25em] text-[#7c9070]/80 ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-8 py-5 bg-white border border-[#e5e7eb] rounded-[1.5rem] text-lg text-[#3e4a3d] placeholder-gray-400 focus:outline-none focus:border-[#7c9070] focus:ring-8 focus:ring-[#7c9070]/5 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-3 relative">
                <label className="text-xs font-black uppercase tracking-[0.25em] text-[#7c9070]/80 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-8 py-5 bg-white border border-[#e5e7eb] rounded-[1.5rem] text-lg text-[#3e4a3d] placeholder-gray-400 focus:outline-none focus:border-[#7c9070] focus:ring-8 focus:ring-[#7c9070]/5 transition-all shadow-sm pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-[#7c9070] hover:text-[#3e4a3d] transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-5 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-red-600 font-bold text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-[#7c9070] text-white font-black rounded-[1.5rem] text-lg hover:bg-[#6b7d61] active:scale-[0.98] transition-all shadow-2xl shadow-[#7c9070]/30 disabled:opacity-50 disabled:active:scale-100 uppercase tracking-widest mt-6"
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-14 flex flex-col items-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-[#7c9070] hover:text-[#3e4a3d] transition-colors font-black uppercase tracking-[0.25em]"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden flex flex-col min-h-screen p-10 items-center justify-center bg-[#f8f7f2]">
        <div className="w-full max-w-sm space-y-10">
          <div className="p-10 flex flex-col items-center gap-4 border-b border-border mb-4">
            <div className="relative w-24 h-24">
              <Image 
                src="/logo.png" 
                alt="RepoQuiz Logo" 
                fill
                priority 
                className="object-contain"
              />
            </div>
            <span className="text-3xl font-black tracking-tighter text-[#3e4a3d]">RepoQuiz</span>
          </div>
          <h2 className="text-4xl font-black text-[#7c9070] mt-6 text-center">{isLogin ? 'Login' : 'Sign Up'}</h2>
          
          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-5 bg-white border border-[#e5e7eb] rounded-2xl"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-5 bg-white border border-[#e5e7eb] rounded-2xl"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-5 bg-white border border-[#e5e7eb] rounded-2xl"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#7c9070] text-white font-black rounded-2xl shadow-xl shadow-[#7c9070]/20"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-xs font-black uppercase tracking-widest text-[#7c9070]">
            {isLogin ? "Sign Up Instead" : "Log In Instead"}
          </button>
        </div>
      </div>
    </div>
  )
}
