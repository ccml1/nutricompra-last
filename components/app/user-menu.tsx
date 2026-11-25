'use client'

import { LogOut, UserCog } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/store/use-auth'

export function UserMenu() {
  const router = useRouter()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Tu cuenta"
        className="flex cursor-pointer items-center gap-2 rounded-full p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {user?.avatarInitials ?? 'NC'}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* En Base UI la etiqueta de un menú tiene que ir dentro de un grupo; suelta, el menú se cae. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block text-sm font-medium text-foreground">{user?.name}</span>
            <span className="block text-xs font-normal text-muted-foreground">{user?.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/household" />} className="gap-2 px-2 py-2">
          <UserCog className="size-4" aria-hidden />
          Mi hogar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive" className="gap-2 px-2 py-2">
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
