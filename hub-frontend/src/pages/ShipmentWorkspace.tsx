import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { Button, Input, Title } from '@ui5/webcomponents-react'
import { useNavigate } from 'react-router-dom'
import {
  fetchOpenPurchaseOrders,
  fetchShipments,
  type Shipment,
} from '../api/procurement'
import { FileUpload } from '../components/FileUpload'
import { useAuth } from '../auth/AuthContext'

export default function ShipmentWorkspace() {
  const navigate = useNavigate()
  const { is } = useAuth()
  const [filter, setFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const shipmentsQ = useQuery({ queryKey: ['shipments'], queryFn: fetchShipments })
  const posQ = useQuery({ queryKey: ['open-pos'], queryFn: fetchOpenPurchaseOrders })

  const columns = useMemo<ColumnDef<Shipment>[]>(
    () => [
      { accessorKey: 'purchaseOrder', header: 'PO' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'POStatus', header: 'S/4 PO Status' },
      { accessorKey: 'deliveryDate', header: 'Delivery' },
      { accessorKey: 'trackingNumber', header: 'Tracking' },
      { accessorKey: 'totalWeight', header: 'Weight' },
    ],
    [],
  )

  const table = useReactTable({
    data: shipmentsQ.data ?? [],
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const canCreate = is('VendorUser') || is('ProcurementManager')

  return (
    <div>
      <Title level="H2">Shipment Workspace</Title>
      <p className="muted">
        Sort/filter list, open POs from mock S/4. Manager: Flag Critical Delay or Approve Exception.
      </p>

      <div className="panel" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Input
          placeholder="Filter…"
          value={filter}
          onInput={(e) => setFilter(e.target.value)}
          style={{ minWidth: 220 }}
        />
        {canCreate && (
          <Button design="Emphasized" onClick={() => navigate('/shipments/new')}>
            New Shipment
          </Button>
        )}
        <FileUpload />
      </div>

      <div className="panel">
        <Title level="H5">Shipments</Title>
        {shipmentsQ.isError && <p className="muted">Load failed (role may be Auditor).</p>}
        <table className="data">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} onClick={h.column.getToggleSortingHandler()}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} onClick={() => navigate(`/shipments/${row.original.ID}`)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <Title level="H5">Open Purchase Orders (mock S/4)</Title>
        <p className="muted">Create from PO opens the new-shipment preview with PO preselected.</p>
        {posQ.isError && <p className="muted">Could not load mock S/4 POs.</p>}
        <table className="data">
          <thead>
            <tr>
              <th>PO</th>
              <th>Status</th>
              <th>Supplier</th>
              <th>Stat. Delivery</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(posQ.data ?? []).map((po) => (
              <tr key={po.PurchaseOrder}>
                <td>{po.PurchaseOrder}</td>
                <td>{po.POStatus}</td>
                <td>{po.SupplierID}</td>
                <td>{po.StatisticalDeliveryDate}</td>
                <td>
                  {canCreate && (
                    <Button
                      design="Transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/shipments/new?po=${po.PurchaseOrder}`)
                      }}
                    >
                      Create from PO
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
