export type MockUser = 'alice' | 'bob' | 'carol' | 'dave'

export const USERS: Record<
  MockUser,
  { password: string; label: string; roles: string[] }
> = {
  alice: { password: 'alice', label: 'Alice (VendorUser)', roles: ['VendorUser'] },
  bob: { password: 'bob', label: 'Bob (ProcurementManager)', roles: ['ProcurementManager'] },
  carol: { password: 'carol', label: 'Carol (VendorAdmin)', roles: ['VendorAdmin'] },
  dave: { password: 'dave', label: 'Dave (Auditor)', roles: ['Auditor'] },
}

const STORAGE_KEY = 'hub.auth.user'

export function getStoredUser(): MockUser {
  const raw = localStorage.getItem(STORAGE_KEY) as MockUser | null
  return raw && raw in USERS ? raw : 'bob'
}

export function setStoredUser(user: MockUser) {
  localStorage.setItem(STORAGE_KEY, user)
}
