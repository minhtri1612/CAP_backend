import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getStoredUser,
  setStoredUser,
  USERS,
  type MockUser,
} from './users'

type AuthContextValue = {
  user: MockUser
  roles: string[]
  setUser: (user: MockUser) => void
  is: (role: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<MockUser>(getStoredUser)
  const queryClient = useQueryClient()

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      roles: USERS[user].roles,
      setUser: (next) => {
        setStoredUser(next)
        setUserState(next)
        queryClient.clear()
      },
      is: (role) => USERS[user].roles.includes(role),
    }),
    [user, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth requires AuthProvider')
  return ctx
}
