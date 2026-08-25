# Day 9 (2/9) — Integration Test + Polish (PDF Golden Path)

## Mục tiêu
Cả 2 persona journey **đúng PDF** chạy mượt; UI demo-ready; README “mock vs thật” rõ.

## Task — Journey Vendor Alex (PDF Persona 1)
1. Login mock (`alice` = VendorUser, VendorID = GlobalParts_001)
2. Dashboard / workspace: **Open Purchase Orders** từ mock S/4 (không duplicate core — mix-in/live READ)
3. Create Shipment Draft cho 1 PO (draft persistence — đóng tab / reload vẫn còn)
4. Upload PDF Delivery Note → OCR mock điền **Tracking Number + Batch ID**
5. Finalize Shipment → status Shipped; console **Event Mesh** `hub/shipment/created`
6. (Negative) Login vendor khác — không thấy shipment của Alex

## Task — Journey Manager Sarah (PDF Persona 2)
1. Login (`bob` = ProcurementManager)
2. Executive Dashboard: KPI + **At-Risk** + **Inventory Shortfalls** + heat map / delay chart
3. Notification path (mock): mở shipment Exception / delayed → **Approve Exception** (`criticalDelay`)
4. Verify mock **Alert Notification** email log + **PATCH Statistical Delivery Date** trên mock PO
5. **Price History** timeline 1 SKU (temporal vs baseline)
6. (Optional) Login `dave` Auditor — chỉ đọc PriceLedger/AuditLogs
7. (Optional) Login `carol` VendorAdmin — tạo Contact cho Global Parts

## Task — Polish
- [ ] Fix bug chặn 2 flow trên
- [ ] UI5 styling + responsive cơ bản
- [ ] Lazy loading routes hoàn thiện
- [ ] READ list dùng `$select` / `$expand` gọn (PDF Performance)
- [ ] `README.md`:
  - Mock: 4× S/4, DMS, Event Mesh, Alert Notification, AI/OCR, XSUAA/IAS
  - Thật (local): draft, temporal, RBAC filter, media FS, custom actions/functions, React 3 screens
  - Destination `S4_API`, topic `hub/shipment/created`, roles PDF

## Rủi ro / lưu ý
- Ưu tiên bug chặn demo (draft > RBAC leak > S/4 mix-in/PATCH > OCR > UI).
- README mock vs thật — sếp/giám khảo chắc chắn hỏi.

## Output cuối ngày
2 journey PDF chạy liền mạch; README hoàn chỉnh; checklist overview PDF tick được khi demo.
