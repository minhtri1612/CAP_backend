import axios from 'axios'
import { getStoredUser, USERS, type MockUser } from '../auth/users'

export const api = axios.create({
  baseURL: '/odata/v4',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const user = getStoredUser()
  const password = USERS[user].password
  const token = btoa(`${user}:${password}`)
  config.headers.Authorization = `Basic ${token}`
  return config
})

export function currentUser(): MockUser {
  return getStoredUser()
}
