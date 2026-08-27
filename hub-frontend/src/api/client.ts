import axios from 'axios'
import { getStoredUser, USERS, type MockUser } from '../auth/users'

/** Relative /odata so Vite proxy (dev) and AppRouter (BTP) both work. */
export const api = axios.create({
  baseURL: '/odata/v4',
  headers: { Accept: 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  // Local mock Basic Auth only — on BTP, AppRouter forwards XSUAA JWT.
  if (import.meta.env.DEV) {
    const user = getStoredUser()
    const password = USERS[user].password
    config.headers.Authorization = `Basic ${btoa(`${user}:${password}`)}`
  }
  return config
})

export function currentUser(): MockUser {
  return getStoredUser()
}
