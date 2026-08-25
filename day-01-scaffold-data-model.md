# Day 1 (25/8) — Scaffold + Data Model

## Mục tiêu
CAP project khởi tạo được, schema **đủ entity theo PDF** compile chạy, seed data sẵn sàng.

## Task
- [x] Scaffold in-repo (`procurement-hub` via CAP + sqlite; postgres sau khi deploy)
- [x] `npm i @sap/cds @cap-js/sqlite better-sqlite3` + `@sap/cds-dk -D`
- [x] Viết `db/schema.cds` — khớp PDF + bổ sung field journey (OCR / Contacts):

### Core entities (PDF bảng + CDS snippet)
  - `namespace hub.procurement;`
  - `using { managed, cuid, temporal } from '@sap/cds/common';`
  - Entity `Vendors`: `ID (UUID)`, `name`, `taxId`, `country`
  - Entity `Contacts : cuid, managed` (**PDF — Vendor Admin**):
    - `vendor : Association to Vendors;`
    - `name`, `email`, `phone`, `role` (optional String)
  - Entity `Products`: `ID (UUID)`, `extProductId` (S/4 ref), `basePrice`
    - (optional shadow) `stockQty : Decimal(13,3)` — phục vụ Inventory Shortfalls dashboard
  - Entity `Shipments : cuid, managed`:
    - `vendor : Association to Vendors;`
    - `purchaseOrder` : String — link mock S/4 PO (`API_PURCHASEORDER_PROCESS`)
    - `status : String enum { Draft; Pending; Shipped; Delivered; Exception } default 'Draft';`
    - `deliveryDate : DateTime;`
    - `totalWeight : Decimal(13,3);` — **PDF bảng entity**
    - `trackingNumber : String;` — OCR pre-fill (PDF golden path)
    - `batchId : String;` — OCR pre-fill (PDF golden path)
    - `items : Composition of many ShipmentItems on items.parent = $self;`
    - `@Core.MediaType: 'application/pdf' invoiceScan : LargeBinary;`
  - Entity `ShipmentItems : cuid`:
    - `parent : Association to Shipments;`
    - `product : Association to Products;`
    - `quantity : Decimal(13,3);`
    - `unit : String;`
  - Entity `PriceLedger : cuid, temporal`:
    - `product : Association to Products;`
    - `negotiatedPrice : Decimal(15,2);`
    - (`validFrom` / `validTo` từ aspect `temporal` — **không tự đặt tên khác**)
  - Entity `AuditLogs : cuid` (PDF Requirement §1 — Change Log chi tiết nếu cần ngoài PriceLedger):
    - `entityName`, `field`, `oldValue`, `newValue`, `changedBy`, `changedAt`
    - `@readonly` / `@insertonly` áp dụng ở service layer (Day 2)

- [x] `cds watch` / `cds serve` → schema compile, `$metadata` tại `localhost:4004`
- [x] Viết `db/data/*.csv` seed:
  - 3–4 vendors
  - 2–3 contacts / vendor (cho Vendor Admin demo)
  - 5–6 products (có `basePrice` + `stockQty`)
  - vài shipments mẫu (kèm `purchaseOrder`, `totalWeight`)
  - vài dòng `PriceLedger` lịch sử giá

## Rủi ro / lưu ý
- `temporal` trên `PriceLedger` phải dùng convention `@sap/cds/common` (`validFrom`/`validTo`).
- Composition `Shipments → ShipmentItems` bắt buộc để deep-save draft multi-line (PDF).
- `Contacts` gắn `vendor` — Day 5 sẽ filter instance-level theo `$user.VendorID`.

## Output cuối ngày
CAP server chạy được; `$metadata` show đủ: Vendors, Contacts, Products, Shipments, ShipmentItems, PriceLedger, AuditLogs; seed load thành công.
