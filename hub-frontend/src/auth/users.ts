export type MockUser = 'alice' | 'bob' | 'carol' | 'dave' | 'erin'

export const USERS: Record<
  MockUser,
  { password: string; label: string; roles: string[]; vendorId?: string }
> = {
  alice: {
    password: 'alice',
    label: 'Alice (VendorUser / Global Parts)',
    roles: ['VendorUser'],
    vendorId: '11111111-1111-1111-1111-111111111111',
  },
  bob: { password: 'bob', label: 'Bob (ProcurementManager)', roles: ['ProcurementManager'] },
  carol: {
    password: 'carol',
    label: 'Carol (VendorAdmin / Global Parts)',
    roles: ['VendorAdmin'],
    vendorId: '11111111-1111-1111-1111-111111111111',
  },
  dave: { password: 'dave', label: 'Dave (Auditor)', roles: ['Auditor'] },
  erin: {
    password: 'erin',
    label: 'Erin (VendorUser / Acme)',
    roles: ['VendorUser'],
    vendorId: '22222222-2222-2222-2222-222222222222',
  },
}

const STORAGE_KEY = 'hub.auth.user'

export function getStoredUser(): MockUser {
  const raw = localStorage.getItem(STORAGE_KEY) as MockUser | null
  return raw && raw in USERS ? raw : 'bob'
}

export function setStoredUser(user: MockUser) {
  localStorage.setItem(STORAGE_KEY, user)
}
