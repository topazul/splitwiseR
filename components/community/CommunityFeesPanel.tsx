'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Building2, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { CommunityFee } from '@/types'

const FREQ_LABELS: Record<string, string> = {
  monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually', one_time: 'One-time'
}

interface Props {
  groupId: string
  isAdmin: boolean
  currentUserId: string
}

export default function CommunityFeesPanel({ groupId, isAdmin, currentUserId }: Props) {
  const router = useRouter()
  const [fees, setFees] = useState<CommunityFee[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadFees() {
    const supabase = createClient()
    const { data } = await supabase.from('community_fees').select('*').eq('group_id', groupId).eq('active', true).order('created_at', { ascending: false })
    setFees(data ?? [])
  }

  useEffect(() => { loadFees() }, [groupId])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!name.trim() || isNaN(amt) || amt <= 0) { toast.error('Fill in name and amount'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('community_fees').insert({
      group_id: groupId, name: name.trim(), amount: amt,
      frequency, description: description.trim() || null,
      created_by: currentUserId, active: true
    })
    if (error) { toast.error(error.message) } else {
      toast.success('Fee added!')
      setOpen(false); setName(''); setAmount(''); setDescription('')
      loadFees()
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('community_fees').update({ active: false }).eq('id', id)
    toast.success('Fee removed')
    loadFees()
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-medium text-gray-900 flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Community fees
        </h2>
        {isAdmin && (
          <button onClick={() => setOpen(true)} className="btn text-xs py-1 px-2.5 gap-1">
            <Plus className="w-3.5 h-3.5" /> Add fee
          </button>
        )}
      </div>

      {fees.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">No community fees set up</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {fees.map(fee => (
            <div key={fee.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{fee.name}</p>
                {fee.description && <p className="text-xs text-gray-400 truncate">{fee.description}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(fee.amount)}</p>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{FREQ_LABELS[fee.frequency]}</span>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(fee.id)} className="ml-1 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Add community fee</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label">Fee name</label>
                <input className="input" placeholder="e.g. Monthly HOA fee" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount ($)</label>
                  <input className="input" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Frequency</label>
                  <select className="input" value={frequency} onChange={e => setFrequency(e.target.value)}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                    <option value="one_time">One-time</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea className="input h-16 resize-none" placeholder="What is this fee for?" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
                  {loading ? 'Adding…' : 'Add fee'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn flex-1 justify-center">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
