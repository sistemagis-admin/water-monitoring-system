# Smart Water Pump Monitoring System (SWPMS)
## PT Ascon Multi Pratama - SCADA & Industrial IoT

Sistem monitoring dan kontrol operasional pompa air berbasis web, telemetry MQTT, Fastify backend, dan dashboard React.

---

## 📁 Struktur Repositori

- [`backend/`](file:///d:/Work/Sistemagis/water-monitoring-system/backend): Fastify TypeScript REST API, MQTT telemetry ingestion, alarm engine, SSE realtime stream, dan dokumentasi Swagger/OpenAPI.
- [`docs/`](file:///d:/Work/Sistemagis/water-monitoring-system/docs): Dokumen spesifikasi PRD, OpenAPI JSON spec, dan Postman Collection.
- [`infra/`](file:///d:/Work/Sistemagis/water-monitoring-system/infra): Konfigurasi Mosquitto MQTT broker dan service container.
- [`docker-compose.yml`](file:///d:/Work/Sistemagis/water-monitoring-system/docker-compose.yml): Setup container untuk PostgreSQL 16 dan Mosquitto MQTT Broker.

---

## 🚀 Quick Start (Backend)

1. Jalankan PostgreSQL dan Mosquitto Broker:
   ```bash
   docker compose up -d
   ```

2. Setup dan jalankan backend:
   ```bash
   cd backend
   npm install
   npm run migrate
   npm run seed
   npm run dev
   ```

3. Akses Swagger UI & OpenAPI:
   - **Interactive Swagger UI**: [http://localhost:3000/docs](http://localhost:3000/docs)
   - **OpenAPI 3.0 Spec JSON**: [http://localhost:3000/docs/json](http://localhost:3000/docs/json) atau [http://localhost:3000/api/v1/openapi.json](http://localhost:3000/api/v1/openapi.json)
   - **Postman Collection**: [docs/SWPMS_API.postman_collection.json](docs/SWPMS_API.postman_collection.json)

4. Jalankan IoT Simulator (6 Pompa Lapangan):
   ```bash
   npm run simulate
   ```

Lihat detail lengkap di [backend/README.md](backend/README.md).
