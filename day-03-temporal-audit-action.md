# Day 3 (27/8) — Temporal Data + Audit Logging + Custom Action + Notifications

## Mục tiêu
Price history query theo thời gian; audit log tự ghi khi đổi giá; `criticalDelay` đổi status + **mock Event Mesh** + **mock BTP Alert Notification (email)** — đúng PDF Side Effects & Actions.

## Task
- [ ] Implement `PriceLedger` (temporal) đầy đủ — test OData `$filter` / temporal query `validFrom`/`validTo`
- [ ] Hooks Change Log cho price negotiation (PDF):
  - Ưu tiên programmatic: `srv.after(['CREATE','UPDATE'], 'PriceLedger', …)` ghi `AuditLogs`
  - Nếu dùng annotation `@cds.on.insert` / `@cds.on.update` — đọc đúng CAP docs (declarative ≠ `srv.before/after`)
  - Mỗi lần giá đổi: lưu `oldValue`, `newValue`, `changedBy`, `changedAt`

- [ ] Bound action trên `Shipments` (PDF):
  ```
  action criticalDelay() returns Shipments;
  ```
  Handler:
  1. Đổi `status` → `'Exception'`
  2. **Mock Event Mesh** — topic đúng PDF `hub/shipment/created` (hoặc `hub/shipment/exception` nếu tách; ghi comment):
     ```
     console.log('[MOCK Event Mesh] hub/shipment/created', payload)
     ```
  3. **Mock BTP Alert Notification / email** (PDF: “trigger email notifications via BTP Alert Notification when a vendor flags a delay”):
     ```
     console.log('[MOCK Alert Notification] email → procurement-mgr@example.com', {
       subject: 'Critical delay',
       shipmentId, vendorId, deliveryDate
     })
     ```
  4. Return updated `Shipments`
  - **PATCH Statistical Delivery Date về S/4** → làm Day 4 (sau khi mock PO API sẵn); để stub `// TODO Day 4: patch S/4 PO` trong handler

- [ ] Optional: emit Event Mesh mock cả lúc `draftActivate` → status `Shipped` (PDF golden path Hand-off) — cùng helper `emitShipmentEvent(topic, payload)`

## Rủi ro / lưu ý
- Phân biệt rõ annotation hooks vs `srv.before/after`.
- Temporal query cú pháp CAP khác filter thường — test trước khi wire UI Timeline.
- Alert Notification / Event Mesh **chỉ mock** — README phải ghi rõ; tên topic / “email” vẫn đúng PDF để demo.

## Output cuối ngày
`criticalDelay` gọi được qua Postman: status → Exception; console có log Event Mesh + Alert Notification; audit ghi khi PATCH/CREATE giá.
