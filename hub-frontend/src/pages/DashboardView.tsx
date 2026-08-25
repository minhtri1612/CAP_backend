import { useQuery } from '@tanstack/react-query'
import { AnalyticalTable, Title } from '@ui5/webcomponents-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  fetchAtRiskShipments,
  fetchInventoryShortfalls,
  fetchShipments,
} from '../api/procurement'
import { KpiCard } from '../components/KpiCard'
import { useAuth } from '../auth/AuthContext'

export default function DashboardView() {
  const { is, user } = useAuth()
  const isManager = is('ProcurementManager')

  const shipmentsQ = useQuery({ queryKey: ['shipments', user], queryFn: fetchShipments })
  const atRiskQ = useQuery({
    queryKey: ['at-risk', user],
    queryFn: fetchAtRiskShipments,
    enabled: !is('Auditor'),
  })
  const shortQ = useQuery({
    queryKey: ['shortfalls', user],
    queryFn: fetchInventoryShortfalls,
    enabled: isManager,
  })

  const shipments = shipmentsQ.data ?? []
  const byStatus = shipments.reduce<Record<string, number>>((acc, s) => {
    const key = s.status || 'Unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(byStatus).map(([status, count]) => ({
    status,
    count,
  }))

  const delayChart = (atRiskQ.data ?? []).map((s) => {
    const days =
      s.deliveryDate != null
        ? Math.ceil(
            (new Date(s.deliveryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          )
        : 0
    return {
      po: s.purchaseOrder || s.ID.slice(0, 8),
      daysLate: days < 0 ? Math.abs(days) : 0,
      daysLeft: days >= 0 ? days : 0,
    }
  })

  return (
    <div>
      <Title level="H2">Executive Dashboard</Title>
      <p className="muted">
        {isManager
          ? 'Manager view: global KPI, at-risk, and inventory shortfalls.'
          : is('Auditor')
            ? 'Auditor: use Price Ledger / Audit via API. Shipment dashboard limited.'
            : 'Vendor-scoped view (RBAC filters shipments to your VendorID).'}
      </p>

      <div className="kpi-row">
        <KpiCard label="Total" value={shipments.length} />
        {Object.entries(byStatus).map(([status, count]) => (
          <KpiCard key={status} label={status} value={count} />
        ))}
        <KpiCard label="At risk" value={atRiskQ.data?.length ?? 0} />
        {isManager && <KpiCard label="Shortfalls" value={shortQ.data?.length ?? 0} />}
      </div>

      <div className="grid-2">
        <div className="panel">
          <Title level="H5">Shipments by status</Title>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0a6ed1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <Title level="H5">Delay heat (at-risk)</Title>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={delayChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="po" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="daysLate" fill="#bb0000" name="Days late" />
                <Bar dataKey="daysLeft" fill="#e76500" name="Days left" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <Title level="H5">At-Risk Shipments</Title>
          {atRiskQ.isError && <p className="muted">Failed to load (check role / CAP).</p>}
          <AnalyticalTable
            data={atRiskQ.data ?? []}
            columns={[
              { Header: 'PO', accessor: 'purchaseOrder' },
              { Header: 'Status', accessor: 'status' },
              { Header: 'Delivery', accessor: 'deliveryDate' },
              { Header: 'PO Status', accessor: 'POStatus' },
            ]}
            visibleRows={6}
          />
        </div>

        {isManager ? (
          <div className="panel">
            <Title level="H5">Inventory Shortfalls</Title>
            {shortQ.isError && <p className="muted">Failed to load shortfalls.</p>}
            <AnalyticalTable
              data={shortQ.data ?? []}
              columns={[
                { Header: 'SKU', accessor: 'sku' },
                { Header: 'Stock', accessor: 'stockQty' },
                { Header: 'Demand', accessor: 'openDemand' },
                { Header: 'Shortfall', accessor: 'shortfall' },
              ]}
              visibleRows={6}
            />
          </div>
        ) : (
          <div className="panel">
            <Title level="H5">Inventory Shortfalls</Title>
            <p className="muted">Manager-only (ProcurementManager).</p>
          </div>
        )}
      </div>
    </div>
  )
}
