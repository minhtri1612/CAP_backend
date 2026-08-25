import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Input,
  Label,
  MessageStrip,
  Option,
  Select,
  Tab,
  TabContainer,
  Title,
} from '@ui5/webcomponents-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  SUPPLIER_TO_VENDOR,
  addShipmentItem,
  createDraftShipment,
  criticalDelay,
  deleteShipmentItem,
  draftActivate,
  draftEdit,
  fetchProducts,
  fetchPurchaseOrder,
  fetchShipment,
  patchShipment,
  uploadInvoiceScan,
  type Shipment,
  type ShipmentItem,
} from '../api/procurement'
import { useAuth } from '../auth/AuthContext'
import { FileUpload } from '../components/FileUpload'

type FormState = {
  purchaseOrder: string
  deliveryDate: string
  status: string
  totalWeight: string
  trackingNumber: string
  batchId: string
  vendor_ID: string
}

function toForm(s?: Shipment | null): FormState {
  return {
    purchaseOrder: s?.purchaseOrder ?? '',
    deliveryDate: s?.deliveryDate ? s.deliveryDate.slice(0, 16) : '',
    status: s?.status ?? 'Pending',
    totalWeight: s?.totalWeight != null ? String(s.totalWeight) : '',
    trackingNumber: s?.trackingNumber ?? '',
    batchId: s?.batchId ?? '',
    vendor_ID: s?.vendor_ID ?? '',
  }
}

function toIsoLocal(datetimeLocal: string) {
  if (!datetimeLocal) return undefined
  const d = new Date(datetimeLocal)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

export default function ShipmentDetail() {
  const { id: routeId } = useParams()
  const [params] = useSearchParams()
  const poFromQuery = params.get('po')
  const forceDraft = params.get('draft') === '1'
  const navigate = useNavigate()
  const { is } = useAuth()
  const qc = useQueryClient()

  const isNew = routeId === 'new'
  const [draftId, setDraftId] = useState<string | null>(
    routeId && routeId !== 'new' ? routeId : null,
  )
  const [isActive, setIsActive] = useState(!(isNew || forceDraft))
  const [form, setForm] = useState<FormState>(toForm())
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [itemProduct, setItemProduct] = useState('')
  const [itemQty, setItemQty] = useState('1')

  useEffect(() => {
    if (routeId && routeId !== 'new') {
      setDraftId(routeId)
      setIsActive(!forceDraft)
    }
  }, [routeId, forceDraft])

  const editable = !isActive || isNew
  void editable

  const shipmentQ = useQuery({
    queryKey: ['shipment', draftId, isActive],
    queryFn: () => fetchShipment(draftId!, isActive),
    enabled: !!draftId,
  })

  const productsQ = useQuery({ queryKey: ['products'], queryFn: fetchProducts })
  const poQ = useQuery({
    queryKey: ['po', form.purchaseOrder || poFromQuery],
    queryFn: () => fetchPurchaseOrder((form.purchaseOrder || poFromQuery)!),
    enabled: !!(form.purchaseOrder || poFromQuery),
  })

  useEffect(() => {
    if (shipmentQ.data) {
      setForm(toForm(shipmentQ.data))
      setIsActive(shipmentQ.data.IsActiveEntity !== false)
    }
  }, [shipmentQ.data])

  const items: ShipmentItem[] = useMemo(
    () => shipmentQ.data?.items ?? [],
    [shipmentQ.data],
  )

  const createM = useMutation({
    mutationFn: async () => {
      const po = poFromQuery || form.purchaseOrder
      let vendorId = form.vendor_ID
      if (po) {
        const remote = await fetchPurchaseOrder(po)
        vendorId = SUPPLIER_TO_VENDOR[remote.SupplierID] || vendorId
      }
      if (!vendorId && is('VendorUser')) {
        vendorId = '11111111-1111-1111-1111-111111111111'
      }
      if (!vendorId) throw new Error('vendor_ID required')

      const delivery =
        toIsoLocal(form.deliveryDate) ||
        (poQ.data?.StatisticalDeliveryDate
          ? `${poQ.data.StatisticalDeliveryDate}T08:00:00.000Z`
          : new Date(Date.now() + 7 * 86400000).toISOString())

      return createDraftShipment({
        vendor_ID: vendorId,
        purchaseOrder: po || undefined,
        deliveryDate: delivery,
        status: 'Pending',
        totalWeight: form.totalWeight ? Number(form.totalWeight) : 1,
        items: [
          {
            product_ID: 'b1000001-0001-0001-0001-000000000001',
            quantity: 1,
            unit: 'EA',
          },
        ],
      })
    },
    onSuccess: (created) => {
      setDraftId(created.ID)
      setIsActive(false)
      setMsg('Draft created. Edit tabs, upload invoice, then Finalize.')
      navigate(`/shipments/${created.ID}?draft=1`, { replace: true })
      qc.invalidateQueries({ queryKey: ['shipment', created.ID] })
    },
    onError: () => setErr('Could not create draft (check role / deliveryDate).'),
  })

  const saveM = useMutation({
    mutationFn: () =>
      patchShipment(draftId!, false, {
        purchaseOrder: form.purchaseOrder || undefined,
        deliveryDate: toIsoLocal(form.deliveryDate),
        status: form.status,
        totalWeight: form.totalWeight ? Number(form.totalWeight) : undefined,
        trackingNumber: form.trackingNumber || undefined,
        batchId: form.batchId || undefined,
      }),
    onSuccess: () => {
      setMsg('Draft saved.')
      qc.invalidateQueries({ queryKey: ['shipment', draftId] })
    },
    onError: () => setErr('Save failed (past deliveryDate → 400).'),
  })

  const editM = useMutation({
    mutationFn: () => draftEdit(draftId!),
    onSuccess: (draft) => {
      setIsActive(false)
      setMsg('Editing as draft.')
      navigate(`/shipments/${draft.ID}?draft=1`, { replace: true })
      qc.invalidateQueries({ queryKey: ['shipment', draft.ID] })
    },
    onError: () => setErr('draftEdit failed.'),
  })

  const activateM = useMutation({
    mutationFn: async () => {
      await patchShipment(draftId!, false, {
        status: 'Shipped',
        purchaseOrder: form.purchaseOrder || undefined,
        deliveryDate: toIsoLocal(form.deliveryDate),
        totalWeight: form.totalWeight ? Number(form.totalWeight) : undefined,
        trackingNumber: form.trackingNumber || undefined,
        batchId: form.batchId || undefined,
      })
      return draftActivate(draftId!)
    },
    onSuccess: (active) => {
      setIsActive(true)
      setMsg(`Finalized → ${active.status}. Event Mesh mock emitted on CAP.`)
      qc.invalidateQueries({ queryKey: ['shipments'] })
      qc.invalidateQueries({ queryKey: ['shipment', draftId] })
      navigate(`/shipments/${active.ID}`, { replace: true })
    },
    onError: () => setErr('Finalize / draftActivate failed.'),
  })

  const approveM = useMutation({
    mutationFn: () => criticalDelay(draftId!),
    onSuccess: async (res) => {
      setMsg(
        `Exception approved. S/4 StatisticalDeliveryDate → ${res.StatisticalDeliveryDate ?? 'n/a'}`,
      )
      await qc.invalidateQueries({ queryKey: ['shipment', draftId] })
      await qc.invalidateQueries({ queryKey: ['shipments'] })
      if (form.purchaseOrder) {
        await qc.invalidateQueries({ queryKey: ['po', form.purchaseOrder] })
      }
    },
    onError: () => setErr('criticalDelay failed.'),
  })

  const addItemM = useMutation({
    mutationFn: () =>
      addShipmentItem(draftId!, false, {
        product_ID: itemProduct,
        quantity: Number(itemQty) || 1,
        unit: 'EA',
      }),
    onSuccess: () => {
      setItemQty('1')
      qc.invalidateQueries({ queryKey: ['shipment', draftId] })
    },
  })

  const delItemM = useMutation({
    mutationFn: (itemId: string) => deleteShipmentItem(itemId, false),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shipment', draftId] }),
  })

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const canWrite = is('VendorUser') || is('ProcurementManager')
  const canApprove = canWrite && isActive && !!draftId

  return (
    <div>
      <Title level="H2">{isNew && !draftId ? 'New Shipment Draft' : 'Shipment Detail'}</Title>
      <p className="muted">
        Day 8: draft → edit tabs → upload PDF (OCR) → Finalize. Mode:{' '}
        {isActive ? 'Active' : 'Draft'}
      </p>

      <div className="panel" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button onClick={() => navigate('/shipments')}>Back</Button>
        {isNew && !draftId && canWrite && (
          <Button design="Emphasized" disabled={createM.isPending} onClick={() => createM.mutate()}>
            Create Draft{poFromQuery ? ` from ${poFromQuery}` : ''}
          </Button>
        )}
        {draftId && !isActive && canWrite && (
          <>
            <Button design="Emphasized" disabled={saveM.isPending} onClick={() => saveM.mutate()}>
              Save Draft
            </Button>
            <Button design="Attention" disabled={activateM.isPending} onClick={() => activateM.mutate()}>
              Finalize (draftActivate)
            </Button>
          </>
        )}
        {draftId && isActive && canWrite && (
          <Button disabled={editM.isPending} onClick={() => editM.mutate()}>
            Edit as Draft
          </Button>
        )}
        {canApprove && (
          <Button
            design="Negative"
            disabled={approveM.isPending || form.status === 'Exception'}
            onClick={() => approveM.mutate()}
          >
            Approve Exception
          </Button>
        )}
      </div>

      {msg && (
        <MessageStrip design="Positive" onClose={() => setMsg(null)} className="panel">
          {msg}
        </MessageStrip>
      )}
      {err && (
        <MessageStrip design="Negative" onClose={() => setErr(null)} className="panel">
          {err}
        </MessageStrip>
      )}

      {!draftId && isNew && (
        <div className="panel">
          <Title level="H5">Open PO context</Title>
          <p>
            PO: <code>{poFromQuery || '—'}</code>
          </p>
          {poQ.data && (
            <table className="data">
              <tbody>
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
          <p className="muted">Click Create Draft to start CAP draft persistence.</p>
        </div>
      )}

      {draftId && (
        <div className="panel">
          <TabContainer>
            <Tab text="General Info">
              <div className="form-grid">
                <Label>Purchase Order</Label>
                <Input
                  value={form.purchaseOrder}
                  disabled={isActive}
                  onInput={(e) => setField('purchaseOrder', e.target.value)}
                />
                <Label>Delivery date</Label>
                <input
                  type="datetime-local"
                  value={form.deliveryDate}
                  disabled={isActive}
                  onChange={(e) => setField('deliveryDate', e.target.value)}
                  style={{ padding: '0.4rem', font: 'inherit' }}
                />
                <Label>Status</Label>
                <Input
                  value={form.status}
                  disabled={isActive}
                  onInput={(e) => setField('status', e.target.value)}
                />
                <Label>Total weight</Label>
                <Input
                  value={form.totalWeight}
                  disabled={isActive}
                  onInput={(e) => setField('totalWeight', e.target.value)}
                />
                <Label>Tracking (OCR)</Label>
                <Input
                  value={form.trackingNumber}
                  disabled={isActive}
                  onInput={(e) => setField('trackingNumber', e.target.value)}
                />
                <Label>Batch (OCR)</Label>
                <Input
                  value={form.batchId}
                  disabled={isActive}
                  onInput={(e) => setField('batchId', e.target.value)}
                />
                <Label>S/4 PO Status</Label>
                <Input value={shipmentQ.data?.POStatus || poQ.data?.POStatus || ''} disabled />
                {poQ.data?.StatisticalDeliveryDate && (
                  <>
                    <Label>S/4 Stat. Delivery</Label>
                    <Input value={poQ.data.StatisticalDeliveryDate} disabled />
                  </>
                )}
              </div>
            </Tab>

            <Tab text="Items">
              <table className="data">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const sku =
                      productsQ.data?.find((p) => p.ID === it.product_ID)?.extProductId ||
                      it.product_ID
                    return (
                      <tr key={it.ID}>
                        <td>{sku}</td>
                        <td>{it.quantity}</td>
                        <td>{it.unit}</td>
                        <td>
                          {!isActive && (
                            <Button
                              design="Transparent"
                              onClick={() => delItemM.mutate(it.ID)}
                            >
                              Remove
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {!isActive && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <Select
                    onChange={(e) => {
                      const opt = e.detail.selectedOption as HTMLElement
                      setItemProduct(opt?.dataset?.id || '')
                    }}
                  >
                    <Option data-id="">Select product</Option>
                    {(productsQ.data ?? []).map((p) => (
                      <Option key={p.ID} data-id={p.ID} selected={itemProduct === p.ID}>
                        {p.extProductId}
                      </Option>
                    ))}
                  </Select>
                  <Input
                    value={itemQty}
                    onInput={(e) => setItemQty(e.target.value)}
                    style={{ width: 80 }}
                  />
                  <Button
                    disabled={!itemProduct || addItemM.isPending}
                    onClick={() => addItemM.mutate()}
                  >
                    Add item
                  </Button>
                </div>
              )}
            </Tab>

            <Tab text="Invoice">
              <FileUpload
                shipmentId={draftId}
                isActive={isActive}
                disabled={isActive}
                uploadFn={
                  !isActive
                    ? async (file) => {
                        const updated = await uploadInvoiceScan(draftId, false, file)
                        setForm(toForm(updated))
                        await qc.invalidateQueries({ queryKey: ['shipment', draftId] })
                      }
                    : undefined
                }
              />
              <p className="muted" style={{ marginTop: '0.75rem' }}>
                After upload, CAP mock OCR fills trackingNumber / batchId (see General tab).
              </p>
            </Tab>
          </TabContainer>
        </div>
      )}
    </div>
  )
}
