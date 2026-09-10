import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Empieza a planificar la alimentación de tu hogar"
    >
      <RegisterForm />
    </AuthShell>
  )
}
