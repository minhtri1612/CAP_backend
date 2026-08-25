import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, MessageStrip, Title } from '@ui5/webcomponents-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { criticalDelay, fetchPurchaseOrder, fetchShipment } from '../api/procurement'
import { useAuth } from '../auth/AuthContext'
import { FileUpload } from '../components/FileUpload'

export default function ShipmentDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const poFromQuery = params.get('po')
  const navigate = useNavigate()
  const { is } = useAuth()
  const qc = useQueryClient()

  const isNew = id === 'new'
  const shipmentQ = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => fetchShipment(id!),
    enabled: !!id && !isNew,
  })

  const shipment = shipmentQ.data
  const poNumber = shipment?.purchaseOrder || poFromQuery || undefined

  const poQ = useQuery({
    queryKey: ['po', poNumber],
    queryFn: () => fetchPurchaseOrder(poNumber!),
    enabled: !!poNumber,
  })

  const approveM = useMutation({
    mutationFn: () => criticalDelay(id!),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['shipment', id] })
      await qc.invalidateQueries({ queryKey: ['shipments'] })
      await qc.invalidateQueries({ queryKey: ['at-risk'] })
      if (poNumber) await qc.invalidateQueries({ queryKey: ['po', poNumber] })
    },
  })

  const canApprove = is('ProcurementManager') || is('VendorUser')

  return (
    <div>
      <Title level="H2">{isNew ? 'New Shipment' : 'Shipment Detail'}</Title>
      <p className="muted">
        Day 7 preview. Full multi-tab draft form (General / Items / Invoice) arrives Day 8.
      </p>

      <div className="panel" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button onClick={() => navigate('/shipments')}>Back to list</Button>
        {canApprove && !isNew && (
          <Button
            design="Negative"
            disabled={approveM.isPending || shipment?.status === 'Exception'}
            onClick={() => approveM.mutate()}
          >
            Approve Exception (criticalDelay)
          </Button>
        )}
      </div>

      {approveM.isSuccess && (
        <MessageStrip design="Positive" className="panel">
          Status → Exception. Mock Event Mesh + Alert Notification logged on CAP.
          {approveM.data.StatisticalDeliveryDate
            ? ` S/4 StatisticalDeliveryDate → ${approveM.data.StatisticalDeliveryDate}`
            : ''}
        </MessageStrip>
      )}
      {approveM.isError && (
        <MessageStrip design="Negative" className="panel">
          criticalDelay failed (403 if role cannot call action).
        </MessageStrip>
      )}

      {isNew ? (
        <div className="panel">
          <Title level="H5">Create from Purchase Order</Title>
          <p>
            Selected PO: <code>{poFromQuery || '— (none)'}</code>
          </p>
          <p className="muted">
            Day 8 will POST a draft Shipment with this PO, then open the draft form.
          </p>
          {poQ.data && (
            <table className="data">
              <tbody>
                <tr>
                  <th>PO Status</th>
                  <td>{poQ.data.POStatus}</td>
                </tr>
                <tr>
                  <th>Supplier</th>
                  <td>{poQ.data.SupplierID}</td>
                </tr>
                <tr>
                  <th>Stat. Delivery</th>
                  <td>{poQ.data.StatisticalDeliveryDate}</td>
                </tr>
              </tbody>
            </table>
          )}
          <div style={{ marginTop: '1rem' }}>
            <FileUpload />
          </div>
        </div>
      ) : (
        <div className="grid-2">
          <div className="panel">
            <Title level="H5">Shipment</Title>
            {shipmentQ.isLoading && <p className="muted">Loading…</p>}
            {shipmentQ.isError && <p className="muted">Not found or access denied.</p>}
            {shipment && (
              <table className="data">
                <tbody>
                  <tr>
                    <th>ID</th>
                    <td>
                      <code>{shipment.ID}</code>
                    </td>
                  </tr>
                  <tr>
                    <th>PO</th>
                    <td>{shipment.purchaseOrder}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>{shipment.status}</td>
                  </tr>
                  <tr>
                    <th>S/4 PO Status</th>
                    <td>{shipment.POStatus || '—'}</td>
                  </tr>
                  <tr>
                    <th>Delivery</th>
                    <td>{shipment.deliveryDate}</td>
                  </tr>
                  <tr>
                    <th>Tracking</th>
                    <td>{shipment.trackingNumber || '—'}</td>
                  </tr>
                  <tr>
                    <th>Batch</th>
                    <td>{shipment.batchId || '—'}</td>
                  </tr>
                  <tr>
                    <th>Weight</th>
                    <td>{shipment.totalWeight ?? '—'}</td>
                  </tr>
                  <tr>
                    <th>Invoice status</th>
                    <td>{shipment.invoiceStatus || '—'}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="panel">
            <Title level="H5">Linked S/4 PO</Title>
            {!poNumber && <p className="muted">No purchase order on this shipment.</p>}
            {poQ.isError && <p className="muted">Could not load mock PO.</p>}
            {poQ.data && (
              <table className="data">
                <tbody>
                  <tr>
                    <th>PO</th>
                    <td>{poQ.data.PurchaseOrder}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>{poQ.data.POStatus}</td>
                  </tr>
                  <tr>
                    <th>Supplier</th>
                    <td>{poQ.data.SupplierID}</td>
                  </tr>
                  <tr>
                    <th>Stat. Delivery</th>
                    <td>{poQ.data.StatisticalDeliveryDate}</td>
                  </tr>
                </tbody>
              </table>
            )}
            <div style={{ marginTop: '1rem' }}>
              <FileUpload />
              <p className="muted">Upload wires to PUT /invoiceScan on Day 8.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
