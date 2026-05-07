import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { simplifyDebts } from '@/lib/balances'
import { formatCurrency, getInitials, avatarColor } from '@/lib/utils'
import SettleButton from '@/components/SettleButton'

export default async function SettlePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: memberRows } = await supabase
    .from('group_members').select('group_id, groups(id,name)').eq('user_id', user.id)

  const groups = memberRows?.map(r => r.groups as any) ?? []
  const groupIds = groups.map((g: any) => g.id)

  let allDebts: Array<{ from: string; to: string; amount: number; groupId: string; groupName: string; fromProfile: any; toProfile: any }> = []

  for (const group of groups) {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*, splits:expense_splits(id,user_id,amount,settled,profiles(id,full_name,avatar_url))')
      .eq('group_id', group.id)

    if (!expenses) continue

    // Build net balances per user within this group
    const netMap: Record<string, number> = {}
    for (const exp of expenses) {
      if (!exp.splits) continue
      for (const split of exp.splits) {
        if (split.settled) continue
        if (exp.paid_by === split.user_id) continue
        netMap[exp.paid_by] = (netMap[exp.paid_by] ?? 0) + split.amount
        netMap[split.user_id] = (netMap[split.user_id] ?? 0) - split.amount
      }
    }

    const suggestions = simplifyDebts(netMap)
    for (const s of suggestions) {
      // Get profiles
      const { data: fromP } = await supabase.from('profiles').select('*').eq('id', s.from).single()
      const { data: toP } = await supabase.from('profiles').select('*').eq('id', s.to).single()
      allDebts.push({ from: s.from, to: s.to, amount: s.amount, groupId: group.id, groupName: group.name, fromProfile: fromP, toProfile: toP })
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settle up</h1>
        <p className="text-sm text-gray-500">Suggested settlements to clear all debts with minimum transactions</p>
      </div>

      {allDebts.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="font-medium text-gray-700 mb-1">All settled up!</h2>
          <p className="text-sm text-gray-500">No outstanding debts across your groups</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allDebts.map((debt, i) => (
            <div key={i} className="card p-4 flex items-center gap-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${avatarColor(debt.from)}`}>
                {getInitials(debt.fromProfile?.full_name || debt.from.slice(0, 2))}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{debt.fromProfile?.full_name || 'Unknown'}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{debt.toProfile?.full_name || 'Unknown'}</span>
                </div>
                <p className="text-xs text-gray-400">{debt.groupName}</p>
              </div>
              <div className="text-right mr-3">
                <div className="font-semibold text-gray-900">{formatCurrency(debt.amount)}</div>
              </div>
              {debt.from === user.id && (
                <SettleButton groupId={debt.groupId} fromUserId={debt.from} toUserId={debt.to} amount={debt.amount} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
