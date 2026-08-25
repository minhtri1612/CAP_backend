# Day 5 (29/8) — RBAC (Instance-Level Security) + Contacts

## Mục tiêu (điểm rủi ro cao thứ 2)
4 role PDF hoạt động với mock auth; instance-level filter theo VendorID; **Vendor Admin tạo Contact** đúng scope công ty mình.

## Task
- [x] Viết `xs-security.json` (PDF Security):
  - `VendorUser` — Read/Write, attribute `VendorID`
  - `VendorAdmin` — Management: tạo/sửa **Contacts** của vendor mình
  - `ProcurementManager` — Global access; Approve (`criticalDelay`)
  - `Auditor` — Read-only Temporal/`PriceLedger` + `AuditLogs`
  - Attribute: `VendorID` (map `$user.VendorID` / `req.user.attr.VendorID`)

- [x] Mock auth CAP (không có IAS/XSUAA thật):
  - `cds.requires.auth.users` — ví dụ:
    | User | Role | VendorID |
    |---|---|---|
    | `alice` | VendorUser | GlobalParts_001 |
    | `carol` | VendorAdmin | GlobalParts_001 |
    | `bob` | ProcurementManager | — |
    | `dave` | Auditor | — |

- [x] Service: `requires: 'authenticated-user'`
- [x] Instance-level (PDF: `where: 'VendorID = $user.vendor'` / `vendor_ID = $user.VendorID`):
  - `@restrict` trên `Shipments`, `Contacts`, (và entities vendor-scoped khác)
  - VendorUser / VendorAdmin: chỉ row `vendor_ID = $user.attr.VendorID`
  - ProcurementManager: unrestricted
  - Auditor: chỉ `GET` `PriceLedger` + `AuditLogs`; deny WRITE / deny Shipments mutate

- [x] Contacts (PDF Vendor Admin):
  - VendorAdmin: `CREATE`/`UPDATE`/`DELETE` Contacts trong VendorID mình
  - VendorUser: đọc Contacts công ty mình (optional WRITE off)
  - Manager: full; Auditor: no (hoặc read-only nếu muốn demo compliance — mặc định PDF: Auditor = temporal/audit)

- [x] Test `curl -u alice:…` / `carol` / `bob` / `dave` — verify không leak data cross-vendor; carol tạo Contact OK; alice không tạo được Contact nếu restrict như trên

## Rủi ro / lưu ý
- Mock auth ≠ XSUAA — ghi README chỗ cần đổi khi có IAS thật.
- Giám khảo hay login user khác để tìm leak — test kỹ Contacts + Shipments.

## Output cuối ngày
4 mock user đúng scope; VendorAdmin tạo Contact trong company; Auditor chỉ đọc audit/temporal.
