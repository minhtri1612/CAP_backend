import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Label, Title } from '@ui5/webcomponents-react'
import { useState } from 'react'
import { createContact, fetchContacts } from '../api/procurement'
import { useAuth } from '../auth/AuthContext'

const GLOBAL_PARTS = '11111111-1111-1111-1111-111111111111'

export default function ContactsPage() {
  const { is, user } = useAuth()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['contacts'], queryFn: fetchContacts })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const createM = useMutation({
    mutationFn: () =>
      createContact({
        vendor_ID: GLOBAL_PARTS,
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

  return (
    <div>
      <Title level="H2">Contacts</Title>
      <p className="muted">
        Vendor Admin creates contacts for own company (RBAC Day 5). User: {user}
      </p>

      {canCreate && (
        <div className="panel" style={{ display: 'grid', gap: '0.5rem', maxWidth: 420 }}>
          <Label>Name</Label>
          <Input value={name} onInput={(e) => setName(e.target.value)} />
          <Label>Email</Label>
          <Input value={email} onInput={(e) => setEmail(e.target.value)} />
          <Button
            design="Emphasized"
            disabled={!name || createM.isPending}
            onClick={() => createM.mutate()}
          >
            Create Contact
          </Button>
          {createM.isError && <p className="muted">Create failed (403 if VendorUser).</p>}
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
