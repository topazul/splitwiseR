import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-brand-400 flex items-center justify-center">
          <span className="text-white font-semibold text-sm">S</span>
        </div>
        <span className="font-semibold text-gray-900">SplitwiseR</span>
      </Link>
      {children}
    </div>
  )
}
