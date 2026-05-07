import type { Expense, DebtSuggestion } from '@/types'

export interface UserBalance {
  userId: string
  net: number
}

/**
 * Given a list of expenses (with splits), compute net balances for all users.
 * Positive = owed money, Negative = owes money.
 */
export function computeBalances(
  expenses: Expense[],
  currentUserId: string
): { totalOwed: number; totalOwes: number; net: number } {
  let totalOwed = 0
  let totalOwes = 0

  for (const expense of expenses) {
    if (!expense.splits) continue
    const isPayer = expense.paid_by === currentUserId

    if (isPayer) {
      // Others owe the current user
      for (const split of expense.splits) {
        if (split.user_id !== currentUserId && !split.settled) {
          totalOwed += split.amount
        }
      }
    } else {
      // Current user owes the payer
      const mySplit = expense.splits.find(s => s.user_id === currentUserId)
      if (mySplit && !mySplit.settled) {
        totalOwes += mySplit.amount
      }
    }
  }

  return { totalOwed, totalOwes, net: totalOwed - totalOwes }
}

/**
 * Simplify debts into minimal transactions using a greedy algorithm.
 */
export function simplifyDebts(
  netBalances: Record<string, number>
): Array<{ from: string; to: string; amount: number }> {
  const creditors: Array<{ id: string; amount: number }> = []
  const debtors: Array<{ id: string; amount: number }> = []

  for (const [userId, balance] of Object.entries(netBalances)) {
    if (balance > 0.01) creditors.push({ id: userId, amount: balance })
    else if (balance < -0.01) debtors.push({ id: userId, amount: -balance })
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const transactions: Array<{ from: string; to: string; amount: number }> = []

  let ci = 0, di = 0
  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci]
    const debt = debtors[di]
    const amount = Math.min(credit.amount, debt.amount)

    transactions.push({ from: debt.id, to: credit.id, amount: parseFloat(amount.toFixed(2)) })

    credit.amount -= amount
    debt.amount -= amount

    if (credit.amount < 0.01) ci++
    if (debt.amount < 0.01) di++
  }

  return transactions
}
