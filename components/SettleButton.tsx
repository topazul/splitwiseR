'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  groupId: string
  fromUserId: string
  toUserId: string
  amount: number
}

export default function SettleButton({ groupId, fromUserId, toUserId, amount }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSettle() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('settlements').insert({
      group_id: groupId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount,
      settled_at: new Date().toISOString(),
    })
    if (error) { toast.error(error.message); setLoading(false); return }

    // Mark related splits as settled
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id')
      .eq('group_id', groupId)
      .eq('paid_by', toUserId)

    if (expenses?.length) {
      await supabase
        .from('expense_splits')
        .update({ settled: true, settled_at: new Date().toISOString() })
        .in('expense_id', expenses.map(e => e.id))
        .eq('user_id', fromUserId)
        .eq('settled', false)
    }

    toast.success('Settlement recorded!')
    setDone(true)
    setLoading(false)
    router.refresh()
  }

  if (done) {
    return <span className="text-xs text-brand-600 font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Settled</span>
  }

  return (
    <button onClick={handleSettle} disabled={loading} className="btn text-xs py-1.5 px-3 border-brand-200 text-brand-600 hover:bg-brand-50">
      {loading ? 'Settling…' : 'Mark settled'}
    </button>
  )
}
