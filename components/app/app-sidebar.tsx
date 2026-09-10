import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { NavLinks } from './nav-links'
import { SidebarBudget } from './sidebar-budget'

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar lg:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link href="/dashboard">
          <Logo tone="light" />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <NavLinks />
      </div>
      <div className="border-t border-sidebar-border p-4">
        <SidebarBudget />
      </div>
    </aside>
  )
}
