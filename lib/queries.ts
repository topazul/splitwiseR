import { createClient } from './supabase/client'
import type { Group, Expense, CommunityFee, ExpenseSplit } from '@/types'

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function getUserGroups(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      role,
      groups (
        id, name, type, description, created_by, created_at,
        group_members ( user_id, role, profiles ( id, full_name, email, avatar_url ) )
      )
    `)
    .eq('user_id', userId)

  if (error) throw error
  return data?.map(d => ({ ...(d.groups as any), myRole: d.role })) ?? []
}

export async function getGroup(groupId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members ( id, user_id, role, joined_at, profiles ( id, full_name, email, avatar_url ) )
    `)
    .eq('id', groupId)
    .single()

  if (error) throw error
  return data
}

export async function createGroup(params: {
  name: string
  type: string
  description?: string
  userId: string
  memberEmails?: string[]
}) {
  const supabase = createClient()

  const { data: group, error: gErr } = await supabase
    .from('groups')
    .insert({ name: params.name, type: params.type, description: params.description, created_by: params.userId })
    .select()
    .single()

  if (gErr) throw gErr

  await supabase.from('group_members').insert({ group_id: group.id, user_id: params.userId, role: 'admin' })

  return group
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getGroupExpenses(groupId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      payer:profiles!expenses_paid_by_fkey ( id, full_name, email, avatar_url ),
      splits:expense_splits ( id, user_id, amount, settled, settled_at, profiles ( id, full_name, email, avatar_url ) )
    `)
    .eq('group_id', groupId)
    .order('date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getAllUserExpenses(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      payer:profiles!expenses_paid_by_fkey ( id, full_name, email, avatar_url ),
      group:groups ( id, name, type ),
      splits:expense_splits ( id, user_id, amount, settled, profiles ( id, full_name, email, avatar_url ) )
    `)
    .or(`paid_by.eq.${userId},expense_splits.user_id.eq.${userId}`)
    .order('date', { ascending: false })
    .limit(50)

  if (error) throw error
  return data ?? []
}

export async function createExpense(params: {
  groupId: string
  paidBy: string
  title: string
  amount: number
  category: string
  notes?: string
  date: string
  splits: Array<{ userId: string; amount: number }>
}) {
  const supabase = createClient()

  const { data: expense, error: eErr } = await supabase
    .from('expenses')
    .insert({
      group_id: params.groupId,
      paid_by: params.paidBy,
      title: params.title,
      amount: params.amount,
      category: params.category,
      notes: params.notes,
      date: params.date,
    })
    .select()
    .single()

  if (eErr) throw eErr

  const splitRows = params.splits.map(s => ({
    expense_id: expense.id,
    user_id: s.userId,
    amount: s.amount,
    settled: s.userId === params.paidBy,
  }))

  const { error: sErr } = await supabase.from('expense_splits').insert(splitRows)
  if (sErr) throw sErr

  return expense
}

export async function settleExpenseSplit(splitId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('expense_splits')
    .update({ settled: true, settled_at: new Date().toISOString() })
    .eq('id', splitId)
  if (error) throw error
}

// ─── Community Fees ───────────────────────────────────────────────────────────

export async function getCommunityFees(groupId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('community_fees')
    .select('*')
    .eq('group_id', groupId)
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createCommunityFee(params: {
  groupId: string
  name: string
  amount: number
  frequency: string
  description?: string
  createdBy: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('community_fees')
    .insert({
      group_id: params.groupId,
      name: params.name,
      amount: params.amount,
      frequency: params.frequency,
      description: params.description,
      created_by: params.createdBy,
      active: true,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCommunityFee(feeId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('community_fees')
    .update({ active: false })
    .eq('id', feeId)
  if (error) throw error
}

// ─── Settlements ──────────────────────────────────────────────────────────────

export async function recordSettlement(params: {
  groupId: string
  fromUserId: string
  toUserId: string
  amount: number
}) {
  const supabase = createClient()
  const { error } = await supabase.from('settlements').insert({
    group_id: params.groupId,
    from_user_id: params.fromUserId,
    to_user_id: params.toUserId,
    amount: params.amount,
    settled_at: new Date().toISOString(),
  })
  if (error) throw error
}
