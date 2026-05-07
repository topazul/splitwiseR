import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-400 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">S</span>
          </div>
          <span className="font-semibold text-gray-900">SplitwiseR</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn">Sign in</Link>
          <Link href="/auth/register" className="btn-primary">Get started</Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="badge bg-brand-50 text-brand-600 mb-6">
          ✨ AI-powered expense parsing
        </div>
        <h1 className="text-5xl font-semibold text-gray-900 mb-4 leading-tight max-w-2xl">
          Split expenses.<br />
          <span className="text-brand-400">Without the drama.</span>
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-md">
          Track shared bills, split costs fairly, manage community fees — and let AI do the heavy lifting.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/auth/register" className="btn-primary text-base px-6 py-3">
            Start for free →
          </Link>
          <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-700">
            Already have an account?
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl w-full text-left">
          {[
            { icon: '🤖', title: 'AI expense parsing', desc: 'Describe expenses in plain English and let AI structure them instantly.' },
            { icon: '🏘️', title: 'Community fees', desc: 'Manage HOA fees, neighborhood watch, garden committees and more.' },
            { icon: '⚡', title: 'Smart settlements', desc: 'Minimize transactions with intelligent debt simplification.' },
          ].map(f => (
            <div key={f.title} className="card p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-medium text-gray-900 mb-1">{f.title}</div>
              <div className="text-sm text-gray-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
