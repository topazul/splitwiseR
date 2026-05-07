export type GroupType = 'trip' | 'home' | 'other' | 'community'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  type: GroupType
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  members?: GroupMember[]
  balance?: number
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  profile?: Profile
}

export interface Expense {
  id: string
  group_id: string
  paid_by: string
  title: string
  amount: number
  category: ExpenseCategory
  notes?: string
  date: string
  created_at: string
  splits?: ExpenseSplit[]
  payer?: Profile
  group?: Group
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'home'
  | 'entertainment'
  | 'community'
  | 'other'

export interface ExpenseSplit {
  id: string
  expense_id: string
  user_id: string
  amount: number
  settled: boolean
  settled_at?: string
  profile?: Profile
}

export interface CommunityFee {
  id: string
  group_id: string
  name: string
  amount: number
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one_time'
  description?: string
  active: boolean
  created_by: string
  created_at: string
}

export interface Settlement {
  id: string
  group_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  settled_at: string
  from_profile?: Profile
  to_profile?: Profile
}

export interface BalanceSummary {
  user_id: string
  profile?: Profile
  total_owed: number
  total_owes: number
  net: number
}

export interface DebtSuggestion {
  from_user_id: string
  to_user_id: string
  amount: number
  from_profile?: Profile
  to_profile?: Profile
}
