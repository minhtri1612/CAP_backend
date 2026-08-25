# Day 10 (3/9) — Buffer + Nộp bài

## Mục tiêu
Buffer rủi ro, demo đúng PDF golden path, nộp đúng hạn — **không thêm feature mới**.

## Task
- [ ] Buffer bug còn lại từ Day 9 — ưu tiên:
  1. Draft → Activate flow
  2. RBAC leak (Shipments / Contacts cross-vendor)
  3. Mock S/4 mix-in + **PATCH StatisticalDeliveryDate**
  4. OCR pre-fill tracking/batch
  5. Dashboard At-Risk / Inventory Shortfalls
  6. UI polish
- [ ] Demo script 2 persona (thứ tự click):
  - **Alex**: login → Open POs → New Shipment draft → upload DN → thấy OCR fields → Finalize → chỉ Event Mesh log
  - **Sarah**: login → Dashboard At-Risk/Shortfalls → Approve Exception → show S/4 date đổi → Price Timeline
  - **Carol** (30s): tạo Contact
  - **Dave** (30s): chỉ xem audit/price history
- [ ] Screenshot / video ngắn từng bước chính (phòng demo live lỗi env)
- [ ] Review README — không gây hiểu nhầm đã gắn S/4/XSUAA/DMS/Event Mesh/Alert Notification **thật**
- [ ] Đối chiếu nhanh `00-overview.md` checklist PDF trước khi zip/push
- [ ] Package + nộp

## Rủi ro / lưu ý
- Ngày này **chỉ fix bug chặn demo** — không mở scope (dễ vỡ flow đang ổn).

## Output cuối ngày
Bài nộp xong; demo script + evidence sẵn; scope PDF covered (mock đúng contract).
