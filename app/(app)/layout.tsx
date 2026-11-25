import { AppHeader } from '@/components/app/app-header'
import { AuthGuard } from '@/components/app/auth-guard'
import { VisitTracker } from '@/components/app/visit-tracker'

/** Layout de las páginas con sesión: la barra superior y la verificación de sesión se montan una sola vez. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-dvh bg-muted/30">
        <AppHeader />
        <VisitTracker />
        {children}
      </div>
    </AuthGuard>
  )
}
