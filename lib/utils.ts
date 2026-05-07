export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateString))
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-blue-100 text-blue-700',
  'bg-pink-100 text-pink-700',
  'bg-green-100 text-green-700',
]

export function avatarColor(userId: string) {
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  food:          { label: 'Food & drink',   icon: '🍽️', color: 'bg-amber-50 text-amber-700' },
  transport:     { label: 'Transport',       icon: '🚗', color: 'bg-blue-50 text-blue-700' },
  home:          { label: 'Home',            icon: '🏠', color: 'bg-brand-50 text-brand-600' },
  entertainment: { label: 'Entertainment',   icon: '🎬', color: 'bg-pink-50 text-pink-700' },
  community:     { label: 'Community',       icon: '🏘️', color: 'bg-purple-50 text-purple-700' },
  other:         { label: 'Other',           icon: '📦', color: 'bg-gray-100 text-gray-600' },
}

export const GROUP_TYPE_META: Record<string, { label: string; icon: string }> = {
  trip:      { label: 'Trip',      icon: '✈️' },
  home:      { label: 'Home',      icon: '🏠' },
  community: { label: 'Community', icon: '🏘️' },
  other:     { label: 'Other',     icon: '👥' },
}
