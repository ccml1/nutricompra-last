'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginValues } from '@/lib/validations'
import { useAuth } from '@/store/use-auth'

export function LoginForm() {
  const router = useRouter()
  const login = useAuth((s) => s.login)
  const onboardingComplete = useAuth((s) => s.onboardingComplete)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'piero.quispe@nutricompra.pe', password: 'demo123' },
  })

  const onSubmit = (values: LoginValues) => {
    login(values.email)
    toast.success('Bienvenido de vuelta')
    router.push(onboardingComplete ? '/dashboard' : '/onboarding')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        Iniciar sesión
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <a href="/register" className="font-medium text-primary hover:underline">
          Regístrate
        </a>
      </p>
      <p className="rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        Demo: usa las credenciales precargadas o cualquier correo válido.
      </p>
    </form>
  )
}
