# Create HANA Cloud (hana-free) then HDI — Cockpit steps for ap21 trial

Postgres trial on this region failed with broker Internal Server Error.
Mirror `Procurement_hub`: use **HANA** + Destination + Approuter.

## 1) Cockpit — create HANA Cloud free DB

Subaccount `trial` → **SAP HANA Cloud** → **Create Instance**:

- Plan: **hana-free** (or Booster “SAP HANA Cloud”)
- Wait until status **Running** (often 10–20 min)

## 2) Map DB to Cloud Foundry

In HANA Cloud instance → **Actions** → **Map to Cloud Foundry Org/Space**  
→ org `8b88718atrial` / space `dev`

## 3) CF services (CLI)

```powershell
cf target -o 8b88718atrial -s dev
cf create-service hana hdi-shared procurement-hub-db
cf create-service destination lite procurement-hub-destination
cf create-service connectivity lite procurement-hub-connectivity
# XSUAA already: procurement-hub-auth
```

Optional Alert (if entitled; plan may be paid):

```powershell
cf create-service alert-notification standard procurement-hub-alert
```

## 4) Destination `S4_API` (when you have real S/4 or sandbox)

Cockpit → Destination → New:

- Name: **S4_API** (PDF name)
- URL: S/4 or API Business Hub sandbox
- Auth: Basic / OAuth as required

Until then, CAP still uses **local mock S/4 app-services** embedded in the srv app (works on BTP without S/4 tenant).

## 5) Build & deploy

```powershell
cd D:\CAP_backend
npm install
npx mbt build -t .
cf deploy procurement-hub_1.0.0.mtar
```

Assign role collections to your user (Cockpit → Security → Users):  
`ProcurementHub_Manager` / `VendorUser` / etc.

Open the **approuter** URL (not srv directly).
