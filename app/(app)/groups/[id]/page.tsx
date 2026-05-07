import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { computeBalances } from '@/lib/balances'
import { formatCurrency, CATEGORY_META, GROUP_TYPE_META, getInitials, avatarColor } from '@/lib/utils'
import ExpenseRow from '@/components/expenses/ExpenseRow'
import AddExpenseButton from '@/components/expenses/AddExpenseButton'
import CommunityFeesPanel from '@/components/community/CommunityFeesPanel'
import InviteMember from '@/components/groups/InviteMember'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'

export default async function GroupPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: group } = await supabase
    .from('groups')
    .select('*, group_members(id, user_id, role, profiles(id, full_name, email, avatar_url))')
    .eq('id', params.id)
    .single()

  if (!group) notFound()

  const membership = group.group_members?.find((m: any) => m.user_id === user.id)
  if (!membership) redirect('/groups')

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, payer:profiles!expenses_paid_by_fkey(id,full_name,avatar_url), splits:expense_splits(id,user_id,amount,settled,profiles(id,full_name,avatar_url))')
    .eq('group_id', params.id)
    .order('date', { ascending: false })

  const allExpenses = expenses ?? []
  const { totalOwed, totalOwes, net } = computeBalances(allExpenses, user.id)
  const isAdmin = membership.role === 'admin'
  const meta = GROUP_TYPE_META[group.type] ?? GROUP_TYPE_META.other

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link href="/groups" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Groups
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{meta.icon}</div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{group.name}</h1>
            <p className="text-sm text-gray-500">{meta.label} · {group.group_members?.length} members</p>
          </div>
        </div>
        <AddExpenseButton groupId={group.id} members={group.group_members ?? []} currentUserId={user.id} />
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Owed to you</div>
          <div className="text-xl font-semibold text-brand-600">{formatCurrency(totalOwed)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">You owe</div>
          <div className="text-xl font-semibold text-red-500">{formatCurrency(totalOwes)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Net</div>
          <div className={`text-xl font-semibold ${net >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Expenses */}
        <div className="col-span-3">
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 font-medium text-gray-900">Expenses</div>
            <div className="divide-y divide-gray-50">
              {allExpenses.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No expenses yet</div>
              ) : (
                allExpenses.map((e: any) => <ExpenseRow key={e.id} expense={e} currentUserId={user.id} />)
              )}
            </div>
          </div>
        </div>

        {/* Members + community fees */}
        <div className="col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900 flex items-center gap-2"><Users className="w-4 h-4" /> Members</h2>
              {isAdmin && <InviteMember groupId={group.id} />}
            </div>
            <div className="divide-y divide-gray-50">
              {group.group_members?.map((m: any) => {
                const profile = m.profiles
                if (!profile) return null
                const netBal = allExpenses.reduce((acc: number, exp: any) => {
                  if (exp.paid_by === m.user_id) {
                    exp.splits?.forEach((s: any) => { if (s.user_id !== m.user_id && !s.settled) acc += s.amount })
                  } else {
                    const split = exp.splits?.find((s: any) => s.user_id === m.user_id)
                    if (split && !split.settled) acc -= split.amount
                  }
                  return acc
                }, 0)
                return (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${avatarColor(m.user_id)}`}>
                      {getInitials(profile.full_name || profile.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name || profile.email}</p>
                      <p className="text-xs text-gray-400">{m.role}</p>
                    </div>
                    <span className={`text-sm font-medium ${netBal > 0 ? 'text-brand-600' : netBal < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {netBal > 0 ? '+' : ''}{formatCurrency(netBal)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {group.type === 'community' && (
            <CommunityFeesPanel groupId={group.id} isAdmin={isAdmin} currentUserId={user.id} />
          )}
        </div>
      </div>
    </div>
  )
}
