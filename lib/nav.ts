import {
  LayoutDashboard,
  ListChecks,
  Salad,
  Sparkles,
  Store,
  UserCog,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  description: string
}

export const navItems: NavItem[] = [
  {
    label: 'Inicio',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Resumen de tu semana',
  },
  {
    label: 'Menú semanal',
    href: '/menu',
    icon: Salad,
    description: 'Planifica tus comidas',
  },
  {
    label: 'Lista de compras',
    href: '/lista',
    icon: ListChecks,
    description: 'Qué comprar esta semana',
  },
  {
    label: 'Precios',
    href: '/precios',
    icon: Store,
    description: 'Compara establecimientos',
  },
  {
    label: 'Recomendaciones',
    href: '/recomendaciones',
    icon: Sparkles,
    description: 'Ahorro y nutrición',
  },
  {
    label: 'Mi hogar',
    href: '/perfil',
    icon: UserCog,
    description: 'Presupuesto y preferencias',
  },
]
