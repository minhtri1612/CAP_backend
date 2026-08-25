import {
  FlexBox,
  Option,
  Select,
  ShellBar,
  SideNavigation,
  SideNavigationItem,
  Title,
} from '@ui5/webcomponents-react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { USERS, type MockUser } from '../auth/users'
import './AppShell.css'

export function AppShell({ children }: { children: ReactNode }) {
  const { user, setUser, is } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="shell">
      <ShellBar primaryTitle="Procurement Hub" secondaryTitle="POC 2 Vendor Portal" />

      <FlexBox className="shell-body">
        <SideNavigation
          className="shell-nav"
          onSelectionChange={(e) => {
            const path = (e.detail.item as HTMLElement).dataset.path
            if (path) navigate(path)
          }}
        >
          <SideNavigationItem
            text="Dashboard"
            data-path="/dashboard"
            selected={location.pathname === '/dashboard'}
          />
          <SideNavigationItem
            text="Shipments"
            data-path="/shipments"
            selected={location.pathname.startsWith('/shipments')}
          />
          <SideNavigationItem
            text="Price Ledger"
            data-path="/price-ledger"
            selected={location.pathname === '/price-ledger'}
          />
          {(is('VendorAdmin') || is('ProcurementManager')) && (
            <SideNavigationItem
              text="Contacts"
              data-path="/contacts"
              selected={location.pathname === '/contacts'}
            />
          )}
        </SideNavigation>

        <main className="shell-content">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
            <Title level="H4" className="shell-hint" style={{ margin: 0 }}>
              Mock Basic Auth (≠ XSUAA)
            </Title>
            <Select
              accessibleName="Mock user"
              onChange={(e) => {
                const opt = e.detail.selectedOption as HTMLElement | undefined
                const next = opt?.dataset?.user as MockUser | undefined
                if (next) setUser(next)
              }}
            >
              {(Object.keys(USERS) as MockUser[]).map((u) => (
                <Option key={u} data-user={u} selected={u === user}>
                  {USERS[u].label}
                </Option>
              ))}
            </Select>
          </div>
          {children}
        </main>
      </FlexBox>
    </div>
  )
}
