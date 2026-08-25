import { useState } from 'react'
import { Label } from '@ui5/webcomponents-react'

/** Skeleton — wire PUT /invoiceScan on Day 8. */
export function FileUpload() {
  const [name, setName] = useState<string>('')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Label>Invoice PDF</Label>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setName(e.target.files?.[0]?.name ?? '')}
      />
      <span className="muted">{name || 'No file selected'}</span>
    </div>
  )
}
