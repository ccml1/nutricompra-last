import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Correo no válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Ingresa tu nombre'),
    email: z.string().min(1, 'Ingresa tu correo').email('Correo no válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type RegisterValues = z.infer<typeof registerSchema>

export const onboardingSchema = z.object({
  members: z.coerce.number().int().min(1, 'Mínimo 1 persona').max(15, 'Máximo 15 personas'),
  children: z.coerce.number().int().min(0).max(15),
  weeklyBudget: z.coerce.number().min(20, 'Mínimo S/ 20').max(2000, 'Monto demasiado alto'),
  preferences: z.array(z.string()).min(1, 'Elige al menos una preferencia'),
  restrictions: z.array(z.string()),
})

export type OnboardingValues = z.infer<typeof onboardingSchema>
