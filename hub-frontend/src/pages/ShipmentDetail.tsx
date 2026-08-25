import { Button, Title } from '@ui5/webcomponents-react'
import { useNavigate, useParams } from 'react-router-dom'

export default function ShipmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div className="panel">
      <Title level="H2">Shipment Detail</Title>
      <p className="muted">
        Placeholder for Day 8 multi-tab draft form (General / Items / Invoice).
      </p>
      <p>
        Shipment ID: <code>{id}</code>
      </p>
      <Button onClick={() => navigate('/shipments')}>Back to list</Button>
    </div>
  )
}
