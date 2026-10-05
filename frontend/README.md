# Smart Water Pump Monitoring System — Frontend Client

Aplikasi web dashboard Single Page Application (SPA) berbasis **React 19**, **TypeScript**, **Vite**, dan **Tailwind CSS** untuk memantau dan mengendalikan stasiun pompa air industri PT Ascon Multi Pratama secara real-time.

---

## 🌟 Modul & Tampilan Antarmuka

Aplikasi terdiri dari 7 modul utama yang dapat diakses melalui bilah navigasi (Sidebar):

1. **Dashboard Monitoring**:
   - 8 kartu KPI metrik performa & kesehatan aset (Lokasi Terpantau, Rata-rata Tekanan, Total Debit, Pembaruan Terakhir, Konektivitas Edge, Kesehatan Aset OEE, Efisiensi Energi SEC, Tingkat Gangguan).
   - Tampilan ganda *Grid View* dan *Dense Table View* untuk armada pompa.
   - Filter lokasi/stasiun interaktif dan sakelar cepat kontrol motor pompa.
2. **Plant Areas & Stations**:
   - Pemetaan stasiun pengolahan (Intake, Filtrasi, Booster Distribusi) beserta unit pompa dan transmitter terpasang.
   - Pendaftaran dan penyuntingan stasiun.
3. **Pump Management**:
   - Manajemen lengkap unit pompa, spesifikasi daya motor, kurva performa tekanan/debit, dan pengaturan kemampuan kendali jarak jauh (*Remote Control Allowed*).
4. **Sensors & Signal Binding**:
   - Konfigurasi transmitter sensor analog/digital dan pengikatan sinyal (*signal binding*) ke kanal MQTT gateway.
5. **IoT Edge Gateways**:
   - Pemantauan status online/offline node gateway telemetri lapangan, konfigurasi IP, dan diagnostik transmisi data.
6. **Alarm Center**:
   - Pusat pemantauan alarm aktif, riwayat anomali, tingkat keparahan (*CRITICAL*, *HIGH*, *WARNING*, *INFO*), dan alur pengakuan (*acknowledgment*) oleh operator.
7. **User Management & RBAC**:
   - Manajemen akun pengguna, pembagian peran (*Super Admin*, *Engineer*, *Operator*, *Viewer*), dan matriks izin akses.

---

## ⚙️ Teknologi Frontend

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS + CSS Variables (Design Tokens)
- **Komponen UI**: Radix UI Primitives (Dialog, Alert Dialog, Select, Switch, Avatar, Badge, dsb.)
- **Visualisasi Grafik**: Recharts (Responsive AreaChart & LineChart)
- **Ikonografi**: Lucide React
- **Komunikasi Data**:
  - Fetch API wrapper dengan mekanisme **Silent Token Refresh** dan antrean konkurensi.
  - Native **Server-Sent Events (SSE)** untuk konsumsi data telemetri real-time.

---

## 🚀 Panduan Menjalankan Frontend

### 1. Masuk ke Direktori Frontend
```bash
cd frontend
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (Opsional)
Secara default, frontend akan otomatis mendeteksi backend di `http://localhost:3000`. Jika menggunakan URL kustom, buat berkas `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
```

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di **`http://localhost:5173`**.

### 5. Kredensial Login Bawaan
Gunakan akun uji coba berikut:
- **Email**: `admin@ascon.co.id`
- **Password**: `Admin@123`

---

## 📦 Build Produksi

Untuk menghasilkan bundle produksi yang teroptimasi:
```bash
npm run build
```

Untuk mempratinjau hasil build secara lokal:
```bash
npm run preview
```
