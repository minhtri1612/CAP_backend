import { useQuery } from '@tanstack/react-query'
import { AnalyticalTable, Title } from '@ui5/webcomponents-react'
import { fetchPriceLedger } from '../api/procurement'

export default function PriceLedgerPage() {
  const q = useQuery({ queryKey: ['price-ledger'], queryFn: fetchPriceLedger })

  return (
    <div>
      <Title level="H2">Price Negotiation Ledger</Title>
      <p className="muted">Temporal PriceLedger. Timeline polish on Day 8.</p>
      <div className="panel">
        {q.isError && <p className="muted">Access denied or CAP error.</p>}
        <AnalyticalTable
          data={q.data ?? []}
          columns={[
            { Header: 'ID', accessor: 'ID' },
            { Header: 'Product', accessor: 'product_ID' },
            { Header: 'Price', accessor: 'negotiatedPrice' },
            { Header: 'Valid from', accessor: 'validFrom' },
            { Header: 'Valid to', accessor: 'validTo' },
          ]}
          visibleRows={10}
        />
      </div>
    </div>
  )
}
