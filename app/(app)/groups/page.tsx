import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GROUP_TYPE_META } from '@/lib/utils'
import { Users, Plus } from 'lucide-react'

export default async function GroupsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('role, groups(id, name, type, description, created_by, group_members(user_id))')
    .eq('user_id', user.id)

  const groups = memberRows?.map(r => ({ ...(r.groups as any), myRole: r.role })) ?? []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Groups</h1>
          <p className="text-sm text-gray-500">Manage your shared expense groups</p>
        </div>
        <Link href="/groups/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New group
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="card p-16 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="font-medium text-gray-700 mb-1">No groups yet</h2>
          <p className="text-sm text-gray-500 mb-4">Create a group to start splitting expenses with friends</p>
          <Link href="/groups/new" className="btn-primary inline-flex">Create your first group</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {groups.map((g: any) => {
            const meta = GROUP_TYPE_META[g.type] ?? GROUP_TYPE_META.other
            const memberCount = g.group_members?.length ?? 0
            return (
              <Link key={g.id} href={`/groups/${g.id}`}>
                <div className="card p-5 hover:border-brand-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">{meta.icon}</div>
                    {g.myRole === 'admin' && (
                      <span className="badge bg-purple-50 text-purple-700">admin</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{g.name}</h3>
                  <p className="text-sm text-gray-500">{memberCount} member{memberCount !== 1 ? 's' : ''} · {meta.label}</p>
                  {g.description && <p className="text-xs text-gray-400 mt-2 line-clamp-1">{g.description}</p>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
