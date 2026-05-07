'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GROUP_TYPE_META } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState('other')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Group name is required'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name: name.trim(), type, description: description.trim() || null, created_by: user.id })
      .select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, role: 'admin' })

    toast.success('Group created!')
    router.push(`/groups/${group.id}`)
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link href="/groups" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to groups
      </Link>
      <h1 className="text-2xl font-semibold mb-6">Create a group</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Group name</label>
          <input className="input" placeholder="e.g. Barcelona Trip, Flat Share..." value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div>
          <label className="label">Type</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(GROUP_TYPE_META).map(([key, meta]) => (
              <button
                key={key} type="button"
                onClick={() => setType(key)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors ${type === key ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className="text-xl">{meta.icon}</span>
                <span className="text-xs">{meta.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea className="input h-20 resize-none" placeholder="What's this group for?" value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1 justify-center py-2.5" disabled={loading}>
            {loading ? 'Creating…' : 'Create group'}
          </button>
          <Link href="/groups" className="btn flex-1 justify-center py-2.5">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
