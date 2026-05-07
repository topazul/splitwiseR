'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Sparkles, Loader2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  groups: any[]
  currentUserId: string
}

export default function AIParser({ groups, currentUserId }: Props) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed] = useState<any>(null)
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id ?? '')
  const [saving, setSaving] = useState(false)

  async function handleParse() {
    if (!input.trim()) return
    setLoading(true)
    setParsed(null)
    try {
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: input })
      })
      if (!res.ok) throw new Error('Parse failed')
      const data = await res.json()
      setParsed(data)
    } catch {
      toast.error('Could not parse. Try again.')
    }
    setLoading(false)
  }

  async function handleConfirm() {
    if (!parsed || !selectedGroup) return
    setSaving(true)
    const supabase = createClient()

    const { data: expense, error: eErr } = await supabase
      .from('expenses')
      .insert({ group_id: selectedGroup, paid_by: currentUserId, title: parsed.title, amount: parsed.amount, category: parsed.category, date: parsed.date, notes: parsed.notes })
      .select().single()

    if (eErr) { toast.error(eErr.message); setSaving(false); return }

    // Get group members for split mapping
    const { data: members } = await supabase.from('group_members').select('user_id, profiles(full_name)').eq('group_id', selectedGroup)
    const memberMap = Object.fromEntries(members?.map((m: any) => [m.profiles?.full_name?.toLowerCase(), m.user_id]) ?? [])

    const splitRows = (parsed.splits ?? []).map((s: any) => {
      const uid = memberMap[s.name?.toLowerCase()] ?? currentUserId
      return { expense_id: expense.id, user_id: uid, amount: s.amount, settled: uid === currentUserId }
    })

    if (splitRows.length === 0) {
      const perPerson = parsed.amount / (members?.length ?? 1)
      members?.forEach((m: any) => {
        splitRows.push({ expense_id: expense.id, user_id: m.user_id, amount: perPerson, settled: m.user_id === currentUserId })
      })
    }

    await supabase.from('expense_splits').insert(splitRows)
    toast.success('Expense added from AI!')
    setParsed(null)
    setInput('')
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <Sparkles className="w-4 h-4 text-brand-500" />
        <h2 className="font-medium text-gray-900">AI expense parser</h2>
      </div>
      <div className="p-4 space-y-3">
        <textarea
          className="input h-20 resize-none text-sm"
          placeholder='e.g. "Dinner at Nobu was $180 for me, Sofia and Marco. I paid."'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleParse() }}
        />
        {groups.length > 1 && (
          <select className="input text-sm" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
        <button onClick={handleParse} disabled={loading || !input.trim()} className="btn-primary w-full justify-center text-sm">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing…</> : <><Sparkles className="w-4 h-4" /> Parse with AI</>}
        </button>

        {parsed && (
          <div className="border border-brand-200 rounded-lg p-3 bg-brand-50 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">{parsed.title}</p>
              <span className="font-semibold text-gray-900">{formatCurrency(parsed.amount)}</span>
            </div>
            {parsed.splits?.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                <span>{s.name}</span>
                <span>{formatCurrency(s.amount)}</span>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button onClick={handleConfirm} disabled={saving} className="btn-primary flex-1 justify-center text-xs py-1.5">
                {saving ? 'Adding…' : <><Check className="w-3 h-3" /> Add expense</>}
              </button>
              <button onClick={() => setParsed(null)} className="btn flex-1 justify-center text-xs py-1.5">
                <X className="w-3 h-3" /> Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
