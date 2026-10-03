# Product Requirements Document (PRD)
# Smart Water Pump Monitoring System
## PT Ascon Multi Pratama

**Document Status:** Revised — Development Ready Baseline  
**Version:** 1.1  
**Date:** 3 October 2026  
**Product Type:** Industrial IoT / Water Pump Monitoring Dashboard  
**Frontend:** React + Vite  
**Backend:** Fastify  
**Telemetry Transport:** MQTT  
**Recommended Database:** PostgreSQL  
**Recommended Browser Realtime:** Server-Sent Events (SSE)

---

## 1. Executive Summary

Smart Water Pump Monitoring System (SWPMS) adalah platform monitoring berbasis web untuk memantau kondisi operasional sistem pompa air secara terpusat, real-time, dan historis. Sistem menerima telemetry dari perangkat lapangan/PLC/gateway melalui MQTT, memproses dan memvalidasi data di backend Fastify, menyimpan data operasional ke PostgreSQL, lalu menyajikannya ke dashboard React secara real-time.

PRD ini dirancang dengan konteks PT Ascon Multi Pratama yang memiliki kompetensi pada electrical system, automation, SCADA, PLC, panel, dan proyek water treatment. Website perusahaan juga mendokumentasikan penggunaan PLC/LCP untuk kontrol pompa, level tangki, flow meter, tekanan, alarm, serta integrasi otomasi/SCADA pada proyek air. Karena itu, SWPMS diposisikan sebagai lapisan monitoring dan data/IIoT di atas sistem kontrol lapangan, bukan sebagai pengganti PLC atau safety system. 

Sistem tahap awal harus mampu menjawab pertanyaan operator berikut:

1. Berapa pompa, ruangan/area, device, dan sensor yang tersedia di site?
2. Pompa mana yang sedang RUNNING, STOPPED, FAULT, OFFLINE, atau MAINTENANCE?
3. Pompa mana yang dapat dikendalikan dari dashboard dan apakah mode remote sedang diperbolehkan?
4. Bagaimana kondisi flow, pressure, heater pump/auxiliary equipment, level penyimpanan air, dan parameter lain yang tersedia?
5. Apakah ada alarm aktif dan apa histori acknowledge/resolution-nya?
6. Apakah device/gateway dan sensor masih aktif mengirim data?
7. Bagaimana tren parameter dan performa pompa dalam periode tertentu?
8. Apakah admin/engineer dapat menambahkan ruangan, pompa, device, atau sensor baru tanpa perubahan kode frontend?
9. Apakah command ON/OFF tercatat, memiliki acknowledgement, timeout, dan audit trail yang jelas?

---

# 2. Background & Context

PT Ascon Multi Pratama menyediakan solusi electrical, engineering, automation, dan SCADA. Portofolio publik perusahaan mencakup proyek yang berhubungan dengan WTP, PLC, LCP, panel, instrument transmitter, automation, SCADA, VSD, serta data acquisition. Pada salah satu proyek air, PLC disebut digunakan untuk mengendalikan dan memonitor pompa distribusi, pressure, flow meter, level tangki, alarm, dan proteksi peralatan. citeturn324038search1turn324038search4

SWPMS dibangun untuk menambahkan kemampuan:

- Monitoring kondisi instalasi dari browser.
- Pengumpulan telemetry melalui MQTT.
- Historisasi data.
- Alarm dan event monitoring.
- Monitoring health perangkat/gateway.
- Dashboard multi-site/project.
- Dasar data untuk reporting, maintenance, dan pengembangan predictive maintenance di masa depan.

Sistem ini sebaiknya dapat digunakan pada satu proyek kecil terlebih dahulu dan tetap memiliki struktur yang dapat diperluas ke banyak site, banyak pump, banyak gateway, dan banyak customer/project.

---

# 3. Product Vision

> **Membangun platform monitoring pompa air yang real-time, reliable, ringan, dan siap dikembangkan menjadi platform IIoT/SCADA modern untuk kebutuhan operasional dan maintenance.**

Prinsip produk:

- **Real-time:** kondisi saat ini harus tersedia tanpa operator melakukan refresh manual.
- **Reliable:** kehilangan koneksi perangkat harus dapat dibedakan dari kondisi proses normal.
- **Traceable:** data historis dan perubahan alarm harus dapat ditelusuri.
- **Operational-first:** informasi penting harus terlihat dalam hitungan detik.
- **Lightweight:** MVP tidak membutuhkan arsitektur cloud yang berat.
- **Extensible:** desain data dan API harus dapat menampung jenis sensor/peralatan baru.
- **Safe-by-design:** sistem monitoring tidak mengambil alih fungsi kontrol/safety PLC.

---

# 4. Goals

## 4.1 Business Goals

1. Memberikan visibilitas terpusat terhadap kondisi sistem pompa.
2. Mengurangi kebutuhan inspeksi manual untuk status yang dapat dimonitor secara digital.
3. Mempercepat identifikasi fault dan abnormal condition.
4. Menyediakan histori untuk troubleshooting dan maintenance.
5. Menjadi fondasi pengembangan layanan monitoring/IIoT Ascon untuk berbagai proyek.

## 4.2 Product Goals

1. Dashboard menampilkan data real-time.
2. Perangkat yang offline dapat terdeteksi otomatis.
3. Alarm dapat dibuat berdasarkan threshold dan status.
4. Operator dapat acknowledge alarm.
5. Historis parameter dapat ditampilkan dalam chart.
6. User hanya melihat site/device yang memang menjadi hak aksesnya.
7. Sistem dapat menangani penambahan site/device tanpa perubahan besar pada frontend.

## 4.3 Technical Goals

- React + Vite untuk frontend.
- Fastify untuk REST API dan realtime gateway.
- MQTT sebagai transport telemetry.
- PostgreSQL untuk data konfigurasi, state, alarm, dan histori.
- Browser tidak terhubung langsung ke broker MQTT untuk MVP.
- Backend menjadi boundary keamanan MQTT.
- Tidak menggunakan message queue tambahan seperti Kafka/BullMQ/Redis pada MVP kecuali kebutuhan aktual memerlukannya.

---

# 5. Non-Goals / Out of Scope MVP

MVP mencakup monitoring dan command ON/OFF pompa, tetapi **bukan** pengganti PLC/SCADA control logic atau safety system. Yang tetap berada di sisi PLC/VFD/field control: interlock keselamatan, permissive, emergency stop, dry-run protection, overload protection, pressure protection, dan logic otomatis proses.

Di luar cakupan MVP:

- Closed-loop control/pid tuning dari web.
- Automatic scheduling start/stop berbasis cloud tanpa logic PLC.
- Predictive maintenance berbasis ML.
- Mobile native application.
- Public API untuk pihak ketiga.
- Multi-region cloud deployment.
- Advanced energy optimization.
- Computer vision.
- Digital twin 3D.
- Maintenance/CMMS workflow penuh.

MVP control harus bersifat **commanded ON/OFF**, bukan memaksakan kondisi pompa. Dashboard hanya mengirim permintaan command; PLC tetap menentukan apakah command aman dan boleh dieksekusi.

---

# 6. Product Scope

SWPMS terdiri dari komponen berikut:

| Modul | MVP | Future |
|---|---:|---:|
| Authentication | ✅ | SSO/OAuth |
| User & Role | ✅ | SSO/LDAP |
| Site/Project | ✅ | Multi-tenant customer hierarchy |
| Device/Gateway | ✅ | Device fleet management |
| Pump/Asset | ✅ | Asset lifecycle |
| Real-time Dashboard | ✅ | Advanced SCADA mimic |
| Telemetry | ✅ | High-resolution historian |
| Alarm | ✅ | Escalation workflow |
| Event Log | ✅ | Advanced event correlation |
| Trend/History | ✅ | Advanced analytics |
| Export CSV | ✅ | Scheduled report |
| Device Health | ✅ | Remote diagnostics |
| Maintenance | Basic | Full CMMS integration |
| Pump Control ON/OFF | ✅ | Advanced command scheduling/approval |
| Predictive Maintenance | ❌ | Phase 3 |
| Energy Analytics | Basic | Advanced |
| Mobile | ❌ | Phase 3 |

---

# 7. Target Users

## 7.1 Super Admin

Pemilik sistem/platform.

Akses:
- Semua site.
- Semua device.
- User management.
- Alarm rule.
- System configuration.
- Audit log.

## 7.2 Engineer

Digunakan oleh engineer Ascon untuk commissioning, troubleshooting, dan analisis.

Akses:
- Semua atau sebagian site sesuai assignment.
- Device detail.
- Telemetry/history.
- Alarm.
- Configuration teknis tertentu.

## 7.3 Operator

Fokus pada monitoring harian.

Akses:
- Dashboard.
- Status pompa.
- Alarm.
- Trend.
- Acknowledge alarm.

## 7.4 Viewer / Client

Akses read-only terhadap site/project tertentu.

Akses:
- Dashboard.
- Status.
- Trend.
- Report/export sesuai izin.

---

# 8. Core Terminology

| Istilah | Definisi |
|---|---|
| Organization | Entitas pemilik/tenant sistem jika nantinya multi-customer |
| Project | Kontrak/proyek implementasi |
| Site | Lokasi fisik plant/fasilitas |
| Area | Sub-area dalam site |
| Device | PLC, IoT gateway, RTU, controller, atau edge gateway yang mengirim MQTT |
| Asset | Objek operasional yang dimonitor, misalnya pump |
| Pump | Asset jenis pompa |
| Sensor | Sumber parameter seperti flow, pressure, level, temperature |
| Metric | Parameter telemetry yang dikirim device |
| Telemetry | Data pengukuran dari device |
| State | Kondisi terbaru sebuah device/asset |
| Alarm Rule | Definisi kondisi yang menyebabkan alarm |
| Alarm | Instance alarm yang terjadi |
| Event | Kejadian sistem/device yang bukan selalu alarm |
| Heartbeat | Pesan periodik untuk menyatakan device masih aktif |
| Gateway | Penghubung PLC/sensor ke MQTT |

---

# 9. High-Level Architecture

```text
+----------------------- FIELD / OT LAYER ------------------------+
|                                                                 |
|  Sensor       PLC        VFD        Flowmeter        Level      |
|    |           |          |            |              |         |
|    +-----------+----------+------------+--------------+         |
|                            |                                    |
|                       IoT Gateway                                |
|                            |                                    |
+----------------------------|------------------------------------+
                             |
                             | MQTT over TLS
                             v
+----------------------- DATA / IT LAYER --------------------------+
|                                                                 |
|                      MQTT Broker                                 |
|                  (Mosquitto / EMQX)                              |
|                            |                                    |
|                            v                                    |
|                     Fastify Backend                               |
|              +-------------+-------------+                       |
|              |                           |                       |
|        MQTT Ingestion                REST API                   |
|              |                           |                       |
|              v                           v                       |
|       Validation / Normalize      Auth / RBAC                   |
|              |                           |                       |
|              +-------------+-------------+                       |
|                            |                                    |
|                            v                                    |
|                       PostgreSQL                                 |
|                            |                                    |
|              +-------------+-------------+                       |
|              |                           |                       |
|          Current State              History                     |
|              |                           |                       |
|              +-------------+-------------+                       |
|                            |                                    |
|                         SSE                                   |
+----------------------------|------------------------------------+
                             |
                             v
+---------------------- WEB / PRESENTATION ------------------------+
|                    React + Vite                                 |
|                                                                 |
| Dashboard | Site | Pump | Alarm | Trend | Device | User/Admin  |
+-----------------------------------------------------------------+
```

## 9.1 Architectural Decision

### Browser → MQTT langsung: **Tidak**

Browser tidak diberi credential MQTT dan tidak boleh publish command langsung ke broker. Semua telemetry dan control command melewati Fastify sebagai application/security boundary.

Alasan:

- Mengurangi attack surface.
- ACL MQTT lebih sederhana.
- Backend dapat memvalidasi payload sebelum masuk UI.
- Frontend hanya membutuhkan HTTP + SSE.
- Pergantian broker tidak memaksa perubahan besar pada frontend.

### Fastify → Browser: SSE untuk MVP

SSE digunakan untuk server-to-client event:

- telemetry update;
- asset state update;
- alarm event;
- device online/offline;
- command accepted/sent/acknowledged/failed;
- system notification.

Aksi user tetap menggunakan REST. WebSocket belum diperlukan untuk MVP karena browser hanya mengirim command sesekali, bukan stream dua arah berfrekuensi tinggi.

---

# 10. System Data Flow

## 10.1 Normal Telemetry Flow

```text
PLC/Sensor
   ↓
Gateway
   ↓ MQTT publish
MQTT Broker
   ↓ subscribe
Fastify MQTT Service
   ↓ validate
Normalize
   ↓
Update Current State
   ↓
Persist Telemetry
   ↓
Evaluate Alarm Rules
   ↓
Publish Internal Event
   ↓
SSE Stream
   ↓
React Dashboard
```

## 10.2 Pump Control Command Flow

```text
Operator klik ON/OFF
        ↓
React POST /commands/power
        ↓
Fastify Auth + RBAC
        ↓
Check asset.control_enabled
        ↓
Check device online + command capability
        ↓
Create pump_commands = PENDING
        ↓
Publish MQTT command
        ↓
Gateway / PLC receives
        ↓
PLC safety/interlock validation
        ↓
Execute or Reject
        ↓
command_ack MQTT
        ↓
Fastify updates command status
        ↓
SSE → React
        ↓
UI shows SUCCESS / REJECTED / TIMEOUT
```

**Critical rule:** MQTT publish success hanya berarti broker menerima message. Itu **bukan** bukti bahwa pompa sudah menyala/mati. Bukti final harus berasal dari acknowledgement device/PLC dan/atau perubahan telemetry `pump_running`.

## 10.3 Offline Device Flow

```text
Device sends heartbeat
        ↓
Fastify receives message
        ↓
Update last_seen_at
        ↓
No heartbeat until offline_timeout
        ↓
Mark device OFFLINE
        ↓
Generate DEVICE_OFFLINE alarm/event
        ↓
SSE → dashboard
```

## 10.4 Alarm Flow

```text
Telemetry
   ↓
Normalize
   ↓
Alarm Rule Evaluation
   ↓
Condition TRUE?
   ├── No → nothing
   └── Yes
         ↓
      Open Alarm
         ↓
      SSE notification
         ↓
      Operator Acknowledge
         ↓
      Condition Normal?
         ├── No → ACTIVE
         └── Yes → RESOLVED
```

---

# 11. MQTT Architecture

## 11.1 Broker Recommendation

Untuk MVP, broker dapat menggunakan **Mosquitto** karena sederhana dan ringan. Jika kebutuhan berkembang menjadi banyak device, multi-user administration, advanced ACL, metrics, clustering, dan fleet management, EMQX dapat dipertimbangkan.

Backend harus tetap menggunakan abstraksi MQTT client sehingga broker tidak menjadi dependency bisnis.

## 11.2 MQTT Namespace

Gunakan namespace versioned:

```text
swpm/v1/{site_id}/{device_id}/{message_type}
```

Contoh:

```text
swpm/v1/site-bandung/gw-001/telemetry
swpm/v1/site-bandung/gw-001/status
swpm/v1/site-bandung/gw-001/event
swpm/v1/site-bandung/gw-001/command
swpm/v1/site-bandung/gw-001/command_ack
```

Untuk MVP monitoring, yang wajib:

- `telemetry`
- `status`
- `event`

`command` dan `command_ack` disiapkan untuk future control.

---

# 12. MQTT QoS & Retain Policy

| Message | QoS | Retain | Catatan |
|---|---:|---:|---|
| telemetry | 0 atau 1 | No | Pilih 1 jika telemetry wajib sampai |
| status | 1 | Yes | State terbaru harus tersedia |
| heartbeat | 1 | No | Dipakai untuk health |
| event | 1 | No | Event penting |
| command | 1 | No | Pump ON/OFF command |
| command_ack | 1 | No | Device/PLC acknowledgement |

Rekomendasi MVP:

- Telemetry: QoS 1 untuk parameter penting.
- Status: QoS 1 + retained.
- Gunakan timestamp device hanya sebagai metadata; server menerima `received_at` sebagai waktu penerimaan authoritative.

---

# 13. MQTT Payload Contract

## 13.1 Telemetry Payload

```json
{
  "version": 1,
  "device_id": "gw-001",
  "asset_id": "pump-01",
  "timestamp": "2026-10-03T07:10:31.123Z",
  "sequence": 18452,
  "metrics": {
    "pump_running": true,
    "pump_mode": "AUTO",
    "flow_m3h": 52.7,
    "pressure_bar": 4.15,
    "tank_level_pct": 71.2,
    "frequency_hz": 48.0,
    "current_a": 31.5,
    "voltage_v": 381.2,
    "power_kw": 18.7,
    "energy_kwh": 1248.42,
    "motor_temp_c": 47.2
  },
  "quality": "GOOD"
}
```

## 13.2 Status Payload

```json
{
  "version": 1,
  "device_id": "gw-001",
  "timestamp": "2026-10-03T07:10:31.123Z",
  "status": "ONLINE",
  "firmware": "1.0.4",
  "ip": "10.10.20.15",
  "rssi": -61,
  "uptime_s": 128442
}
```

## 13.3 Event Payload

```json
{
  "version": 1,
  "device_id": "gw-001",
  "asset_id": "pump-01",
  "timestamp": "2026-10-03T07:11:00.000Z",
  "event_code": "PUMP_FAULT",
  "severity": "CRITICAL",
  "message": "Pump fault detected",
  "metadata": {
    "fault_code": "F12"
  }
}
```

---

## 13.4 Command Payload

Topic:

```text
swpm/v1/{site_id}/{device_id}/command
```

Payload:

```json
{
  "version": 1,
  "command_id": "01JZ...",
  "issued_at": "2026-10-03T07:20:00.000Z",
  "issued_by": "user-001",
  "command": "PUMP_POWER",
  "asset_id": "pump-01",
  "desired_state": "ON",
  "timeout_seconds": 15,
  "reason": "Operator operation"
}
```

## 13.5 Command Acknowledgement Payload

Topic:

```text
swpm/v1/{site_id}/{device_id}/command_ack
```

Payload:

```json
{
  "version": 1,
  "command_id": "01JZ...",
  "timestamp": "2026-10-03T07:20:02.000Z",
  "asset_id": "pump-01",
  "status": "EXECUTED",
  "desired_state": "ON",
  "actual_state": "ON",
  "message": "Pump started"
}
```

Valid acknowledgement states:

```text
ACCEPTED
EXECUTED
REJECTED
FAILED
TIMEOUT
```

---

# 14. MQTT Validation Rules

Backend wajib melakukan validasi berikut sebelum data diproses:

1. Topic valid.
2. Site/device terdaftar.
3. Device mempunyai credential yang valid.
4. Payload JSON valid.
5. `version` didukung.
6. `device_id` pada payload sesuai topic.
7. `timestamp` valid.
8. `metrics` object valid.
9. Numeric metrics harus finite number.
10. Tidak menerima payload melebihi batas ukuran.
11. Invalid message dicatat pada ingestion error log.
12. Invalid message tidak boleh memengaruhi current state.

---

# 15. Device Identity

Setiap device harus memiliki:

```text
device_id
site_id
name
status
credential_id
last_seen_at
created_at
updated_at
```

Credential tidak disimpan dalam plaintext. Password/token MQTT disimpan hashed/encrypted sesuai mekanisme deployment.

Untuk skala lebih besar, gunakan client certificate (mTLS).

---

# 16. Device Connectivity State Machine

```text
UNKNOWN
   ↓ first message
ONLINE
   ↓ timeout
OFFLINE
   ↓ message received
ONLINE
```

State tidak hanya berasal dari payload `status`; backend harus dapat menentukan health berdasarkan `last_seen_at`.

Configurability:

```text
heartbeat_interval = 10s
offline_timeout = 30s
```

Nilai harus configurable per device/site bila diperlukan.

---

# 17. Monitoring Parameters

Parameter bersifat configurable per pump/site.

## 17.1 Pump Status

- Running / Stopped
- Auto / Manual
- Fault / Normal
- Local / Remote
- Start command status jika tersedia
- Runtime total

## 17.2 Control & Capability

Setiap pump dapat memiliki capability/configuration berbeda, misalnya:

```json
{
  "control_enabled": true,
  "commands": ["PUMP_POWER"],
  "remote_control_allowed": true,
  "requires_confirmation": true
}
```

Asset tanpa capability control tetap dapat dimonitor. Frontend tidak boleh menampilkan tombol control hanya berdasarkan `asset_type=PUMP`; tombol harus berdasarkan capability yang dikembalikan backend.

## 17.3 Hydraulic

- Flow rate
- Pressure
- Suction pressure
- Discharge pressure
- Tank/reservoir level
- Valve status jika tersedia

## 17.4 Electrical

- Voltage
- Current
- Power factor
- Active power (kW)
- Apparent power (kVA)
- Frequency
- Energy (kWh)

## 17.5 Motor / Equipment

- Motor temperature
- Bearing temperature
- Vibration
- RPM
- VFD frequency
- VFD fault code

## 17.6 System Health

- Gateway online/offline
- MQTT connected/disconnected
- PLC connected/disconnected
- Last telemetry
- Signal quality
- Gateway uptime

Tidak semua parameter wajib ada di setiap device. Frontend harus membaca metric definition dari backend sehingga komponen dapat bersifat dinamis.

---

# 18. Metric Definition

Setiap metric memiliki metadata:

```json
{
  "code": "pressure_bar",
  "label": "Pressure",
  "unit": "bar",
  "data_type": "number",
  "category": "HYDRAULIC",
  "min_value": 0,
  "max_value": 10,
  "decimal_places": 2,
  "chartable": true,
  "display_order": 2
}
```

Kategori:

- STATUS
- HYDRAULIC
- ELECTRICAL
- MOTOR
- DEVICE
- ENERGY
- OTHER

---

# 19. Functional Requirements

## FR-001 Authentication

User dapat login menggunakan username/email dan password.

Acceptance criteria:

- Credential valid → login berhasil.
- Credential invalid → generic error.
- Token/session memiliki expiration.
- User nonaktif tidak dapat login.
- Logout mengakhiri session/token sesuai mekanisme yang dipilih.

## FR-002 Role-Based Access Control

Sistem menerapkan RBAC.

Permissions minimal:

```text
dashboard.view
site.view
site.manage
device.view
device.manage
asset.view
telemetry.view
alarm.view
alarm.ack
alarm.manage
report.view
report.export
user.view
user.manage
audit.view
pump.control
command.view
command.manage
sensor.manage
area.manage
system.manage
```

## FR-003 Site Management

Admin dapat membuat dan mengubah:

- Site code
- Site name
- Customer/project
- Address
- Timezone
- Status

## FR-004 Device Management

Admin/Engineer dapat:

- Register device.
- Assign device ke site.
- Assign gateway ke area.
- Melihat connectivity.
- Melihat last seen.
- Melihat firmware.
- Enable/disable device.

## FR-005 Asset/Pump Management

Admin/Engineer dapat membuat dan mengubah asset/pump secara dinamis:

- Asset code
- Name
- Asset type/subtype
- Site
- Area/room
- Device/gateway source
- Manufacturer
- Model
- Serial number
- Rated power
- Rated flow
- Rated pressure
- VFD information
- Capabilities
- Control enabled/disabled

Jumlah pompa tidak boleh di-hardcode menjadi 6 pada frontend/backend business logic. Enam pompa pertama hanya merupakan seed data deployment awal.

## FR-006 Dynamic Topology & Configuration

Admin/Engineer harus dapat menambah, mengubah, menonaktifkan, dan memindahkan konfigurasi berikut tanpa perubahan source code frontend:

- Site.
- Area/room.
- Device/gateway.
- Asset/pump.
- Sensor instance.
- Sensor binding ke pump atau area/room.
- Metric definition.
- Alarm rule.
- Capability control.

Rules:

1. Enam pump dan tiga room pada deployment awal hanya seed/configuration awal.
2. Frontend merender berdasarkan topology/configuration dari API.
3. Sensor baru dapat di-bind ke pump atau area/room.
4. Metric baru tidak memerlukan komponen React baru selama tipe datanya sudah didukung.
5. Perubahan binding sensor tidak menghapus histori telemetry lama.
6. Tambahan room/pump/device/sensor tidak membutuhkan redeploy frontend selama backend contract tetap kompatibel.

## FR-007 Real-Time Dashboard

Dashboard harus menampilkan:

- Total site
- Online/offline device
- Total pump
- Running pump
- Stopped pump
- Fault pump
- Active alarm
- Latest event
- KPI proses utama

## FR-008 Site Overview

Halaman site menampilkan:

- Site metadata.
- Connectivity summary.
- Pump cards.
- Alarm summary.
- Process KPI.
- Realtime trend.

## FR-009 Pump Detail

Halaman pump harus menampilkan:

- Current state.
- Main metrics.
- Status.
- Current alarm.
- Latest update.
- Trend 1h / 6h / 24h / custom.
- Event history.
- Runtime.

## FR-010 Pump ON/OFF Control

Operator/Engineer dengan permission `pump.control` dapat:

- Menyalakan pump (`ON`).
- Mematikan pump (`OFF`).
- Melihat mode/control availability.
- Melihat command status.
- Melihat siapa yang mengirim command dan kapan.

UI wajib meminta confirmation sebelum command dijalankan.

Backend wajib memeriksa:

1. User memiliki permission `pump.control`.
2. Asset adalah commandable.
3. Device source aktif/online atau policy mengizinkan queue.
4. Tidak ada maintenance lock yang aktif.
5. Command type didukung device.
6. Command idempotency key unik.

Safety interlock dan permissive tetap dieksekusi oleh PLC. Dashboard tidak boleh bypass interlock.

## FR-011 Alarm

Alarm rule dapat dibuat berdasarkan:

- `>` threshold
- `<` threshold
- `>=`
- `<=`
- `==`
- `!=`
- status equals
- status changes
- no telemetry
- device offline

## FR-012 Alarm Lifecycle

State:

```text
OPEN
ACKNOWLEDGED
RESOLVED
```

Contoh:

```text
OPEN → ACKNOWLEDGED → RESOLVED
OPEN → RESOLVED
```

Alarm tidak boleh dibuat berulang setiap telemetry jika condition tetap TRUE. Gunakan deduplication berdasarkan `alarm_rule_id + asset_id`.

## FR-013 Alarm Acknowledge

Operator dapat acknowledge alarm.

Disimpan:

- user
- timestamp
- optional note

## FR-014 Event Log

Sistem menyimpan:

- Device online/offline
- Pump state change
- Fault
- Alarm opened
- Alarm acknowledged
- Alarm resolved
- Configuration changes
- Login/security events

## FR-015 Historical Telemetry

User dapat memilih:

- Period.
- Metric.
- Asset.
- Granularity.

Default period:

- 1 hour
- 6 hours
- 24 hours
- 7 days
- custom

## FR-016 Export

User dengan permission `report.export` dapat mengunduh telemetry/event/alarm dalam CSV.

## FR-017 Audit Log

Perubahan berikut harus diaudit:

- user create/update/disable
- role change
- device registration
- alarm rule change
- site/asset update
- acknowledge alarm
- system config change

---

# 20. Dynamic Configuration Model

Frontend harus bersifat **configuration-driven**, bukan hardcoded per jumlah pump.

Contoh konfigurasi response:

```json
{
  "site": {"id":"site-01","name":"WTP A"},
  "areas": [
    {
      "id":"room-01",
      "name":"Room 01",
      "assets":[
        {
          "id":"pump-01",
          "name":"Pump 01",
          "type":"PUMP",
          "capabilities":{"control_enabled":true,"power_command":true},
          "sensors":[
            {"code":"flow_m3h","label":"Flow","value":52.7,"unit":"m³/h"},
            {"code":"pressure_bar","label":"Pressure","value":4.15,"unit":"bar"}
          ]
        }
      ],
      "area_sensors":[
        {"code":"tank_level_pct","label":"Water Level","value":71.2,"unit":"%"}
      ]
    }
  ]
}
```

Frontend renderer mengambil `areas`, `assets`, `sensors`, dan `capabilities` dari API. Penambahan room/pump/sensor baru harus otomatis muncul pada dashboard setelah konfigurasi selesai dan device mulai mengirim telemetry.

## 20.1 Initial Deployment Topology

Baseline deployment:

```text
Site
├── Room / Area 01
│   ├── Pump 01
│   └── Pump 02
├── Room / Area 02
│   ├── Pump 03
│   └── Pump 04
└── Room / Area 03
    ├── Pump 05
    └── Pump 06
```

Contoh sensor awal per pump:

```text
Pump
├── Running/Stopped status
├── Flow meter
├── Pressure sensor
├── Heater pump / auxiliary equipment status (jika tersedia)
└── Electrical metrics (jika tersedia dari VFD/panel)
```

Future sensor tanpa perubahan arsitektur:

```text
Temperature Sensor → Pump / Room
Distance Sensor → Tank / Room
Level Sensor → Tank / Room
Vibration Sensor → Pump
```

# 21. Dashboard Information Architecture

Recommended navigation:

```text
Dashboard
├── Overview
├── Sites
│   └── Site Detail
│       ├── Overview
│       ├── Pumps
│       ├── Trends
│       ├── Alarms
│       └── Events
├── Alarms
├── Trends
├── Devices
├── Reports
└── Administration
    ├── Sites
    ├── Assets
    ├── Devices
    ├── Alarm Rules
    ├── Users
    └── Audit Log
```

---

# 21. Dashboard UI Requirements

## 21.1 Global Header

Menampilkan:

- Current selected site/project.
- Connection indicator dashboard → backend.
- Current user.
- Notification/alarm count.
- Last synchronization status.

## 21.2 KPI Cards

Minimal:

```text
Sites       Devices      Pumps      Running      Fault      Alarms
  4            12          18          9           1          3
```

Angka harus clickable menuju halaman relevan.

## 21.3 Pump Status Grid

Setiap pump card minimal:

```text
Pump P-01
RUNNING                 ●
Flow          52.7 m³/h
Pressure       4.15 bar
Water Level    71.2 %
Power         18.7 kW
Updated       2 sec ago

[ Turn ON ] [ Turn OFF ]
Control: REMOTE / AVAILABLE
```

Tombol ON/OFF hanya muncul jika capability dan permission tersedia. Saat command berjalan, UI menampilkan state `COMMANDING` dan tidak boleh menganggap command berhasil sebelum actual state terkonfirmasi.

Status visual:

- Running
- Stopped
- Fault
- Offline
- Maintenance
- Commanding
- Unknown/Stale

## 21.4 Alarm Panel

Prioritaskan:

1. Critical
2. High
3. Medium
4. Low

Panel harus menampilkan:

```text
[CRITICAL] Pump P-03 Fault
Site: WTP A
Started: 13:42:21
Duration: 03m 11s
[ Acknowledge ]
```

## 21.5 Trend Chart

Chart minimal:

- Flow
- Pressure
- Level
- Power
- Current
- Frequency

User dapat toggle metric.

---

# 22. Device Health Dashboard

Device table:

| Device | Site | Status | Last Seen | Firmware | Signal |
|---|---|---|---|---|---|
| GW-001 | Site A | Online | 2 sec | 1.0.4 | -61 dBm |
| GW-002 | Site A | Offline | 4 min | 1.0.3 | - |

Status calculation:

```text
ONLINE  = now - last_seen <= online_threshold
STALE   = online_threshold < now - last_seen <= offline_threshold
OFFLINE = now - last_seen > offline_threshold
```

`STALE` bersifat opsional tetapi sangat berguna untuk membedakan network delay dari device benar-benar offline.

---

# 23. Alarm Engine Design

## 23.1 Alarm Rule

Contoh:

```json
{
  "code": "PUMP01_HIGH_PRESSURE",
  "asset_id": "pump-01",
  "metric_code": "pressure_bar",
  "operator": ">",
  "threshold": 5.5,
  "severity": "HIGH",
  "delay_seconds": 5,
  "cooldown_seconds": 60,
  "enabled": true
}
```

## 23.2 Anti-Flicker

Agar alarm tidak membuka/menutup terlalu cepat:

- `delay_seconds`: condition harus true selama X detik sebelum OPEN.
- `recovery_seconds`: condition harus normal selama X detik sebelum RESOLVED.
- `cooldown_seconds`: mencegah reopen berulang dalam waktu singkat.

## 23.3 Severity

```text
INFO
LOW
MEDIUM
HIGH
CRITICAL
```

Severity adalah konfigurasi operasional, bukan penilaian keamanan; threshold harus ditentukan berdasarkan engineering/project requirement.

## 23.4 Suggested Default Alarm Rules

- Device offline.
- No telemetry.
- Pump fault.
- High pressure.
- Low pressure.
- Low tank level.
- High tank level.
- High motor temperature.
- Overcurrent.
- Undervoltage.
- VFD fault.
- Flow below minimum.

Nilai threshold tidak boleh di-hardcode di frontend.

---

# 24. Database Design

PostgreSQL digunakan sebagai relational system of record.

## 24.1 Core Tables

```text
organizations
projects
sites
areas
users
roles
permissions
user_roles
role_permissions

mqtt_devices
device_credentials
assets
asset_metrics
metric_definitions
sensors
sensor_bindings
pump_commands

telemetry_samples
asset_current_state
device_current_state

alarm_rules
alarms
alarm_history

events
audit_logs
```

## 24.2 organizations

```sql
id UUID PK
code VARCHAR UNIQUE
name VARCHAR
status VARCHAR
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## 24.3 projects

```sql
id UUID PK
organization_id UUID FK
code VARCHAR
name VARCHAR
description TEXT
status VARCHAR
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## 24.4 sites

```sql
id UUID PK
project_id UUID FK
code VARCHAR
name VARCHAR
address TEXT
timezone VARCHAR
status VARCHAR
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## 24.5 areas

```sql
id UUID PK
site_id UUID FK
code VARCHAR
name VARCHAR
description TEXT
```

## 24.6 mqtt_devices

```sql
id UUID PK
site_id UUID FK
area_id UUID FK NULL
code VARCHAR UNIQUE
name VARCHAR
device_type VARCHAR
status VARCHAR
last_seen_at TIMESTAMPTZ NULL
last_status_at TIMESTAMPTZ NULL
firmware_version VARCHAR NULL
config JSONB DEFAULT '{}'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## 24.7 assets

```sql
id UUID PK
site_id UUID FK
area_id UUID FK NULL
device_id UUID FK NULL
code VARCHAR
name VARCHAR
asset_type VARCHAR
status VARCHAR
metadata JSONB DEFAULT '{}'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

`asset_type` MVP:

```text
PUMP
TANK
VALVE
MOTOR
SENSOR_DEVICE
OTHER
```

Gunakan `asset_subtype` untuk variasi seperti:

```text
MAIN_PUMP
TRANSFER_PUMP
HEATER_PUMP
AUXILIARY_PUMP
BOOSTER_PUMP
```

## 24.8 metric_definitions

```sql
id UUID PK
code VARCHAR UNIQUE
label VARCHAR
unit VARCHAR NULL
data_type VARCHAR
category VARCHAR
min_value NUMERIC NULL
max_value NUMERIC NULL
decimal_places INTEGER DEFAULT 2
chartable BOOLEAN DEFAULT true
config JSONB DEFAULT '{}'
```

## 24.9 asset_metrics

```sql
id UUID PK
asset_id UUID FK
metric_id UUID FK
source_key VARCHAR
enabled BOOLEAN DEFAULT true
alarm_enabled BOOLEAN DEFAULT false
metadata JSONB DEFAULT '{}'
UNIQUE(asset_id, metric_id)
```

## 24.10 sensors

Physical/logical sensor instance yang dapat ditempatkan pada pump atau area/room.

```sql
id UUID PK
site_id UUID FK
device_id UUID FK NULL
code VARCHAR UNIQUE
name VARCHAR
sensor_type VARCHAR
metric_code VARCHAR
status VARCHAR
unit VARCHAR NULL
config JSONB DEFAULT '{}'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Contoh `sensor_type`:

```text
FLOW_METER
PRESSURE_SENSOR
TEMPERATURE_SENSOR
DISTANCE_SENSOR
LEVEL_SENSOR
CURRENT_SENSOR
VIBRATION_SENSOR
OTHER
```

## 24.11 sensor_bindings

Binding fleksibel antara sensor dengan area/room atau asset/pump. Tepat satu target aktif harus terisi.

```sql
id UUID PK
sensor_id UUID FK
area_id UUID FK NULL
asset_id UUID FK NULL
role VARCHAR NULL
active BOOLEAN DEFAULT true
effective_from TIMESTAMPTZ
effective_to TIMESTAMPTZ NULL
CHECK ((area_id IS NOT NULL) <> (asset_id IS NOT NULL))
```

Contoh:

- Pressure sensor P-01 → asset pump-01
- Flow meter FM-01 → asset pump-01
- Temperature sensor T-ROOM-01 → area room-01
- Distance sensor LEVEL-01 → tank/area yang relevan

Dengan pola ini, penambahan sensor cukup membuat record sensor + binding + metric mapping; frontend membaca konfigurasi dari API.

## 24.12 pump_commands

```sql
id UUID PK
command_id VARCHAR UNIQUE
site_id UUID FK
device_id UUID FK
asset_id UUID FK
command_type VARCHAR
desired_state VARCHAR
status VARCHAR
requested_by UUID FK
requested_at TIMESTAMPTZ
sent_at TIMESTAMPTZ NULL
acknowledged_at TIMESTAMPTZ NULL
completed_at TIMESTAMPTZ NULL
timeout_at TIMESTAMPTZ NULL
response_message TEXT NULL
metadata JSONB DEFAULT '{}'
```

## 24.14 telemetry_samples

Recommended MVP raw structure:

```sql
id BIGSERIAL PK
site_id UUID NOT NULL
source_device_id UUID NOT NULL
sensor_id UUID NULL
asset_id UUID NULL
device_timestamp TIMESTAMPTZ NULL
received_at TIMESTAMPTZ NOT NULL
sequence BIGINT NULL
quality VARCHAR NULL
payload JSONB NOT NULL
```

Indexes:

```sql
INDEX(site_id, received_at DESC)
INDEX(source_device_id, received_at DESC)
INDEX(asset_id, received_at DESC)
```

Untuk high-volume deployment, tabel ini dapat dipartisi berdasarkan tanggal atau dipindahkan ke TimescaleDB/telemetry storage tanpa mengubah contract MQTT.

## 24.15 asset_current_state

```sql
asset_id UUID PK
last_timestamp TIMESTAMPTZ
status VARCHAR
metrics JSONB
quality VARCHAR
control_enabled BOOLEAN DEFAULT false
commandable BOOLEAN DEFAULT false
desired_state VARCHAR NULL
updated_at TIMESTAMPTZ
```

Tujuan tabel ini adalah membuat dashboard tidak perlu mencari row histori hanya untuk mendapatkan nilai terbaru.

## 24.16 device_current_state

```sql
device_id UUID PK
status VARCHAR
last_seen_at TIMESTAMPTZ
last_telemetry_at TIMESTAMPTZ
last_status_at TIMESTAMPTZ
metadata JSONB
updated_at TIMESTAMPTZ
```

## 24.17 alarm_rules

```sql
id UUID PK
code VARCHAR UNIQUE
site_id UUID FK NULL
asset_id UUID FK NULL
metric_code VARCHAR NULL
rule_type VARCHAR
operator VARCHAR NULL
threshold NUMERIC NULL
secondary_threshold NUMERIC NULL
severity VARCHAR
delay_seconds INTEGER DEFAULT 0
recovery_seconds INTEGER DEFAULT 0
cooldown_seconds INTEGER DEFAULT 0
enabled BOOLEAN DEFAULT true
config JSONB DEFAULT '{}'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## 24.18 alarms

```sql
id UUID PK
rule_id UUID FK
site_id UUID FK
asset_id UUID FK NULL
device_id UUID FK NULL
status VARCHAR
severity VARCHAR
opened_at TIMESTAMPTZ
acknowledged_at TIMESTAMPTZ NULL
acknowledged_by UUID NULL
resolved_at TIMESTAMPTZ NULL
resolved_reason VARCHAR NULL
last_value NUMERIC NULL
message TEXT
metadata JSONB DEFAULT '{}'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## 24.19 events

```sql
id BIGSERIAL PK
site_id UUID
asset_id UUID NULL
device_id UUID NULL
event_type VARCHAR
event_code VARCHAR
severity VARCHAR NULL
message TEXT
occurred_at TIMESTAMPTZ
metadata JSONB
created_at TIMESTAMPTZ
```

## 24.20 audit_logs

```sql
id BIGSERIAL PK
user_id UUID NULL
action VARCHAR
entity_type VARCHAR
entity_id UUID NULL
old_value JSONB NULL
new_value JSONB NULL
ip_address INET NULL
user_agent TEXT NULL
created_at TIMESTAMPTZ
```

---

# 25. Data Retention Strategy

Recommended MVP:

| Data | Retention |
|---|---:|
| Current state | Permanent while asset exists |
| Raw telemetry | 30–90 days |
| Alarm | 1–2 years |
| Event | 1 year |
| Audit log | 1–2 years |
| Aggregated daily/hourly | 1–3 years |

Untuk deployment pertama, mulai dari 30 hari raw telemetry + aggregation agar database tetap kecil.

---

# 26. Telemetry Storage Strategy

Jangan gunakan histori untuk dashboard current state.

Pattern:

```text
MQTT telemetry
     ↓
telemetry_samples   ← historical/raw
     ↓
aggregation job     ← optional MVP cron
     ↓
telemetry_hourly
telemetry_daily
```

Dashboard:

```text
Last 1–24h     → raw
1–30 days      → hourly aggregate
>30 days       → daily aggregate
```

Untuk MVP, aggregation dapat dijalankan dengan scheduled job sederhana. Tidak perlu BullMQ/Redis.

---

# 27. REST API Design

Base path:

```text
/api/v1
```

Gunakan JSON response standar.

## 27.1 Standard Response

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Site not found"
  }
}
```

---

# 28. Authentication API

```http
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/refresh
```

Login request:

```json
{
  "email": "operator@company.com",
  "password": "********"
}
```

---

# 29. Dashboard APIs

```http
GET /api/v1/dashboard/summary
GET /api/v1/sites/:siteId/summary
GET /api/v1/sites/:siteId/assets/overview
GET /api/v1/sites/:siteId/alarms/summary
GET /api/v1/sites/:siteId/events/recent
```

Dashboard summary response:

```json
{
  "sites": 4,
  "devices": {
    "total": 12,
    "online": 10,
    "offline": 2
  },
  "pumps": {
    "total": 18,
    "running": 9,
    "stopped": 8,
    "fault": 1
  },
  "alarms": {
    "active": 3,
    "critical": 1,
    "high": 1,
    "medium": 1
  }
}
```

---

# 30. Site API

```http
GET    /api/v1/sites
POST   /api/v1/sites
GET    /api/v1/sites/:id
PATCH  /api/v1/sites/:id
DELETE /api/v1/sites/:id
```

---

# 31. Device API

```http
GET    /api/v1/devices
POST   /api/v1/devices
GET    /api/v1/devices/:id
PATCH  /api/v1/devices/:id
DELETE /api/v1/devices/:id
GET    /api/v1/devices/:id/health
GET    /api/v1/devices/:id/events
```

---

# 32. Asset/Pump API

```http
GET    /api/v1/assets
POST   /api/v1/assets
GET    /api/v1/assets/:id
PATCH  /api/v1/assets/:id
DELETE /api/v1/assets/:id
GET    /api/v1/assets/:id/state
GET    /api/v1/assets/:id/events
```

---

# 33. Sensor & Dynamic Topology API

```http
GET    /api/v1/areas
POST   /api/v1/areas
GET    /api/v1/areas/:id
PATCH  /api/v1/areas/:id
DELETE /api/v1/areas/:id

GET    /api/v1/sensors
POST   /api/v1/sensors
GET    /api/v1/sensors/:id
PATCH  /api/v1/sensors/:id
DELETE /api/v1/sensors/:id

GET    /api/v1/sensors/:id/binding
PUT    /api/v1/sensors/:id/binding
DELETE /api/v1/sensors/:id/binding

GET    /api/v1/assets/:id/sensors
GET    /api/v1/areas/:id/sensors

GET    /api/v1/metrics
POST   /api/v1/metrics
PATCH  /api/v1/metrics/:id
```

Binding request ke pump:

```json
{
  "asset_id": "pump-01",
  "role": "DISCHARGE_PRESSURE",
  "effective_from": "2026-10-03T07:00:00Z"
}
```

Binding request ke room/area:

```json
{
  "area_id": "room-01",
  "role": "WATER_LEVEL",
  "effective_from": "2026-10-03T07:00:00Z"
}
```

Backend menolak binding bila `asset_id` dan `area_id` sama-sama diisi atau sama-sama kosong.

# 34. Pump Control API

```http
GET  /api/v1/assets/:id/control
POST /api/v1/assets/:id/commands/power
GET  /api/v1/assets/:id/commands
GET  /api/v1/commands/:commandId
```

Request:

```json
{
  "desired_state": "ON",
  "confirmation": true,
  "idempotency_key": "client-generated-uuid",
  "note": "Start pump for operation"
}
```

Response initial:

```json
{
  "command_id": "cmd-123",
  "status": "PENDING",
  "desired_state": "ON"
}
```

Semantics:

```text
PENDING
  ↓
SENT
  ↓
ACCEPTED
  ↓
EXECUTED
```
Alternative terminal states:

```text
REJECTED / FAILED / TIMEOUT / CANCELLED
```

UI hanya menampilkan `RUNNING` setelah actual state dari telemetry/status juga menunjukkan running; bukan hanya karena command response sukses dikirim.

# 35. Telemetry API

```http
GET /api/v1/assets/:id/telemetry
GET /api/v1/sites/:siteId/telemetry
```

Query parameters:

```text
from=2026-10-03T00:00:00Z
to=2026-10-03T12:00:00Z
metrics=flow_m3h,pressure_bar,power_kw
granularity=auto|raw|5m|1h|1d
```

Response:

```json
{
  "asset_id": "pump-01",
  "metrics": [
    {
      "code": "flow_m3h",
      "unit": "m3/h",
      "points": [
        ["2026-10-03T07:00:00Z", 52.1],
        ["2026-10-03T07:05:00Z", 52.7]
      ]
    }
  ]
}
```

---

# 36. Alarm API

```http
GET  /api/v1/alarms
GET  /api/v1/alarms/:id
POST /api/v1/alarms/:id/acknowledge
POST /api/v1/alarms/:id/resolve
```

Acknowledge:

```json
{
  "note": "Operator sudah melakukan pengecekan panel."
}
```

---

# 37. Alarm Rule API

```http
GET    /api/v1/alarm-rules
POST   /api/v1/alarm-rules
GET    /api/v1/alarm-rules/:id
PATCH  /api/v1/alarm-rules/:id
DELETE /api/v1/alarm-rules/:id
POST   /api/v1/alarm-rules/:id/enable
POST   /api/v1/alarm-rules/:id/disable
```

---

# 38. Report API

```http
GET /api/v1/reports/telemetry.csv
GET /api/v1/reports/alarms.csv
GET /api/v1/reports/events.csv
```

Untuk export besar, response sebaiknya streaming agar memory backend tidak melonjak.

---

# 39. Realtime SSE Contract

Endpoint:

```http
GET /api/v1/realtime/stream
```

Authentication menggunakan session/cookie atau bearer token sesuai mekanisme frontend.

Event types:

```text
telemetry.update
asset.state
asset.status
alarm.created
alarm.updated
device.status
event.created
system.notification
```

Example:

```text
event: telemetry.update
data: {"asset_id":"pump-01","metrics":{"flow_m3h":52.7,"pressure_bar":4.15},"timestamp":"2026-10-03T07:10:31.123Z"}
```

Frontend harus melakukan reconnect otomatis.

Backoff:

```text
1s → 2s → 5s → 10s → 30s → 60s max
```

---

# 40. Realtime Consistency Rules

Realtime data tidak boleh menjadi satu-satunya source of truth.

Flow saat membuka halaman:

```text
1. GET current state
2. Render initial UI
3. Connect SSE
4. Apply realtime events
5. Periodically reconcile current state
```

Periodic reconciliation:

```text
setiap 1–5 menit
```

Tujuan: jika event SSE terlewat, UI tetap kembali konsisten dengan backend.

---

# 41. Frontend Architecture

Recommended structure:

```text
src/
├── app/
│   ├── router.tsx
│   ├── providers/
│   └── store/
│
├── pages/
│   ├── login/
│   ├── dashboard/
│   ├── sites/
│   ├── devices/
│   ├── alarms/
│   ├── trends/
│   ├── reports/
│   └── administration/
│
├── components/
│   ├── dashboard/
│   ├── pump/
│   ├── alarm/
│   ├── charts/
│   ├── device/
│   ├── layout/
│   └── common/
│
├── services/
│   ├── api/
│   ├── auth/
│   └── realtime/
│
├── hooks/
├── types/
├── utils/
├── constants/
└── assets/
```

State management dapat menggunakan React Query/TanStack Query untuk server state dan state store sederhana untuk UI state. Jangan menyimpan seluruh telemetry history ke global store.

---

# 42. Frontend State Separation

## Server State

- sites
- devices
- assets
- current state
- alarms
- historical telemetry
- users

→ Query/cache layer.

## Realtime State

- incoming SSE event
- latest metric update
- connection state

→ dedicated realtime context/hook.

## UI State

- selected site
- selected pump
- chart range
- filters
- modal state

→ local state/store.

---

# 43. Backend Architecture

Recommended structure:

```text
src/
├── app.ts
├── server.ts
│
├── config/
│   ├── env.ts
│   └── constants.ts
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── projects/
│   ├── sites/
│   ├── areas/
│   ├── devices/
│   ├── assets/
│   ├── metrics/
│   ├── telemetry/
│   ├── alarms/
│   ├── events/
│   ├── reports/
│   └── audit/
│
├── infrastructure/
│   ├── db/
│   ├── mqtt/
│   ├── realtime/
│   └── logger/
│
├── plugins/
│   ├── auth.ts
│   ├── db.ts
│   └── mqtt.ts
│
├── shared/
│   ├── errors/
│   ├── schemas/
│   ├── types/
│   └── utils/
│
└── jobs/
    ├── telemetry-aggregation.ts
    └── device-health.ts
```

---

# 44. Backend Layering

Setiap module mengikuti pola:

```text
Route
 ↓
Controller/Handler
 ↓
Service
 ↓
Repository
 ↓
Database
```

MQTT:

```text
MQTT Handler
 ↓
Payload Validator
 ↓
Telemetry Service
 ↓
State Service
 ↓
Alarm Service
 ↓
Repository
```

Jangan memasukkan business logic alarm ke MQTT callback secara langsung. Pisahkan agar dapat dites tanpa broker.

---

# 45. MQTT Service Responsibilities

MQTT module bertanggung jawab terhadap:

- Connect broker.
- Subscribe topic.
- Handle reconnect.
- Handle incoming message.
- Parse topic.
- Validate payload.
- Dispatch event.
- Publish command dan handle command acknowledgement.
- Log connection state.

Contoh pseudo-flow:

```ts
onMessage(topic, payload) {
  const message = parseTopicAndPayload(topic, payload);

  if (!message.valid) {
    logger.warn({ topic }, 'Invalid MQTT message');
    return;
  }

  switch (message.type) {
    case 'telemetry':
      return telemetryService.ingest(message);
    case 'status':
      return deviceService.updateStatus(message);
    case 'event':
      return eventService.ingest(message);
    case 'command_ack':
      return commandService.handleAck(message);
  }
}
```

---

# 46. Telemetry Ingestion Service

Tahapan:

```text
Receive
 ↓
Authenticate source
 ↓
Validate schema
 ↓
Resolve device
 ↓
Resolve asset
 ↓
Normalize timestamp
 ↓
Persist raw telemetry
 ↓
Update current state
 ↓
Evaluate alarms
 ↓
Emit realtime event
```

Critical rule: kegagalan SSE tidak boleh membuat telemetry gagal disimpan.

---

# 47. Pump Command Service

`commandService` menangani seluruh lifecycle command ON/OFF dari user hingga actual state.

```text
validate request
→ authorize user
→ resolve pump/device
→ check command capability
→ check device health / remote-control availability
→ persist PENDING
→ publish MQTT command
→ mark SENT
→ receive command_ack
→ update ACCEPTED / EXECUTED / REJECTED / FAILED
→ verify actual pump state from telemetry/status
→ emit SSE command.updated
```

Rules:

- Publish MQTT sukses ≠ pump sudah ON/OFF.
- Command harus memiliki `command_id` dan idempotency key.
- Hanya satu command power aktif per pump pada satu waktu.
- Command yang tidak mendapatkan acknowledgement sampai `timeout_at` menjadi `TIMEOUT`.
- Command yang ditolak PLC harus menampilkan alasan jika tersedia.
- Actual state menjadi sumber kebenaran untuk status RUNNING/STOPPED.
- Semua command tersimpan di `pump_commands` dan diaudit.

# 48. Error Handling

Kategori error:

```text
MQTT_CONNECTION_ERROR
MQTT_AUTH_ERROR
MQTT_PARSE_ERROR
MQTT_SCHEMA_ERROR
DEVICE_NOT_REGISTERED
ASSET_NOT_REGISTERED
DB_ERROR
ALARM_ENGINE_ERROR
SSE_DELIVERY_ERROR
AUTH_ERROR
```

Telemetry ingestion harus memiliki isolation sehingga satu payload invalid tidak menghentikan subscriber MQTT.

---

# 49. Authentication & Security

## Browser/API

Recommended:

- HTTPS only.
- Password hashing dengan Argon2id/bcrypt.
- Short-lived access token.
- Refresh token bila diperlukan.
- Secure, HttpOnly cookie lebih disukai jika deployment memungkinkan.
- CSRF protection jika menggunakan cookie auth.
- Rate limit login.

## MQTT

- MQTT over TLS.
- Unique credential per gateway.
- ACL berdasarkan site/device.
- Jangan menggunakan anonymous MQTT.
- Jangan expose broker ke internet tanpa alasan operasional.

## Database

- Database tidak public.
- Dedicated application DB user.
- Least privilege.
- Backup rutin.

---

# 50. Role Permission Matrix

| Capability | Super Admin | Engineer | Operator | Viewer |
|---|---:|---:|---:|---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Site view | ✅ | ✅ | ✅ | ✅ |
| Site manage | ✅ | ✅ | ❌ | ❌ |
| Device view | ✅ | ✅ | ✅ | ✅ |
| Device manage | ✅ | ✅ | ❌ | ❌ |
| Pump view | ✅ | ✅ | ✅ | ✅ |
| Telemetry | ✅ | ✅ | ✅ | ✅ |
| Alarm view | ✅ | ✅ | ✅ | ✅ |
| Alarm acknowledge | ✅ | ✅ | ✅ | ❌ |
| Alarm rule manage | ✅ | ✅ | ❌ | ❌ |
| Sensor/Area manage | ✅ | ✅ | ❌ | ❌ |
| Pump control ON/OFF | ✅ | ✅ | ✅* | ❌ |
| Command history | ✅ | ✅ | ✅ | ✅ |
| Export | ✅ | ✅ | ✅ | optional |
| User manage | ✅ | ❌ | ❌ | ❌ |
| Audit log | ✅ | optional | ❌ | ❌ |

`✅*` berarti hanya pump yang berada dalam scope site/area dan capability control-nya aktif.

---

# 51. Time & Timezone Rules

Semua timestamp yang disimpan backend menggunakan UTC (`TIMESTAMPTZ`).

Frontend menampilkan berdasarkan timezone site.

Jangan menggunakan waktu browser sebagai waktu telemetry.

Minimal field:

```text
device_timestamp
received_at
```

Perbedaan kedua timestamp berguna untuk mendeteksi latency.

---

# 52. Telemetry Quality

Setiap measurement dapat memiliki quality:

```text
GOOD
BAD
UNCERTAIN
STALE
```

UI harus membedakan:

- `0` sebagai nilai valid.
- `null` sebagai data tidak tersedia.
- `STALE` sebagai data lama.

Jangan mengubah missing value menjadi `0`.

---

# 53. Data Validation per Metric

Metric dapat memiliki constraints:

```json
{
  "code": "flow_m3h",
  "type": "number",
  "min": 0,
  "max": 1000
}
```

Jika nilai di luar engineering range:

- Simpan sebagai rejected/invalid event atau sebagai raw data dengan quality BAD.
- Jangan masukkan nilai invalid ke current state normal.
- Catat ingestion warning.

---

# 54. Device Offline vs Pump Stopped

Ini merupakan requirement penting.

**Pump STOPPED**:

- Device masih online.
- Telemetry masih diterima.
- Pump state menunjukkan stopped.

**Device OFFLINE**:

- Tidak ada komunikasi dari gateway/device selama timeout.
- Semua asset yang bergantung pada device dapat diberi status `UNKNOWN/OFFLINE_DATA`.

Jangan menampilkan pump offline sebagai `STOPPED`, karena itu dapat menyesatkan operator.

---

# 55. Alarm Semantics

`ACTIVE` tidak berarti `FAULT` secara umum.

Alarm adalah kondisi monitoring yang memenuhi suatu rule.

Asset fault berasal dari telemetry/event PLC jika tersedia.

Contoh:

```text
Pump state = FAULT
Alarm = PUMP_FAULT
```

Sedangkan:

```text
Flow = 10 m3/h
Expected minimum = 30 m3/h
Alarm = LOW_FLOW
Pump may still report RUNNING
```

---

# 56. Dashboard Refresh Strategy

Tidak boleh melakukan polling seluruh dashboard setiap beberapa detik.

Gunakan:

```text
Initial GET
   +
SSE realtime
   +
Periodic reconciliation
```

REST polling hanya digunakan untuk data yang memang tidak membutuhkan realtime atau sebagai fallback.

---

# 57. Performance Requirements

Target MVP:

- Dashboard initial API response p95 < 1.5 s pada LAN/server normal.
- Realtime event propagation backend → browser target < 2 s pada kondisi normal.
- API list endpoint p95 < 1 s untuk query normal.
- Tidak ada query telemetry raw tanpa time range.
- Pagination wajib untuk list besar.
- Export besar menggunakan streaming.
- Chart harus melakukan downsampling/aggregation untuk periode panjang.

---

# 58. Scalability Target

Desain baseline:

- 1–20 site.
- 10–100 device.
- 10–1.000 asset.
- Telemetry interval fleksibel 1–60 detik.

Angka tersebut adalah target desain awal, bukan batas produk.

Jika volume menjadi terlalu besar:

```text
PostgreSQL partitioning
        ↓
TimescaleDB / dedicated telemetry store
        ↓
Object storage/archive
```

Business API, MQTT contract, dan frontend contract sebaiknya tetap stabil.

---

# 59. Reliability

## MQTT Reconnect

Client backend harus otomatis reconnect.

Backoff eksponensial dengan cap.

## DB Failure

MQTT ingestion harus menghasilkan log error dan metric. Setelah DB kembali normal, service melanjutkan subscription tanpa restart manual jika memungkinkan.

Untuk deployment sangat kritis, dapat ditambahkan local spool/store-and-forward di gateway.

## Frontend Failure

Jika SSE disconnect:

```text
show disconnected state
↓
auto reconnect
↓
refresh current state
↓
resume realtime
```

---

# 60. Offline Gateway / Store-and-Forward

Future-ready requirement:

Jika koneksi internet gateway putus:

```text
PLC → Gateway local buffer
                  ↓ reconnect
             MQTT publish
```

Gateway sebaiknya menyimpan timestamp asli agar histori dapat direkonstruksi.

MVP tidak wajib mengimplementasikan buffer kompleks di backend.

---

# 61. Logging

Gunakan structured JSON logging.

Minimum fields:

```text
timestamp
level
service
event
request_id
site_id
device_id
asset_id
error_code
message
```

Contoh:

```json
{
  "level": "warn",
  "service": "mqtt-ingestion",
  "event": "invalid_telemetry",
  "device_id": "gw-001",
  "error_code": "SCHEMA_ERROR"
}
```

Jangan log password, MQTT secret, token, atau sensitive payload tanpa masking.

---

# 62. Observability

Backend minimal memiliki metrics:

```text
mqtt_connected
mqtt_messages_received_total
mqtt_messages_invalid_total
mqtt_processing_errors_total
telemetry_ingested_total
telemetry_ingestion_latency_ms
sse_connected_clients
sse_events_sent_total
active_alarms
online_devices
offline_devices
api_request_duration
```

Health endpoints:

```http
GET /health
GET /health/live
GET /health/ready
```

`ready` harus memeriksa dependency kritis seperti database dan MQTT sesuai kebutuhan deployment.

---

# 63. Infrastructure — MVP

Deployment sederhana:

```text
Internet / LAN
     |
 Reverse Proxy
     |
 +---+------------------+
 |                      |
React static        Fastify API
                        |
              +---------+---------+
              |                   |
           PostgreSQL          MQTT Broker
```

Optional:

```text
Nginx / Caddy
Docker Compose
Mosquitto
PostgreSQL
Fastify
Static React
```

Tidak diperlukan Kubernetes untuk MVP kecuali infrastruktur perusahaan memang mewajibkannya.

---

# 64. Recommended Docker Compose Services

```text
swpm-frontend
swpm-api
swpm-mqtt
swpm-postgres
reverse-proxy
```

Opsional:

```text
swpm-pgadmin
swpm-monitoring
```

Admin tools jangan exposed ke public network.

---

# 65. Environment Variables

Backend:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DATABASE_URL=postgresql://...

MQTT_URL=mqtts://broker:8883
MQTT_USERNAME=...
MQTT_PASSWORD=...
MQTT_CLIENT_ID=swpm-backend
MQTT_TOPIC_PREFIX=swpm/v1

JWT_SECRET=...
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

SSE_HEARTBEAT_INTERVAL=15000
DEVICE_OFFLINE_TIMEOUT=30000
TELEMETRY_RETENTION_DAYS=30
```

Frontend:

```env
VITE_API_BASE_URL=https://monitoring.example.com/api/v1
VITE_SSE_URL=https://monitoring.example.com/api/v1/realtime/stream
```

Jangan menyimpan secret broker/database di frontend.

---

# 66. API Error Codes

Standar awal:

```text
AUTH_INVALID_CREDENTIAL
AUTH_UNAUTHORIZED
AUTH_FORBIDDEN
RESOURCE_NOT_FOUND
VALIDATION_ERROR
DUPLICATE_RESOURCE
DEVICE_NOT_FOUND
DEVICE_OFFLINE
TELEMETRY_INVALID
ALARM_NOT_ACTIVE
RATE_LIMITED
INTERNAL_ERROR
```

---

# 67. Pagination

List endpoint:

```http
GET /api/v1/alarms?page=1&page_size=25
```

Response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "page_size": 25,
    "total": 214,
    "total_pages": 9
  }
}
```

Untuk telemetry time-series skala besar, gunakan cursor/time-based pagination, bukan offset pagination.

---

# 68. Search & Filter

Minimal:

Sites:

```text
status
project
keyword
```

Devices:

```text
site
status
device_type
keyword
```

Assets:

```text
site
area
asset_type
status
keyword
```

Alarms:

```text
site
severity
status
asset
date range
```

---

# 69. Reporting Requirements

Report telemetry:

```text
Site
Asset
Metric
From
To
Interval
Min
Max
Average
```

Report alarm:

```text
Alarm
Severity
Asset
Open time
Ack time
Resolve time
Duration
Acknowledged by
```

KPI alarm:

```text
MTTA = acknowledged_at - opened_at
MTTR = resolved_at - opened_at
```

KPI tersebut bersifat informatif untuk operational review dan tidak menggantikan SOP perusahaan.

---

# 70. Audit Requirements

Audit semua perubahan konfigurasi penting.

Contoh:

```text
USER_CREATED
USER_DISABLED
ROLE_CHANGED
SITE_UPDATED
DEVICE_REGISTERED
DEVICE_UPDATED
ALARM_RULE_CREATED
ALARM_RULE_UPDATED
ALARM_RULE_DISABLED
ALARM_ACKNOWLEDGED
```

Audit log tidak boleh editable dari UI.

---

# 71. Accessibility & UX

Minimum:

- Keyboard navigation pada tabel/filter.
- Kontras status yang cukup.
- Status tidak hanya dibedakan berdasarkan warna; gunakan text/icon.
- Toast tidak boleh menjadi satu-satunya tempat informasi alarm.
- Mobile responsive untuk basic monitoring.

Desktop adalah primary target karena use-case operator/engineer.

---

# 72. Recommended Visual Language

Karena dashboard terkait industrial monitoring:

- Gunakan hierarchy kuat.
- Hindari terlalu banyak warna.
- Warna status konsisten.
- Critical alarm sangat menonjol.
- Background dapat netral/dark/light mengikuti FE yang telah dibuat.
- Angka utama besar dan mudah dibaca.
- Chart memiliki unit yang eksplisit.
- Timestamp selalu terlihat pada data live.

Status semantics yang disarankan:

```text
Running      → positive/success
Normal       → positive/success
Stopped      → neutral
Maintenance  → warning
Fault        → danger
Offline      → muted/danger
Unknown      → neutral/warning
```

---

# 73. Empty / Loading / Error States

Setiap page harus memiliki tiga state minimum:

### Loading

Skeleton/loading indicator.

### Empty

Contoh:

> Belum ada pump pada site ini.

### Error

Contoh:

> Data gagal dimuat. Coba lagi.

Untuk realtime:

> Realtime disconnected — reconnecting…

Jangan menampilkan angka `0` ketika data sebenarnya gagal diambil.

---

# 74. Realtime UI Semantics

Ketika telemetry datang:

- Update angka tanpa reset halaman.
- Update timestamp.
- Update chart hanya pada metric terkait.
- Alarm panel menerima event baru.
- Status card berubah secara atomic.

Ketika data stale:

```text
Last update: 2m 41s ago
Data may be stale
```

---

# 75. Routing Frontend

Contoh:

```text
/login
/dashboard
/sites
/sites/:siteId
/sites/:siteId/pumps
/pumps/:pumpId
/trends
/alarms
/devices
/reports
/admin/users
/admin/sites
/admin/devices
/admin/alarm-rules
/admin/audit-logs
```

Gunakan route guard berdasarkan permission.

---

# 76. Suggested React Query Keys

```ts
['dashboard', 'summary']
['sites']
['site', siteId]
['site', siteId, 'summary']
['assets', filters]
['asset', assetId]
['asset', assetId, 'state']
['asset', assetId, 'telemetry', query]
['alarms', filters]
['devices', filters]
['device', deviceId]
```

SSE event dapat melakukan targeted cache update/invalidation.

---

# 77. Suggested TypeScript Domain Types

```ts
export type PumpStatus =
  | 'RUNNING'
  | 'STOPPED'
  | 'FAULT'
  | 'MAINTENANCE'
  | 'OFFLINE'
  | 'UNKNOWN';

export type DeviceStatus =
  | 'ONLINE'
  | 'STALE'
  | 'OFFLINE'
  | 'UNKNOWN';

export type AlarmStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'RESOLVED';

export interface MetricValue {
  code: string;
  value: number | string | boolean | null;
  unit?: string;
  quality: 'GOOD' | 'BAD' | 'UNCERTAIN' | 'STALE';
}
```

---

# 78. API Contract Validation

Backend harus menggunakan schema validation untuk:

- Request body.
- Query parameters.
- Path parameters.
- Response schema.
- MQTT payload.

Fastify memiliki pendekatan schema-first yang cocok untuk kebutuhan ini. JSON Schema dapat dijadikan sumber validasi sekaligus dokumentasi OpenAPI.

---

# 79. OpenAPI

API `/api/v1` harus memiliki dokumentasi OpenAPI.

Target:

```text
GET /docs
```

atau route internal yang hanya dapat diakses admin/developer.

OpenAPI harus menjadi kontrak antara FE dan BE.

---

# 80. Testing Strategy

## Unit Test

Wajib untuk:

- MQTT topic parser.
- Payload validator.
- Telemetry normalization.
- Alarm engine.
- Device state calculation.
- Permission check.
- Utility time/date.

## Integration Test

- Fastify + PostgreSQL.
- MQTT broker test instance.
- Telemetry → DB.
- Telemetry → alarm.
- Alarm → SSE event.

## E2E Test

Scenario utama:

```text
Login
→ Dashboard
→ Open Site
→ Open Pump
→ Receive realtime telemetry
→ Trigger alarm
→ Acknowledge
→ Resolve
→ Open history
→ Export report
```

---

# 81. MQTT Integration Test Scenario

Simulasikan:

### Test 1 — Normal

```text
Publish telemetry
→ accepted
→ current state updated
→ dashboard updated
```

### Test 2 — Invalid JSON

```text
Publish invalid JSON
→ rejected
→ error logged
→ service continues
```

### Test 3 — Unknown device

```text
Publish from unregistered device
→ rejected
→ security log
```

### Test 4 — Device offline

```text
Stop heartbeat
→ timeout
→ OFFLINE
→ alarm/event
```

### Test 5 — Alarm threshold

```text
pressure > threshold
→ alarm OPEN
→ SSE event
```

### Test 6 — Recovery

```text
pressure normal
→ recovery delay
→ RESOLVED
```

---

# 82. Acceptance Criteria — MVP

MVP dianggap siap digunakan jika:

1. User dapat login.
2. User hanya dapat melihat resource sesuai permission.
3. Device dapat publish telemetry ke MQTT.
4. Fastify menerima dan memvalidasi telemetry.
5. Telemetry disimpan ke PostgreSQL.
6. Current state diperbarui.
7. Dashboard menerima update realtime tanpa refresh.
8. Device offline dapat terdeteksi.
9. Alarm dapat aktif berdasarkan rule.
10. Alarm dapat acknowledge.
11. Alarm dapat resolve saat kondisi kembali normal.
12. Histori dapat dilihat dalam chart.
13. Data dapat difilter berdasarkan asset dan rentang waktu.
14. Export CSV tersedia.
15. Audit log mencatat perubahan konfigurasi penting.
16. MQTT credential tidak diekspos ke browser.
17. API memakai authentication dan authorization.
18. Sistem memiliki health check.
19. Error pada satu message MQTT tidak menghentikan ingestion service.
20. Reconnect SSE berjalan otomatis.
21. Admin dapat menambah room baru dan langsung melihatnya di dashboard tanpa perubahan source code.
22. Admin dapat menambah sensor dan bind ke pump atau room tanpa perubahan source code.
23. Operator berizin dapat mengirim ON/OFF dan melihat command lifecycle.
24. Command yang tidak di-acknowledge masuk TIMEOUT.
25. UI tidak menganggap publish MQTT sebagai bukti pompa berhasil ON/OFF.
26. Actual pump state diverifikasi dari telemetry/status PLC/gateway.

---

# 83. Definition of Done

Sebuah fitur dianggap selesai apabila:

- Requirement terpenuhi.
- API contract terdokumentasi.
- Validation tersedia.
- Error handling tersedia.
- Logging tersedia.
- Permission diperiksa.
- Unit test untuk business logic.
- Integration test untuk alur kritis.
- UI memiliki loading/empty/error state.
- Tidak ada secret pada frontend.
- Migration database tersedia.
- README/configuration diperbarui.

---

# 84. Recommended Development Phases

## Phase 0 — Foundation

- Repository structure.
- Environment config.
- PostgreSQL + migration.
- Fastify base.
- React base.
- Authentication + RBAC.
- Docker Compose.
- MQTT broker lokal.

Output:

> Sistem dapat dijalankan end-to-end secara lokal.

## Phase 1 — Dynamic Topology

- Organization/project/site/area.
- Device model.
- Asset/pump model.
- Sensor model.
- Sensor binding.
- Metric definitions.
- Capability configuration.
- Seed 3 room + 6 pump.

Output:

> Admin dapat menambah room/pump/sensor tanpa perubahan frontend.

## Phase 2 — MQTT & Telemetry

- MQTT connection.
- Topic parser.
- Payload validation.
- Device heartbeat.
- Online/offline.
- Telemetry ingestion.
- Current state.
- Historical API.
- Realtime SSE.

Output:

> Gateway simulasi dapat mengirim data dan UI menerima update tanpa refresh.

## Phase 3 — Dashboard & Control

- Overview dashboard.
- Area/room view.
- Pump cards.
- Pump detail.
- Trend.
- Device health.
- Pump ON/OFF command.
- Command status + acknowledgement.
- Command audit.

Output:

> Operator dapat memonitor dan mengirim command ON/OFF secara terkontrol.

## Phase 4 — Alarm & Events

- Rule engine.
- Alarm lifecycle.
- Anti-flicker/recovery.
- Alarm panel.
- Acknowledge.
- Event log.

Output:

> Sistem dapat mendeteksi kondisi abnormal dan menelusuri kejadian.

## Phase 5 — Administration

- Site/area/device/asset/sensor CRUD.
- Sensor binding UI.
- Alarm rule editor.
- User/role.
- Audit log.
- Configuration export/import sederhana.

## Phase 6 — Reporting & Hardening

- CSV export.
- Aggregation.
- Retention.
- Backup.
- Security hardening.
- Monitoring.
- Performance test.

---

# 85. Suggested Coding Order

Urutan coding yang direkomendasikan:

```text
1. PostgreSQL + migration
2. Domain model + types
3. Fastify core + config
4. Auth + RBAC
5. Device CRUD
6. MQTT broker connection
7. MQTT topic parser
8. Telemetry schema validation
9. Telemetry ingestion
10. Current state
11. SSE gateway
12. Dashboard summary API
13. React dashboard integration
14. Pump detail
15. History/trend
16. Device health
17. Alarm rule
18. Alarm engine
19. Alarm UI
20. Event/audit
21. Reports/export
22. Production hardening
```

Jangan mengerjakan UI alarm sebelum contract alarm engine stabil karena status/alarm semantics akan memengaruhi banyak bagian frontend.

---

# 86. Suggested First Sprint

Sprint pertama sebaiknya fokus pada vertical slice kecil, bukan membuat semua CRUD sekaligus.

Target:

```text
Simulator
   ↓ MQTT
Broker
   ↓
Fastify
   ↓
PostgreSQL
   ↓
SSE
   ↓
React
```

Gunakan satu site, satu gateway, satu pump, dan sekitar 5–10 metric.

Jika vertical slice ini stabil, seluruh arsitektur dapat diperluas.

---

# 87. MQTT Simulator

Buat simulator sederhana untuk development.

Contoh konfigurasi:

```json
{
  "device_id": "gw-001",
  "site_id": "site-demo",
  "asset_id": "pump-01",
  "interval_ms": 5000
}
```

Nilai dapat diberi variasi:

```text
flow      = 50 ± 5 m3/h
pressure  = 4 ± 0.4 bar
level     = sinus/slow variation
power     = 18 ± 2 kW
current   = correlated with power
```

Simulator harus dapat memicu:

```text
PUMP_FAULT
HIGH_PRESSURE
LOW_FLOW
DEVICE_OFFLINE
```

Ini sangat membantu pengembangan dashboard sebelum PLC/gateway nyata tersedia.

---

# 88. Example End-to-End Event

Gateway mengirim:

```text
Topic:
swpm/v1/site-demo/gw-001/telemetry
```

Payload:

```json
{
  "version": 1,
  "device_id": "gw-001",
  "asset_id": "pump-01",
  "timestamp": "2026-10-03T07:15:00Z",
  "sequence": 2001,
  "metrics": {
    "pump_running": true,
    "flow_m3h": 51.8,
    "pressure_bar": 6.1,
    "power_kw": 19.0
  },
  "quality": "GOOD"
}
```

Backend:

```text
validate
→ resolve device
→ persist telemetry
→ update pump current state
→ pressure rule triggered
→ create alarm
→ emit telemetry.update
→ emit alarm.created
```

React:

```text
Pump card:
pressure = 6.1 bar
status = RUNNING

Alarm panel:
HIGH PRESSURE

Chart:
new pressure point
```

---

# 89. Pump Control — MVP Operational Control

Pump ON/OFF adalah bagian dari MVP. Control harus selalu melalui Fastify → MQTT → Gateway/PLC dan menggunakan acknowledgement.

Contract wajib mencakup:

- authorization/RBAC (`pump.control`);
- confirmation di UI;
- command idempotency;
- command timeout;
- command acknowledgement;
- actual-state verification;
- audit log;
- PLC interlock/permissive;
- maintenance lock;
- device online/capability check.

Advanced control seperti scheduling, sequencing, PID, auto-balancing, dan optimization tetap masuk fase future.

Topic:

```text
swpm/v1/{site_id}/{device_id}/command
swpm/v1/{site_id}/{device_id}/command_ack
```

Command example:

```json
{
  "version": 1,
  "command_id": "cmd-123",
  "issued_at": "2026-10-03T07:20:00Z",
  "issued_by": "user-001",
  "command": "SET_PUMP_MODE",
  "payload": {
    "asset_id": "pump-01",
    "mode": "AUTO"
  }
}
```

Untuk fase ini wajib ditambahkan:

- command authorization;
- approval workflow bila diperlukan;
- command audit;
- command timeout;
- acknowledgement;
- idempotency;
- safety interlock tetap berada di PLC.

---

# 90. Analytics & Anomaly Detection Roadmap

SWPMS harus **analytics-ready sejak MVP**, tetapi analytics lanjutan tidak boleh menghambat monitoring/control.

## 89.1 Analytics yang dapat dihitung tanpa ML

- Pump runtime per hari.
- Start/stop count.
- Average flow per runtime hour.
- Pressure stability.
- Flow vs pressure relationship.
- Energy per cubic meter jika flow + power/energy tersedia.
- Pump utilization.
- Frequency/current trend.
- Alarm frequency dan alarm duration.

## 89.2 Anomaly Detection Future

Tahap berikutnya dapat menggunakan:

```text
Telemetry
  ↓
Cleaning / quality check
  ↓
Time-window aggregation
  ↓
Feature generation
  ↓
Baseline / expected operating envelope
  ↓
Anomaly score
  ↓
Analytic event / notification
```

Metode dapat dipilih setelah dataset cukup, misalnya rolling z-score, EWMA, Isolation Forest, atau model sequence. Jangan memilih algoritma hanya karena tersedia; validasi harus menggunakan histori aktual dan feedback engineer/operator.

## 89.3 Data Contract untuk Analytics

MVP wajib mempertahankan:

- timestamp device dan server receive time;
- quality flag;
- asset/sensor binding;
- start/stop event;
- alarm event;
- command event;
- configuration history.

Tanpa data tersebut, hasil anomaly analysis akan sulit ditelusuri.

---

# 91. Future Phase — Predictive Maintenance

Data yang sudah disiapkan MVP dapat menjadi foundation untuk:

- runtime analysis;
- start/stop count;
- vibration trend;
- bearing temperature trend;
- energy efficiency;
- anomaly detection;
- failure prediction.

Tahap ini baru dilakukan setelah data historis cukup berkualitas.

---

# 92. Future Phase — Multi-Tenant Platform

Jika SWPMS nantinya menjadi produk layanan Ascon untuk banyak customer:

```text
Organization
  ├── Project
  │    ├── Site
  │    │    ├── Area
  │    │    ├── Device
  │    │    └── Asset
  │    └── Users
  └── Policies
```

Semua query backend harus memiliki tenant boundary.

Jangan mengandalkan filter frontend untuk keamanan.

---

# 93. Operational SOP Integration

SWPMS harus dianggap sebagai alat bantu monitoring yang mengikuti SOP operasional plant.

Alarm severity, threshold, acknowledgement procedure, dan response time harus ditentukan berdasarkan engineering documentation dan SOP site.

Dashboard tidak boleh menjadi sumber tunggal untuk safety decision.

---

# 94. Recommended Project Folder Structure

Monorepo ringan:

```text
smart-water-pump-monitoring/
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── contracts/
│   ├── types/
│   └── config/
│
├── infra/
│   ├── docker/
│   ├── mosquitto/
│   └── postgres/
│
├── simulator/
│   └── mqtt-device-simulator/
│
├── docs/
│   ├── PRD.md
│   ├── MQTT.md
│   ├── API.md
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
│
└── README.md
```

Jika monorepo belum diperlukan, `web`, `api`, dan `simulator` dapat dipisah repository dengan shared OpenAPI/JSON Schema.

---

# 95. Key Engineering Decisions

## Decision 1 — MQTT sebagai transport

MQTT menjadi protokol telemetry antara edge dan backend.

## Decision 2 — Fastify sebagai application boundary

Fastify menangani:

- API;
- authentication;
- authorization;
- MQTT ingestion;
- alarm logic;
- realtime delivery.

## Decision 3 — PostgreSQL sebagai primary store

Satu database cukup untuk MVP.

## Decision 4 — SSE untuk realtime browser

SSE digunakan untuk event server → browser karena mayoritas traffic bersifat telemetry/status/alarm. REST digunakan untuk user action seperti pump ON/OFF. WebSocket belum diperlukan pada MVP.

## Decision 5 — Current state dipisahkan dari telemetry

Dashboard tidak boleh scan tabel histori untuk nilai terakhir.

## Decision 6 — Alarm sebagai domain module

Alarm tidak boleh menjadi sekadar query frontend.

## Decision 7 — Threshold configurable

Nilai engineering tidak boleh hardcoded dalam React.

## Decision 8 — UTC storage

Semua timestamp server menggunakan UTC.

---

# 96. Risks & Mitigation

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Telemetry terlalu sering | DB cepat besar | Retention, aggregation, partitioning |
| Device offline | Data stale | last_seen + timeout |
| MQTT credential bocor | Security incident | Backend-only MQTT, TLS, ACL |
| Alarm flapping | Operator fatigue | delay/recovery/cooldown |
| UI kehilangan event | Data stale | initial GET + SSE + reconciliation |
| Payload device berbeda | Ingestion error | versioned schema + metric mapping |
| Time sync device buruk | Histori kacau | received_at + NTP requirement |
| DB failure | Data loss | backup + store-and-forward future |
| Banyak chart | Browser berat | aggregation/downsampling |
| Threshold salah | False alarm | engineering approval/config workflow |

---

# 97. Open Decisions Before Production

Hal-hal berikut perlu ditentukan bersama kebutuhan proyek lapangan:

1. Jenis PLC/gateway yang benar-benar digunakan.
2. Broker MQTT yang dipilih.
3. Interval telemetry masing-masing parameter.
4. Daftar metric final.
5. Unit tiap metric.
6. Engineering range.
7. Threshold alarm.
8. Device authentication method.
9. Network topology antara plant, gateway, broker, dan server.
10. Apakah broker berada di LAN, VPN, atau internet.
11. Kebutuhan customer/tenant.
12. Retention requirement.
13. Kebutuhan export/report.
14. Apakah perlu notification WhatsApp/email/Telegram.
15. Mapping command ON/OFF ke PLC tag/register aktual.
16. Safety/permissive conditions yang wajib dikonfirmasi oleh PLC.
17. Apakah mode REMOTE harus diaktifkan manual dari panel sebelum web command diterima.
18. Interval telemetry dan heartbeat aktual tiap gateway.
19. Daftar sensor awal dan calibration/engineering range.
20. Notification channel untuk alarm.

---

# 98. Recommended Notification Roadmap

MVP:

```text
Dashboard alarm
```

Phase 2:

```text
Email
```

Phase 3:

```text
WhatsApp / Telegram / SMS / push
```

Notification sebaiknya dipicu dari alarm domain, bukan langsung dari MQTT message, agar satu alarm memiliki lifecycle yang konsisten.

---

# 99. Backup & Recovery

Minimal production:

- PostgreSQL daily full backup.
- Backup configuration.
- Backup MQTT ACL/credential metadata.
- Backup `.env` secara aman melalui secret management.
- Test restore secara berkala.

Jangan menganggap backup sukses hanya karena file backup berhasil dibuat; lakukan restore test.

---

# 100. Security Checklist Production

```text
[ ] HTTPS enabled
[ ] MQTT TLS enabled
[ ] Anonymous MQTT disabled
[ ] Device-specific credentials
[ ] Database not public
[ ] Password hashed
[ ] Access token secured
[ ] Rate limit login
[ ] RBAC active
[ ] Audit log active
[ ] Pump command authorization enforced
[ ] Pump command audit active
[ ] Command timeout/reconciliation active
[ ] Maintenance lock active
[ ] Secrets outside source code
[ ] CORS restricted
[ ] Security headers enabled
[ ] Input validation enabled
[ ] SQL parameterization/ORM safe queries
[ ] Backup configured
[ ] Restore tested
[ ] Broker ACL configured
[ ] Health endpoints protected as needed
```

---

# 101. Development Checklist

## Backend

```text
[ ] Fastify setup
[ ] Environment schema
[ ] DB connection
[ ] Migrations
[ ] Auth
[ ] RBAC
[ ] Site CRUD
[ ] Device CRUD
[ ] Asset CRUD
[ ] Area CRUD
[ ] Sensor CRUD
[ ] Sensor binding
[ ] Asset capability configuration
[ ] Metric definition
[ ] MQTT connection
[ ] MQTT topic parser
[ ] MQTT validation
[ ] Telemetry ingestion
[ ] Current state
[ ] Pump command service
[ ] Command acknowledgement
[ ] Command timeout
[ ] Alarm engine
[ ] SSE
[ ] Reports
[ ] Audit log
[ ] Tests
```

## Frontend

```text
[ ] Router
[ ] Auth pages
[ ] Layout
[ ] Dashboard
[ ] Site detail
[ ] Pump card
[ ] Pump control
[ ] Command status
[ ] Pump detail
[ ] Device health
[ ] Alarm page
[ ] Trend page
[ ] Report page
[ ] Admin pages
[ ] SSE hook
[ ] Query/cache strategy
[ ] Loading states
[ ] Empty states
[ ] Error states
[ ] Permission guard
```

## Infrastructure

```text
[ ] Docker Compose
[ ] PostgreSQL
[ ] MQTT broker
[ ] TLS
[ ] Reverse proxy
[ ] Backup
[ ] Logging
[ ] Health check
[ ] Monitoring
```

---

# 102. Product Success Metrics

Technical metrics:

- Telemetry acceptance rate.
- MQTT connectivity uptime.
- Realtime delivery latency.
- API latency.
- Number of offline devices.
- Data completeness.
- Alarm processing latency.

Operational metrics:

- Time to detect fault.
- Mean time to acknowledge alarm (MTTA).
- Mean time to resolve (MTTR).
- Number of recurring alarms.
- Availability of pump telemetry.

Business metrics future:

- Reduced manual inspection effort.
- Reduced downtime.
- Maintenance response improvement.
- Energy efficiency analysis.

Metrics harus dibandingkan dengan baseline dan SOP proyek, bukan dianggap sebagai target universal.

---

# 103. MVP Release Definition

Versi MVP yang direkomendasikan adalah:

```text
Authentication
+ RBAC
+ Dynamic Site/Area/Pump/Device/Sensor configuration
+ 3 initial rooms/areas
+ 6 initial pumps
+ MQTT telemetry
+ Current state
+ Device health
+ Real-time dashboard
+ Pump ON/OFF control
+ Command acknowledgement + timeout
+ Alarm
+ Trend/history
+ Event history
+ CSV export
+ Audit log
```

Belum perlu:

```text
Predictive ML
Scheduling / sequencing
PID / closed-loop web control
Mobile app
Complex workflow engine
Microservices
Kafka
Redis cluster
Kubernetes
Dedicated time-series cluster
```

Arsitektur sengaja dibuat modular sehingga komponen berat dapat ditambahkan hanya ketika ada kebutuhan nyata.

---

# 104. Final Technical Blueprint

```text
                                 WEB / USER
                                      |
                                 React + Vite
                                      |
                         REST + SSE / HTTPS
                                      |
                                Fastify API
                    +-----------------+------------------+
                    |                 |                  |
                    v                 v                  v
             PostgreSQL        MQTT Client        Realtime/SSE
              /       \             |                  |
       Config/State   History        |                  |
         /   |   \      |           |                  |
      Area Pump Sensor   Telemetry    |                  |
         \    |    /                |                  |
          \   |   /            MQTT Broker             |
           \  |  /                  ^                  |
            Dynamic topology         |                  |
                                     |                  |
                           IoT Gateway / PLC <-----------+
                              |        |
                           Sensors     VFD

CONTROL PATH:
React → Fastify → pump_commands → MQTT command → Gateway/PLC
      ← SSE command status ← MQTT command_ack / actual state

SAFETY:
PLC/VFD remains authoritative for interlock, permissive, overload,
emergency stop, dry-run, pressure protection, and process logic.
```

## 104.1 Initial deployment

```text
3 Rooms / Areas
├── Room 01 → assigned pumps (contoh seed: P-01, P-02)
├── Room 02 → assigned pumps (contoh seed: P-03, P-04)
└── Room 03 → assigned pumps (contoh seed: P-05, P-06)

Catatan: pembagian 2 pump per room di atas hanya contoh seed. Mapping aktual mengikuti topology/commissioning lapangan.
```

## 104.2 Expansion model

```text
Add Room → add area record
Add Pump → add asset + capability + device/PLC mapping
Add Sensor → add sensor + metric + binding
Move Sensor → change binding, preserve historical telemetry
```

Seluruh UI membaca topology/configuration dari API, sehingga tidak ada asumsi `pumpCount = 6` atau `roomCount = 3` di kode.

# Appendix A — Minimal Metric Catalog

| Code | Label | Unit | Type | Category |
|---|---|---|---|---|
| pump_running | Pump Running | - | boolean | STATUS |
| pump_mode | Pump Mode | - | enum | STATUS |
| pump_fault | Pump Fault | - | boolean | STATUS |
| flow_m3h | Flow | m³/h | number | HYDRAULIC |
| pressure_bar | Pressure | bar | number | HYDRAULIC |
| suction_pressure_bar | Suction Pressure | bar | number | HYDRAULIC |
| tank_level_pct | Tank Level | % | number | HYDRAULIC |
| tank_distance_m | Tank Distance | m | number | HYDRAULIC |
| water_temp_c | Water Temperature | °C | number | MOTOR/PROCESS |
| voltage_v | Voltage | V | number | ELECTRICAL |
| current_a | Current | A | number | ELECTRICAL |
| power_kw | Active Power | kW | number | ENERGY |
| power_factor | Power Factor | - | number | ELECTRICAL |
| frequency_hz | Frequency | Hz | number | ELECTRICAL |
| energy_kwh | Energy | kWh | number | ENERGY |
| motor_temp_c | Motor Temperature | °C | number | MOTOR |
| vibration_mm_s | Vibration | mm/s | number | MOTOR |
| rpm | Speed | RPM | number | MOTOR |
| vfd_fault_code | VFD Fault | - | string | MOTOR |
| gateway_uptime_s | Gateway Uptime | s | number | DEVICE |
| signal_rssi | Signal | dBm | number | DEVICE |

---

# Appendix B — Initial Seed Data

Deployment awal harus merepresentasikan kondisi riil minimum 6 pompa pada 3 room/area. Jangan hardcode struktur ini ke UI.

```text
Organization: ASCON
└── Project: SWPMS-DEMO
    └── Site: SITE-DEMO
        ├── Area: ROOM-01
        │   ├── Pump: P-01
        │   └── Pump: P-02
        ├── Area: ROOM-02
        │   ├── Pump: P-03
        │   └── Pump: P-04
        └── Area: ROOM-03
            ├── Pump: P-05
            └── Pump: P-06

        Gateway: GW-001
        Gateway: GW-002 (optional)
```

Minimal sensor mapping dapat dimulai dari:

```text
P-01..P-06
├── Flow Meter (jika tersedia)
├── Pressure Sensor (jika tersedia)
├── Pump Status
└── Electrical Metrics (jika tersedia)

ROOM-01..ROOM-03
└── Water Level / Distance Sensor (future)

P-01..P-06
└── Temperature Sensor (future)
```

Alarm rule contoh harus dikonfigurasi per asset/site, bukan hardcoded di kode.

---

# Appendix C — First-Day Implementation Target

Pada akhir implementasi vertical slice pertama, kondisi yang diharapkan:

```text
$ docker compose up -d

MQTT simulator publishes every 5s
        ↓
Fastify logs telemetry
        ↓
PostgreSQL stores telemetry
        ↓
/assets/pump-01/state returns latest values
        ↓
/realtime/stream pushes telemetry.update
        ↓
React card changes without reload
```

Jika flow ini sudah berjalan, fondasi utama SWPMS telah terbentuk dan fitur lain dapat dikembangkan secara incremental.
