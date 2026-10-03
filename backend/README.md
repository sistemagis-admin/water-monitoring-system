# Smart Water Pump Monitoring System (SWPMS) - Backend

Backend service untuk **Smart Water Pump Monitoring System (SWPMS)** PT Ascon Multi Pratama, dibangun menggunakan **Fastify (TypeScript)**, **PostgreSQL**, **MQTT**, dan **Server-Sent Events (SSE)** sesuai spesifikasi penuh dokumen [PRD.md](../docs/PRD.md).

---

## 🌟 Fitur Utama

- 🚀 **Fastify Core**: High-performance HTTP/REST API gateway dengan validasi schema-first (Zod + Fastify Type Provider Zod).
- 📖 **Dokumentasi Lengkap Swagger & OpenAPI**:
  - Interactive Playground: [`http://localhost:3000/docs`](http://localhost:3000/docs)
  - OpenAPI 3.0 Raw JSON: [`http://localhost:3000/docs/json`](http://localhost:3000/docs/json)
  - Direct Endpoint untuk Postman: [`http://localhost:3000/api/v1/openapi.json`](http://localhost:3000/api/v1/openapi.json)
  - File Export Postman: [`docs/SWPMS_API.postman_collection.json`](../docs/SWPMS_API.postman_collection.json) & [`docs/openapi.json`](../docs/openapi.json)
- 📡 **MQTT Telemetry & Command Gateway**:
  - Ingestion telemetry otomatis dari IoT Gateway / PLC (`swpm/v1/{site_id}/{device_id}/telemetry`).
  - Device status & heartbeat monitoring (`swpm/v1/{site_id}/{device_id}/status`).
  - Safe commanded pump ON/OFF control dengan timeout & acknowledgement tracking (`swpm/v1/{site_id}/{device_id}/command` & `command_ack`).
- ⚡ **Server-Sent Events (SSE) Real-Time**:
  - Streaming live telemetry, asset state, device connectivity, dan alarm ke dashboard browser tanpa refresh di `/api/v1/realtime/stream`.
- 🚨 **Alarm Engine & Anti-Flicker**:
  - Evaluasi kondisi otomatis berdasarkan threshold dan operator (`>`, `<`, `>=`, `<=`, `==`, `!=`).
  - Deduplikasi alarm dan auto-resolve saat kondisi kembali normal.
  - Alur acknowledge oleh operator dengan catatan investigasi.
- 🗄️ **PostgreSQL System of Record**:
  - Dynamic topology model (Organisasi, Project, Site, Area/Room, Device, Asset/Pump, Sensor, Sensor Binding).
  - Pemisahan `asset_current_state` (realtime cepat) dengan `telemetry_samples` (time-series historis).
- 🔒 **Authentication & RBAC**:
  - JWT Bearer Authentication dengan bcrypt password hashing.
  - Role-Based Access Control matrix (Super Admin, Engineer, Operator, Viewer).
- 📊 **Streaming CSV Reports & Audit Logs**:
  - Export data time-series dan riwayat alarm secara streaming tanpa lonjakan memori.

---

## 🏗️ Struktur Arsitektur Backend

```text
backend/src/
├── app.ts                         # Fastify app builder & plugin registration
├── server.ts                      # Server bootstrap & background jobs init
│
├── config/
│   ├── env.ts                     # Environment variables validation (Zod)
│   └── constants.ts              # Roles, Permissions, & Error codes
│
├── infrastructure/
│   ├── db/
│   │   ├── index.ts               # PostgreSQL connection pool & helpers
│   │   ├── migrate.ts             # Migration runner
│   │   ├── seed.ts                # Initial seed data (6 pumps, 3 rooms, 4 users)
│   │   └── migrations/            # DDL SQL migrations
│   ├── mqtt/
│   │   └── mqtt-client.ts         # MQTT connection, topics & subscription handler
│   ├── realtime/
│   │   └── sse-manager.ts         # SSE connection manager & event broadcaster
│   └── logger/                    # Structured JSON logging
│
├── modules/
│   ├── auth/                      # Login, Logout, Me profile
│   ├── dashboard/                 # KPI summary & site operational overview
│   ├── sites/                     # Plant / facility sites management
│   ├── areas/                     # Pump rooms / areas
│   ├── devices/                   # IoT Gateways, connectivity & diagnostics
│   ├── assets/                    # Pumps, current state, & pump power commands
│   ├── sensors/                   # Physical/logical sensors & dynamic bindings
│   ├── metrics/                   # Telemetry metric catalog (21 metrics)
│   ├── telemetry/                 # Historical time-series query & ingestion
│   ├── alarms/                    # Alarms, acknowledgement & Alarm Engine
│   ├── events/                    # System & equipment event logs
│   ├── audit/                     # Immutable configuration audit trail
│   ├── reports/                   # Streaming CSV export for telemetry/alarms
│   ├── realtime/                  # SSE stream route
│   └── users/                     # User management & roles
│
├── jobs/
│   ├── device-health.ts           # Offline gateway detection (30s timeout)
│   └── command-timeout.ts         # Pump command timeout monitor (15s timeout)
│
├── simulator/
│   └── mqtt-simulator.ts          # IoT edge gateway & PLC simulator
└── scripts/
    ├── export-openapi.ts          # Generator openapi.json & postman_collection.json
    ├── test-api.ts                # API verification suite
    └── test-simulator-flow.ts     # End-to-end MQTT integration test suite
```

---

## 🔑 Akun Default (Seed Data)

| Role | Email | Password | Hak Akses |
|---|---|---|---|
| **Super Admin** | `admin@ascon.co.id` | `Admin@123` | Akses penuh seluruh sistem, user management, audit log, kontrol |
| **Engineer** | `engineer@ascon.co.id` | `Engineer@123` | Manajemen site, device, asset, sensor, rule alarm, kontrol pompa |
| **Operator** | `operator@ascon.co.id` | `Operator@123` | Monitoring dashboard, acknowledge alarm, kontrol pompa ON/OFF |
| **Viewer** | `viewer@ascon.co.id` | `Viewer@123` | Akses read-only dashboard, status, trend historis |

---

## 🚀 Panduan Menjalankan Sistem

### 1. Jalankan Database & MQTT Broker (Docker)
Dari root workspace:
```bash
docker compose up -d
```
Service yang berjalan:
- PostgreSQL di `localhost:5432` (`swpm_db`)
- Mosquitto MQTT di `localhost:1883`

### 2. Install Dependency Backend
```bash
cd backend
npm install
```

### 3. Migrasi & Seed Database
```bash
npm run migrate
npm run seed
```

### 4. Jalankan Fastify API Server
Mode development (hot reload):
```bash
npm run dev
```
Server akan aktif di:
- API URL: `http://localhost:3000`
- **Swagger UI Interactive Documentation**: `http://localhost:3000/docs`
- **OpenAPI 3.0 Specification JSON**: `http://localhost:3000/docs/json` atau `http://localhost:3000/api/v1/openapi.json`
- **SSE Real-Time Stream**: `http://localhost:3000/api/v1/realtime/stream`

### 5. Jalankan IoT Gateway Simulator (Simulasi 6 Pompa Lapangan)
Di terminal baru:
```bash
npm run simulate
```
Simulator akan:
- Mengirim telemetry secara periodik (setiap 5 detik) untuk 6 pompa (`pump-01` sampai `pump-06`).
- Mengirim heartbeat status gateway setiap 10 detik.
- Menerima command `PUMP_POWER` dari Fastify API, mensimulasikan validasi PLC, dan membalas dengan acknowledgement `EXECUTED`!

---

## 📮 Panduan Import ke Postman

Tersedia dua opsi mudah untuk menguji di Postman:

### Opsi A: Import Langsung via Link (Recommended)
1. Buka Postman -> Klik **Import**.
2. Masukkan URL:
   ```text
   http://localhost:3000/docs/json
   ```
   atau
   ```text
   http://localhost:3000/api/v1/openapi.json
   ```
3. Klik **Import**. Seluruh endpoint, schema request, dan parameter akan otomatis terstruktur di Postman.

### Opsi B: Import File Postman Collection
1. Buka Postman -> Klik **Import** -> **Upload Files**.
2. Pilih file [`docs/SWPMS_API.postman_collection.json`](../docs/SWPMS_API.postman_collection.json).
3. Collection siap digunakan dengan variabel environment `{{baseUrl}}` (`http://localhost:3000`).
4. Jalankan request **Auth -> Login (Super Admin)**, token JWT akan tersimpan otomatis ke variabel collection `{{access_token}}` untuk request selanjutnya!

---

## 🧪 Testing & Verifikasi

Untuk menjalankan script pengujian otomatis:
```bash
# Verifikasi semua endpoint REST API
npx tsx src/scripts/test-api.ts

# Verifikasi alur End-to-End (MQTT simulator -> Telemetry ingestion -> Pump command ON/OFF -> Alarm trigger & acknowledge)
npx tsx src/scripts/test-simulator-flow.ts
```

Build production:
```bash
npm run build
npm start
```
