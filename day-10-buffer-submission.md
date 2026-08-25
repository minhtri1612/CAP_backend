# Day 10 (3/9) — Buffer + Nộp bài

## Mục tiêu
Buffer rủi ro, demo đúng PDF golden path, nộp đúng hạn — **không thêm feature mới**.

## Task
- [x] Buffer bug còn lại từ Day 9 — ưu tiên:
  1. Draft → Activate flow — OK (smoke)
  2. RBAC leak (Shipments / Contacts cross-vendor) — OK (erin)
  3. Mock S/4 mix-in + **PATCH StatisticalDeliveryDate** — OK
  4. OCR pre-fill tracking/batch — OK
  5. Dashboard At-Risk / Inventory Shortfalls — OK
  6. UI polish — giữ Day 7–8 (không mở scope)
- [x] Demo script 2 persona (thứ tự click) → [`DEMO.md`](DEMO.md)
  - **Alex**: login → Open POs → New Shipment draft → upload DN → thấy OCR fields → Finalize → chỉ Event Mesh log
  - **Sarah**: login → Dashboard At-Risk/Shortfalls → Approve Exception → show S/4 date đổi → Price Timeline
  - **Carol** (30s): tạo Contact
  - **Dave** (30s): chỉ xem audit/price history
- [x] Evidence path: CAP console logs + DEMO fallback table (screenshot/video tự chụp khi demo live)
- [x] Review README — không gây hiểu nhầm đã gắn S/4/XSUAA/DMS/Event Mesh/Alert Notification **thật**
- [x] Đối chiếu nhanh `00-overview.md` checklist PDF — đã tick (Day 9–10)
- [x] Package + nộp — push `main` + README/DEMO

## Rủi ro / lưu ý
- Ngày này **chỉ fix bug chặn demo** — không mở scope (dễ vỡ flow đang ổn).
- Day 10 smoke (2026-08-25): OCR, ACTIVATE, RBAC, DASH, S4PATCH — all pass.

## Output cuối ngày
Bài nộp xong; demo script + evidence sẵn; scope PDF covered (mock đúng contract).
