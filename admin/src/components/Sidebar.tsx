'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { Users, BookOpen, Trophy, LogOut } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/dashboard/users', label: 'Employees', icon: Users },
  { href: '/dashboard/courses', label: 'Courses', icon: BookOpen },
  { href: '/dashboard/achievements', label: 'Achievements', icon: Trophy },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const logout = () => {
    Cookies.remove('access_token')
    router.push('/login')
  }

  return (
    <aside className="w-56 min-h-screen bg-brand text-white flex flex-col">
      <div className="p-6 text-xl font-bold border-b border-white/20">
        Kavabanga
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
              pathname.startsWith(href)
                ? 'bg-white/20 font-semibold'
                : 'hover:bg-white/10'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <button
        onClick={logout}
        className="flex items-center gap-3 px-8 py-4 hover:bg-white/10 transition-colors"
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  )
}
