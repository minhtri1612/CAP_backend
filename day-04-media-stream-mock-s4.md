# Day 4 (28/8) — Media Stream + OCR + Mock 4× S/4HANA + PATCH PO

## Mục tiêu (điểm rủi ro cao nhất)
Upload PDF (mock DMS); OCR mock pre-fill Tracking/Batch; mock **đủ 4 API S/4** theo PDF; mix-in PO; **Approve/criticalDelay PATCH delivery date về S/4**.

## Task — Media Stream (PDF Media/Stream → BTP DMS)
- [ ] `srv.on('PUT', 'Shipments', …)` / media handler cho field `invoiceScan`
- [ ] Lưu local filesystem mock DMS/Object Store: `./uploads/{shipmentID}.pdf`
- [ ] Test Postman: PUT raw binary hoặc multipart; verify file đúng chỗ
- [ ] Comment/README: production cần Document Management Service binding

## Task — Mock AI/OCR (PDF golden path Verification)
- [ ] Sau upload thành công, gọi `mockOcrExtract(filePath)` trả:
  ```js
  { trackingNumber: 'TRK-…', batchId: 'BATCH-…' }
  ```
- [ ] Auto `UPDATE` draft/active shipment: set `trackingNumber`, `batchId` (pre-fill form — wire UI Day 8)
- [ ] Optional: fake latency nhỏ để demo “AI reading” — không cần sub-50ms thật

## Task — Mock đủ 4 S/4 APIs (PDF § Core APIs)
Đăng ký trong `package.json` / `cds.requires` (destination name PDF: **`S4_API`**):

| cds.requires key | Mock entity / fields tối thiểu |
|---|---|
| `API_PURCHASEORDER_PROCESS` | `PurchaseOrders`: PurchaseOrder, POStatus, SupplierID, StatisticalDeliveryDate |
| `API_BUSINESS_PARTNER` | `BusinessPartners`: BusinessPartner, SupplierName, Country |
| `API_PRODUCT_SRV` | `Products`: Product, ProductDescription, BaseUnit |
| `API_SUPPLIERINVOICE_PROCESS` | `SupplierInvoices`: SupplierInvoice, InvoiceStatus |

- [ ] Viết `srv/external/` hoặc `srv/mock-s4*.cds` + `.js` — JSON tĩnh / in-memory
- [ ] `cds.connect.to('API_PURCHASEORDER_PROCESS')` (và 3 API còn lại) trong `ProcurementService` — không lỗi connection
- [ ] Mix-in: `GET Shipments` merge `POStatus` (và nếu cần invoice status khi có `invoiceScan`) vào response — in-memory, không persist
- [ ] Sync shadow (PDF “cds.api / local synchronized with remote” — mức POC):
  - On demand action/function `syncVendorsFromS4` / `syncProductsFromS4` đọc mock BP + Product → upsert local `Vendors`/`Products` **hoặc** document rõ: seed = snapshot, live READ PO không duplicate (PDF Clean Core)

## Task — PATCH về S/4 (PDF Manager Exception Approval)
- [ ] Trong `criticalDelay` (Day 3): sau khi status → Exception:
  - `cds.connect.to('API_PURCHASEORDER_PROCESS')`
  - PATCH/UPDATE mock PO: cập nhật `StatisticalDeliveryDate` (ví dụ +2 ngày từ `deliveryDate` hiện tại)
  - Log: `[MOCK S/4] PATCH PurchaseOrder … StatisticalDeliveryDate=…`
- [ ] CSRF: comment README — CAP `cds.connect.to` xử lý CSRF khi nối tenant thật; mock local bỏ qua

## Rủi ro / lưu ý
- Sai `cds.requires` → lỗi connection khó đọc — config đúng từng kind/model.
- 4 API mock đủ tên PDF; không cần full EDMX production.
- Nếu bí: ưu tiên PO + PATCH + media/OCR trước; BP/Product/Invoice stub READ tối thiểu vẫn phải có để checklist PDF xanh.

## Output cuối ngày
Upload PDF → OCR điền tracking/batch; `GET Shipments` kèm PO status; `criticalDelay` PATCH mock S/4 delivery date; 4 mock API connect được.
