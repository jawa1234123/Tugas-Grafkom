# LAPORAN FINAL PROJECT GRAFIKA KOMPUTER
**Semester Genap 2025/2026**

---

## 1. ALASAN PEMILIHAN MATERI

Dari 5 materi yang tersedia, kelompok kami memutuskan untuk mengimplementasikan **Linear (Bresenham)**, **Transformasi 2D**, dan **Clipping (Liang-Barsky)**. Berikut adalah alasan pemilihannya:

1. **A. Linear (Bresenham)** 
   - *Alasan*: Algoritma Bresenham adalah fondasi paling dasar dan paling efisien dalam grafika komputer untuk menggambar garis primitif (rasterisasi). Algoritma ini murni menggunakan operasi bilangan bulat (integer addition, subtraction, bit shifting) tanpa operasi *floating-point* (desimal) maupun pembagian, sehingga jauh lebih cepat dibandingkan algoritma DDA. Hal ini melatih logika fundamental komputer dalam memplot koordinat *pixel* diskrit pada layar.
2. **B. Transformasi 2D**
   - *Alasan*: Konsep transformasi (Translasi, Scaling, Rotasi) adalah kunci dalam memanipulasi objek spasial. Memilih materi ini melatih pemahaman kami terhadap komputasi **Aljabar Linier dan Matriks**. Dengan menerapkan ketiganya secara berurutan pada poligon, kami dapat memvisualisasikan bagaimana sebuah matriks diproses secara manual tanpa bantuan *library* 3D/2D modern yang biasanya menyembunyikan proses matematis ini.
3. **D. Clipping (Liang-Barsky)**
   - *Alasan*: Dibandingkan Cohen-Sutherland yang menggunakan pendekatan *region code* (bitwase operations), algoritma **Liang-Barsky** jauh lebih matematis dan efisien secara komputasi. Algoritma ini menggunakan persamaan parametrik garis untuk mencari interseksi (titik potong). Pemilihan ini menunjukkan kemampuan analisis matematis yang lebih mendalam dalam menentukan letak batas garis terhadap rentang window clipping.

---

## 2. PENJELASAN PERHITUNGAN ALGORITMA (TANPA LIBRARY)

Berikut adalah detail bagaimana perhitungan matematika diimplementasikan di dalam kode `script.js` murni menggunakan logika dasar JavaScript:

### A. Algoritma Linear (Bresenham)
Algoritma Bresenham tidak mencari nilai gradien (m) seperti algoritma DDA, melainkan mengakumulasi nilai *error*. 
**Langkah Perhitungan:**
1. Hitung selisih jarak absolut pada sumbu X dan Y: `dx = |x1 - x0|` dan `dy = |y1 - y0|`.
2. Tentukan arah langkah (step):
   - Jika `x0 < x1` maka `sx = 1`, jika tidak `sx = -1`.
   - Jika `y0 < y1` maka `sy = 1`, jika tidak `sy = -1`.
3. Inisialisasi nilai kesalahan awal: `error = dx - dy`.
4. Dalam perulangan `while`, piksel koordinat `(x, y)` saat ini digambar ke layar (plot).
5. Kalkulasi kesalahan ganda (e2): `e2 = 2 * error`.
   - Jika `e2 > -dy`, berarti titik selanjutnya bergerak pada sumbu X (`error -= dy` dan `x += sx`).
   - Jika `e2 < dx`, berarti titik selanjutnya bergerak pada sumbu Y (`error += dx` dan `y += sy`).
6. Perulangan berhenti ketika `x == x1` dan `y == y1` tercapai.

### B. Transformasi 2D (Translasi, Scaling, Rotasi)
Bentuk awal poligon direpresentasikan sebagai Array berisi kumpulan titik-titik kordinat (Titik P). Program mengubah nilai matriks setiap titik secara berurutan.
**Langkah Perhitungan:**
1. **Translasi (Perpindahan):** Titik dipindah berdasarkan vektor Tx dan Ty.
   - Rumus: `P_baru.x = P_lama.x + Tx`
   - Rumus: `P_baru.y = P_lama.y + Ty`
2. **Scaling (Penskalaan):** Ukuran diperbesar atau diperkecil berdasarkan faktor Sx dan Sy.
   - Rumus: `P_baru.x = P_lama.x * Sx`
   - Rumus: `P_baru.y = P_lama.y * Sy`
3. **Rotasi (Perputaran):** Dilakukan terhadap titik origin koordinat (0,0) menggunakan fungsi *Trigonometri*.
   - Konversi Derajat (θ) ke Radian: `rad = θ * (π / 180)`
   - Hitung nilai cosinus dan sinus: `cosA = Math.cos(rad)` dan `sinA = Math.sin(rad)`.
   - Rumus perhitungan matriks manual:
     - `P_baru.x = (P_lama.x * cosA) - (P_lama.y * sinA)`
     - `P_baru.y = (P_lama.x * sinA) + (P_lama.y * cosA)`
   *Catatan: Semua operasi dilakukan berurutan dengan array `map()`, di mana output fungsi satu menjadi input pada fungsi berikutnya.*

### D. Clipping (Liang-Barsky)
Algoritma pemotongan garis terhadap batasan area kotak *(Window Boundary)* berkoordinat `Xmin, Ymin` sampai `Xmax, Ymax`.
**Langkah Perhitungan:**
1. Hitung delta garis asli: `dx = x2 - x1` dan `dy = y2 - y1`.
2. Bentuk 4 sisi *Window* dengan parameter jarak (`q`) dan koefisien arah parameter (`p`):
   - Kiri (x-min): `p1 = -dx`, `q1 = x1 - Xmin`
   - Kanan (x-max): `p2 = dx`, `q2 = Xmax - x1`
   - Bawah (y-min): `p3 = -dy`, `q3 = y1 - Ymin`
   - Atas (y-max): `p4 = dy`, `q4 = Ymax - y1`
3. Inisialisasi batas rasio awal, yaitu `u1 = 0` (awal) dan `u2 = 1` (akhir).
4. Evaluasi setiap tepi (loop 4x):
   - Jika `p == 0`, periksa apakah sejajar di luar batas (`q < 0`). Jika ya, abaikan keseluruhan garis.
   - Jika `p != 0`, hitung rasio `r = q / p`.
   - Jika garis menuju ke DALAM window (`p < 0`), perbarui batas minimum: `u1 = max(u1, r)`.
   - Jika garis menuju ke LUAR window (`p > 0`), perbarui batas maksimum: `u2 = min(u2, r)`.
5. Jika setelah evaluasi keempat tepi didapatkan `u1 > u2`, maka garis berada sepenuhnya di **LUAR** window (garis ditolak).
6. Jika valid (`u1 <= u2`), cari nilai koordinat potongan *clip* final:
   - Titik awal (P1) baru: `X_baru1 = x1 + u1 * dx`, `Y_baru1 = y1 + u1 * dy`
   - Titik akhir (P2) baru: `X_baru2 = x1 + u2 * dx`, `Y_baru2 = y1 + u2 * dy`

---
*Dokumen ini dibuat sebagai suplemen laporan untuk menjelaskan logika yang berada di balik program tanpa menggunakan library.*
