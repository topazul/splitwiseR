import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'SplitwiseR — Split expenses, effortlessly',
  description: 'Track shared expenses, split bills, and manage community fees with AI-powered parsing.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-right" toastOptions={{
          style: { borderRadius: '10px', background: '#1a1a1a', color: '#fff' }
        }} />
      </body>
    </html>
  )
}
