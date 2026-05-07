'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InviteMember({ groupId }: { groupId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const { data: profile } = await supabase
      .from('profiles').select('id').eq('email', email.trim().toLowerCase()).single()

    if (!profile) {
      toast.error('No user found with that email. They need to sign up first.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: profile.id, role: 'member' })
    if (error?.code === '23505') {
      toast.error('This person is already in the group.')
    } else if (error) {
      toast.error(error.message)
    } else {
      toast.success('Member added!')
      setEmail('')
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn text-xs py-1 px-2.5 gap-1">
        <UserPlus className="w-3.5 h-3.5" /> Invite
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Invite member</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input className="input" type="email" placeholder="friend@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                <p className="text-xs text-gray-400 mt-1">They must have a SplitwiseR account already.</p>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
                  {loading ? 'Adding…' : 'Add member'}
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
