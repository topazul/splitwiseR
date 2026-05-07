import { formatCurrency, formatDate, CATEGORY_META } from '@/lib/utils'
import type { Expense } from '@/types'

interface Props {
  expense: any
  currentUserId: string
}

export default function ExpenseRow({ expense, currentUserId }: Props) {
  const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.other
  const isPayer = expense.paid_by === currentUserId
  const mySplit = expense.splits?.find((s: any) => s.user_id === currentUserId)
  const myShare = mySplit?.amount ?? 0
  const isSettled = mySplit?.settled ?? false

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${meta.color}`}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{expense.title}</p>
        <p className="text-xs text-gray-400">
          {expense.payer?.full_name ?? 'Unknown'} · {formatDate(expense.date)}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</p>
        {isSettled ? (
          <p className="text-xs text-gray-400">settled</p>
        ) : isPayer ? (
          <p className="text-xs text-brand-600">you lent {formatCurrency(expense.amount - myShare)}</p>
        ) : (
          <p className="text-xs text-red-500">you owe {formatCurrency(myShare)}</p>
        )}
      </div>
    </div>
  )
}
