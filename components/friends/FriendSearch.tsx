'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getInitials, avatarColor } from '@/lib/utils'
import { Search, UserPlus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  currentUserId: string
  existingFriendIds: string[]
}

export default function FriendSearch({ currentUserId, existingFriendIds }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState<string | null>(null)

  async function handleSearch(value: string) {
    setQuery(value)
    if (value.trim().length < 2) { setResults([]); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .or(`email.ilike.%${value}%,full_name.ilike.%${value}%`)
      .neq('id', currentUserId)
      .limit(8)
    setResults(data ?? [])
    setLoading(false)
  }

  async function sendRequest(userId: string) {
    setSending(userId)
    const supabase = createClient()
    const { error } = await supabase.from('friendships').insert({
      requester_id: currentUserId,
      addressee_id: userId,
      status: 'pending'
    })
    if (error?.code === '23505') {
      toast.error('Friend request already sent!')
    } else if (error) {
      toast.error(error.message)
    } else {
      toast.success('Friend request sent!')
      router.refresh()
    }
    setSending(null)
  }

  return (
    <div className="card mb-4">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or email…"
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
        </div>
      </div>

      {results.length > 0 && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {results.map(profile => {
            const isAlready = existingFriendIds.includes(profile.id)
            return (
              <div key={profile.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${avatarColor(profile.id)}`}>
                  {getInitials(profile.full_name || profile.email)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{profile.full_name || profile.email}</p>
                  <p className="text-xs text-gray-400">{profile.email}</p>
                </div>
                {isAlready ? (
                  <span className="text-xs text-gray-400">Already friends</span>
                ) : (
                  <button
                    onClick={() => sendRequest(profile.id)}
                    disabled={sending === profile.id}
                    className="btn text-xs py-1.5 px-3 gap-1 border-brand-200 text-brand-600 hover:bg-brand-50"
                  >
                    {sending === profile.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <UserPlus className="w-3.5 h-3.5" />}
                    Add
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
          No users found for "{query}"
        </div>
      )}
    </div>
  )
}