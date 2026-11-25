import {
  Camera,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  Salad,
  Scale,
  Sparkles,
  Store,
  UserCog,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  /** Nombre corto para la barra superior; si falta, se usa `label`. */
  short?: string
  href: string
  icon: LucideIcon
  description: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

/**
 * Las secciones de la app en el orden en que se usan la primera vez:
 * primero se arma la semana (menú → compras → precios), luego se cuida la salud.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Tu semana',
    items: [
      { label: 'Inicio', href: '/dashboard', icon: LayoutDashboard, description: 'Resumen de tu semana' },
      { label: 'Menú semanal', short: 'Menú', href: '/meal-plan', icon: Salad, description: 'Planifica tus comidas' },
      { label: 'Lista de compras', short: 'Compras', href: '/shopping-list', icon: ListChecks, description: 'Qué comprar esta semana' },
      { label: 'Precios', href: '/prices', icon: Store, description: 'Dónde comprar más barato' },
    ],
  },
  {
    label: 'Tu salud',
    items: [
      { label: 'Nutrición', href: '/nutrition', icon: Sparkles, description: 'Cómo se alimenta tu hogar' },
      { label: 'Mi peso y calorías', href: '/weight', icon: Scale, description: 'Cuánto necesitas comer' },
      { label: 'Foto del plato', href: '/plate', icon: Camera, description: 'Calorías con una foto' },
      { label: 'Chat nutricional', href: '/chat', icon: MessageCircle, description: 'Pregunta sobre tu alimentación' },
    ],
  },
]

export const householdItem: NavItem = {
  label: 'Mi hogar',
  href: '/household',
  icon: UserCog,
  description: 'Presupuesto y preferencias',
}

export const navItems: NavItem[] = [...navGroups.flatMap((group) => group.items), householdItem]

/** true si la ruta actual pertenece a esa sección (incluye sus subpáginas, p. ej. /meal-plan/123). */
export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
