import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExpenseRow from '@/components/expenses/ExpenseRow'

export default async function ActivityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: memberRows } = await supabase
    .from('group_members').select('group_id').eq('user_id', user.id)

  const groupIds = memberRows?.map(r => r.group_id) ?? []
  let expenses: any[] = []

  if (groupIds.length > 0) {
    const { data } = await supabase
      .from('expenses')
      .select('*, payer:profiles!expenses_paid_by_fkey(id,full_name,avatar_url), group:groups(id,name), splits:expense_splits(id,user_id,amount,settled,profiles(id,full_name,avatar_url))')
      .in('group_id', groupIds)
      .order('date', { ascending: false })
    expenses = data ?? []
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Activity</h1>
        <p className="text-sm text-gray-500">All expenses across your groups</p>
      </div>
      <div className="card">
        {expenses.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No expenses yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {expenses.map(e => (
              <div key={e.id}>
                {e.group && (
                  <div className="px-5 pt-3 pb-0">
                    <span className="text-xs text-gray-400">{e.group.name}</span>
                  </div>
                )}
                <ExpenseRow expense={e} currentUserId={user.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
