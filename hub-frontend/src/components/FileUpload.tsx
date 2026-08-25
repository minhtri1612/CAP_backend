import { useState } from 'react'
import { Button, Label, MessageStrip } from '@ui5/webcomponents-react'

type Props = {
  shipmentId?: string
  isActive?: boolean
  disabled?: boolean
  onUploaded?: (fileName: string) => void
  uploadFn?: (file: File) => Promise<void>
}

/** Invoice PDF upload — wires PUT /invoiceScan when uploadFn provided. */
export function FileUpload({ shipmentId, disabled, onUploaded, uploadFn }: Props) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function handleFile(file: File | undefined) {
    setError(null)
    setOk(false)
    setName(file?.name ?? '')
    if (!file || !uploadFn) return
    setBusy(true)
    try {
      await uploadFn(file)
      setOk(true)
      onUploaded?.(file.name)
    } catch {
      setError('Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Label>Invoice PDF</Label>
        <input
          type="file"
          accept="application/pdf"
          disabled={disabled || busy || !uploadFn}
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <span className="muted">{name || 'No file selected'}</span>
        {shipmentId && <span className="muted">→ {shipmentId.slice(0, 8)}…</span>}
        {busy && <Button disabled>Uploading…</Button>}
      </div>
      {ok && <MessageStrip design="Positive">Uploaded. OCR pre-fill applied on CAP.</MessageStrip>}
      {error && <MessageStrip design="Negative">{error}</MessageStrip>}
      {!uploadFn && <span className="muted">Select a draft shipment to enable upload.</span>}
    </div>
  )
}
