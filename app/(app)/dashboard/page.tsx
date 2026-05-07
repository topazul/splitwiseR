import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeBalances } from '@/lib/balances'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import ExpenseRow from '@/components/expenses/ExpenseRow'
import GroupCard from '@/components/groups/GroupCard'
import AIParser from '@/components/expenses/AIParser'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch groups
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('role, groups(id, name, type, created_by)')
    .eq('user_id', user.id)

  const groups = memberRows?.map(r => ({ ...(r.groups as any), myRole: r.role })) ?? []

  // Fetch recent expenses
  const groupIds = groups.map((g: any) => g.id)
  let expenses: any[] = []
  if (groupIds.length > 0) {
    const { data } = await supabase
      .from('expenses')
      .select(`*, payer:profiles!expenses_paid_by_fkey(id,full_name,avatar_url), group:groups(id,name), splits:expense_splits(id,user_id,amount,settled)`)
      .in('group_id', groupIds)
      .order('date', { ascending: false })
      .limit(8)
    expenses = data ?? []
  }

  const { totalOwed, totalOwes, net } = computeBalances(expenses, user.id)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Your expense overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Owed to you</div>
          <div className="text-2xl font-semibold text-brand-600">{formatCurrency(totalOwed)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">You owe</div>
          <div className="text-2xl font-semibold text-red-500">{formatCurrency(totalOwes)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Net balance</div>
          <div className={`text-2xl font-semibold ${net >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Recent expenses */}
        <div className="col-span-3">
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">Recent expenses</h2>
              <Link href="/activity" className="text-xs text-brand-600 hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {expenses.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  No expenses yet.<br />
                  <Link href="/groups" className="text-brand-600 hover:underline mt-1 inline-block">Create a group to get started</Link>
                </div>
              ) : (
                expenses.map(e => <ExpenseRow key={e.id} expense={e} currentUserId={user.id} />)
              )}
            </div>
          </div>
        </div>

        {/* Groups + AI parser */}
        <div className="col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">Groups</h2>
              <Link href="/groups/new" className="text-xs text-brand-600 hover:underline">+ New</Link>
            </div>
            <div className="p-3 space-y-2">
              {groups.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">No groups yet</div>
              ) : (
                groups.map((g: any) => <GroupCard key={g.id} group={g} currentUserId={user.id} />)
              )}
            </div>
          </div>

          <AIParser groups={groups} currentUserId={user.id} />
        </div>
      </div>
    </div>
  )
}
