import type { User } from '@/types'

export const mockUser: User = {
  id: 'user-1',
  name: 'Piero Quispe',
  firstName: 'Piero',
  email: 'piero.quispe@nutricompra.pe',
  location: 'Lima, Perú',
  avatarInitials: 'PQ',
}

export const mockUsers: User[] = [mockUser]
