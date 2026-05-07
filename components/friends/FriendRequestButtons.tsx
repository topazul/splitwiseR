'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FriendRequestButtons({ friendshipId }: { friendshipId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)

  async function handle(action: 'accept' | 'decline') {
    setLoading(action)
    const supabase = createClient()
    const { error } = await supabase
      .from('friendships')
      .update({ status: action === 'accept' ? 'accepted' : 'declined', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(action === 'accept' ? 'Friend added!' : 'Request declined')
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle('accept')}
        disabled={loading !== null}
        className="btn text-xs py-1.5 px-3 gap-1 border-brand-200 text-brand-600 hover:bg-brand-50"
      >
        <Check className="w-3.5 h-3.5" />
        {loading === 'accept' ? 'Accepting…' : 'Accept'}
      </button>
      <button
        onClick={() => handle('decline')}
        disabled={loading !== null}
        className="btn text-xs py-1.5 px-3 gap-1 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
      >
        <X className="w-3.5 h-3.5" />
        {loading === 'decline' ? 'Declining…' : 'Decline'}
      </button>
    </div>
  )
}