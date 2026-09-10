import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <AuthShell title="Inicia sesión" subtitle="Accede a tu plan y lista de compras">
      <LoginForm />
    </AuthShell>
  )
}
