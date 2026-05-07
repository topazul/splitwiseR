import Link from 'next/link'
import { GROUP_TYPE_META } from '@/lib/utils'

interface Props {
  group: any
  currentUserId: string
}

export default function GroupCard({ group, currentUserId }: Props) {
  const meta = GROUP_TYPE_META[group.type] ?? GROUP_TYPE_META.other
  return (
    <Link href={`/groups/${group.id}`}>
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
        <span className="text-lg">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{group.name}</p>
          <p className="text-xs text-gray-400">{meta.label}</p>
        </div>
        {group.myRole === 'admin' && (
          <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">admin</span>
        )}
      </div>
    </Link>
  )
}
