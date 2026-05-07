'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_META } from '@/lib/utils'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Member { user_id: string; profiles: { id: string; full_name: string; email: string } }

interface Props {
  groupId: string
  members: Member[]
  currentUserId: string
}

export default function AddExpenseButton({ groupId, members, currentUserId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.user_id))
  const [loading, setLoading] = useState(false)

  function toggleMember(id: string) {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const total = parseFloat(amount)
    if (!title.trim() || isNaN(total) || total <= 0) { toast.error('Fill in title and amount'); return }
    if (selectedMembers.length === 0) { toast.error('Select at least one member'); return }
    setLoading(true)

    const perPerson = parseFloat((total / selectedMembers.length).toFixed(2))
    const splits = selectedMembers.map(uid => ({ userId: uid, amount: perPerson }))

    const supabase = createClient()
    const { data: expense, error: eErr } = await supabase
      .from('expenses')
      .insert({ group_id: groupId, paid_by: currentUserId, title: title.trim(), amount: total, category, date, notes: notes.trim() || null })
      .select().single()

    if (eErr) { toast.error(eErr.message); setLoading(false); return }

    const splitRows = splits.map(s => ({ expense_id: expense.id, user_id: s.userId, amount: s.amount, settled: s.userId === currentUserId }))
    const { error: sErr } = await supabase.from('expense_splits').insert(splitRows)
    if (sErr) { toast.error(sErr.message); setLoading(false); return }

    toast.success('Expense added!')
    setOpen(false)
    setTitle(''); setAmount(''); setNotes('')
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Add expense
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Add expense</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="e.g. Dinner, Groceries…" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount ($)</label>
                  <input className="input" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                  {Object.entries(CATEGORY_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Split between</label>
                <div className="space-y-1.5">
                  {members.map(m => (
                    <label key={m.user_id} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={selectedMembers.includes(m.user_id)} onChange={() => toggleMember(m.user_id)} className="rounded" />
                      <span className="text-sm text-gray-700">
                        {m.profiles?.full_name || m.profiles?.email}
                        {m.user_id === currentUserId ? ' (you)' : ''}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedMembers.length > 0 && amount && (
                  <p className="text-xs text-gray-400 mt-2">
                    ${(parseFloat(amount || '0') / selectedMembers.length).toFixed(2)} per person
                  </p>
                )}
              </div>
              <div>
                <label className="label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea className="input h-16 resize-none" placeholder="Any extra details…" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
                  {loading ? 'Adding…' : 'Add expense'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn flex-1 justify-center">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
