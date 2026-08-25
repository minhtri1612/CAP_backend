import { useQuery } from '@tanstack/react-query'
import { Option, Select, Title } from '@ui5/webcomponents-react'
import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchPriceLedgerHistory, fetchProducts } from '../api/procurement'
import './PriceLedgerPage.css'

export default function PriceLedgerPage() {
  const productsQ = useQuery({ queryKey: ['products'], queryFn: fetchProducts })
  const [productId, setProductId] = useState('')

  const historyQ = useQuery({
    queryKey: ['price-history', productId || 'all'],
    queryFn: () => fetchPriceLedgerHistory(productId || undefined),
  })

  const product = productsQ.data?.find((p) => p.ID === productId)
  const basePrice = product?.basePrice != null ? Number(product.basePrice) : null

  const rows = useMemo(() => {
    const list = historyQ.data ?? []
    return [...list].sort(
      (a, b) => new Date(a.validFrom || 0).getTime() - new Date(b.validFrom || 0).getTime(),
    )
  }, [historyQ.data])

  const chartData = rows.map((r) => ({
    when: (r.validFrom || '').slice(0, 10),
    negotiated: Number(r.negotiatedPrice),
    baseline: basePrice,
  }))

  return (
    <div>
      <Title level="H2">Price Negotiation Ledger</Title>
      <p className="muted">
        Temporal history via <code>sap-valid-from</code> / <code>sap-valid-to</code>. Baseline =
        Products.basePrice (S/4 shadow).
      </p>

      <div className="panel toolbar">
        <Select
          accessibleName="Product"
          onChange={(e) => {
            const opt = e.detail.selectedOption as HTMLElement
            setProductId(opt?.dataset?.id || '')
          }}
        >
          <Option data-id="">All products (current filter window)</Option>
          {(productsQ.data ?? []).map((p) => (
            <Option key={p.ID} data-id={p.ID} selected={productId === p.ID}>
              {p.extProductId} (base {p.basePrice})
            </Option>
          ))}
        </Select>
      </div>

      {product && (
        <div className="panel">
          <Title level="H5">
            {product.extProductId} — baseline {basePrice}
          </Title>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="when" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="negotiated" stroke="#0a6ed1" name="Negotiated" />
                <Line type="monotone" dataKey="baseline" stroke="#888" name="Baseline" strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="panel">
        <Title level="H5">Audit Timeline</Title>
        {historyQ.isError && <p className="muted">Failed to load temporal ledger.</p>}
        <ol className="timeline">
          {rows.map((r) => {
            const sku =
              productsQ.data?.find((p) => p.ID === r.product_ID)?.extProductId || r.product_ID
            const negotiated = Number(r.negotiatedPrice)
            const delta =
              basePrice != null && !Number.isNaN(negotiated)
                ? negotiated - basePrice
                : null
            return (
              <li key={`${r.ID}-${r.validFrom}`}>
                <div className="dot" />
                <div className="card">
                  <div className="when">
                    {(r.validFrom || '').slice(0, 10)} → {(r.validTo || '').slice(0, 10)}
                  </div>
                  <div className="body">
                    <strong>{sku}</strong> — negotiated <code>{r.negotiatedPrice}</code>
                    {delta != null && (
                      <span className="muted">
                        {' '}
                        ({delta >= 0 ? '+' : ''}
                        {delta.toFixed(2)} vs baseline {basePrice})
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
        {!rows.length && !historyQ.isLoading && (
          <p className="muted">No temporal rows in range (try another product).</p>
        )}
      </div>
    </div>
  )
}
