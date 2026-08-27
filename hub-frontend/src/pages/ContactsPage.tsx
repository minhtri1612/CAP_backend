import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Label, Option, Select, Title } from '@ui5/webcomponents-react'
import { useEffect, useState } from 'react'
import { createContact, fetchContacts, fetchVendors } from '../api/procurement'
import { useAuth } from '../auth/AuthContext'
import { USERS } from '../auth/users'

export default function ContactsPage() {
  const { is, user } = useAuth()
  const qc = useQueryClient()
  const ownVendorId = USERS[user].vendorId
  const q = useQuery({ queryKey: ['contacts'], queryFn: fetchContacts })
  const vendorsQ = useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    enabled: is('ProcurementManager'),
  })
  const [vendorId, setVendorId] = useState(ownVendorId ?? '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (ownVendorId) setVendorId(ownVendorId)
  }, [ownVendorId])

  const createM = useMutation({
    mutationFn: () =>
      createContact({
        vendor_ID: vendorId,
        name,
        email,
        phone: '',
        role: 'Contact',
      }),
    onSuccess: () => {
      setName('')
      setEmail('')
      qc.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const canCreate = is('VendorAdmin') || is('ProcurementManager')
  const needsVendorPick = is('ProcurementManager') && !ownVendorId

  return (
    <div>
      <Title level="H2">Contacts</Title>
      <p className="muted">
        Vendor Admin creates contacts for own company (RBAC Day 5). User: {user}
      </p>

      {canCreate && (
        <div className="panel" style={{ display: 'grid', gap: '0.5rem', maxWidth: 420 }}>
          {needsVendorPick && (
            <>
              <Label>Vendor</Label>
              <Select
                onChange={(e) => {
                  const opt = e.detail.selectedOption as HTMLElement | undefined
                  setVendorId(opt?.dataset.id ?? '')
                }}
              >
                <Option data-id="">Select vendor…</Option>
                {(vendorsQ.data ?? []).map((v) => (
                  <Option key={v.ID} data-id={v.ID} selected={v.ID === vendorId}>
                    {v.name ?? v.ID}
                  </Option>
                ))}
              </Select>
            </>
          )}
          <Label>Name</Label>
          <Input value={name} onInput={(e) => setName(e.target.value)} />
          <Label>Email</Label>
          <Input value={email} onInput={(e) => setEmail(e.target.value)} />
          <Button
            design="Emphasized"
            disabled={!name || !vendorId || createM.isPending}
            onClick={() => createM.mutate()}
          >
            Create Contact
          </Button>
          {createM.isError && <p className="muted">Create failed (403 if wrong vendor / role).</p>}
        </div>
      )}

      <div className="panel">
        {q.isError && <p className="muted">Cannot list contacts for this role.</p>}
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((c) => (
              <tr key={c.ID}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
