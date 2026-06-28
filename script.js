const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const logEl = document.getElementById('output-log');

// Koordinat sistem yang lebih akurat
const scale = 20; // 1 unit = 20 pixel
const offsetX = Math.floor(canvas.width / 2) + 0.5; // +0.5 untuk crisp lines
const offsetY = Math.floor(canvas.height / 2) + 0.5;

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Warna tema
    const gridColor = 'rgba(255, 255, 255, 0.05)';
    const axisColor = 'rgba(0, 240, 255, 0.5)';
    const textColor = 'rgba(148, 163, 184, 0.8)';

    ctx.lineWidth = 1;
    ctx.font = '10px Consolas, monospace';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Gambar Grid & Angka Sumbu X
    for (let x = 0; x <= canvas.width; x += scale) {
        ctx.strokeStyle = gridColor;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        
        let unitX = (x - offsetX) / scale;
        if (unitX !== 0 && unitX % 2 === 0) { // Label tiap 2 unit
            ctx.fillText(unitX, x, offsetY + 12);
        }
    }
    
    // Gambar Grid & Angka Sumbu Y
    for (let y = 0; y <= canvas.height; y += scale) {
        ctx.strokeStyle = gridColor;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        
        let unitY = (offsetY - y) / scale;
        if (unitY !== 0 && unitY % 2 === 0) { // Label tiap 2 unit
            ctx.fillText(unitY, offsetX - 15, y);
        }
    }

    // Sumbu X Utama
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, offsetY); ctx.lineTo(canvas.width, offsetY); ctx.stroke();
    
    // Sumbu Y Utama
    ctx.beginPath(); ctx.moveTo(offsetX, 0); ctx.lineTo(offsetX, canvas.height); ctx.stroke();
    
    // Origin 0
    ctx.fillText('0', offsetX - 8, offsetY + 12);
}

function w2c(x, y) {
    // World to Canvas coordinate
    return {
        x: offsetX + (x * scale),
        y: offsetY - (y * scale)
    };
}

function plotPixel(x, y, color = '#00f0ff') {
    ctx.fillStyle = color;
    let pos = w2c(x, y);
    ctx.fillRect(Math.floor(pos.x) - 2, Math.floor(pos.y) - 2, 5, 5);
}

function drawLine(x0, y0, x1, y1, color = '#00f0ff', width = 2, dash = []) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    let p0 = w2c(x0, y0);
    let p1 = w2c(x1, y1);
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.setLineDash([]);
}

function animateText(text) {
    logEl.textContent = text;
    logEl.style.opacity = 0;
    setTimeout(() => {
        logEl.style.transition = 'opacity 0.5s';
        logEl.style.opacity = 1;
        logEl.scrollTop = logEl.scrollHeight;
    }, 50);
}

// ==========================================
// D. Clipping (Liang-Barsky)
// ==========================================
function liangBarsky(xwmin, ywmin, xwmax, ywmax, x1, y1, x2, y2) {
    drawGrid();
    
    let logText = `> INISIALISASI LIANG-BARSKY\n`;
    logText += `> Window: X[${xwmin}, ${xwmax}], Y[${ywmin}, ${ywmax}]\n`;
    logText += `> Garis : P1(${x1}, ${y1}) -> P2(${x2}, ${y2})\n\n`;

    // Gambar Rectangle Window Clipping (Kuning)
    ctx.strokeStyle = '#facc15'; // Kuning
    ctx.lineWidth = 2;
    let wMin = w2c(xwmin, ywmax); // Kiri Atas canvas
    ctx.strokeRect(wMin.x, wMin.y, Math.abs(xwmax - xwmin) * scale, Math.abs(ywmax - ywmin) * scale);
    
    // Label Window
    ctx.fillStyle = '#facc15';
    ctx.font = '12px Inter';
    ctx.fillText(`Window`, wMin.x + 30, wMin.y - 10);

    // Gambar Garis Asli (Merah, putus-putus)
    drawLine(x1, y1, x2, y2, 'rgba(255, 0, 85, 0.5)', 2, [5, 5]);

    let dx = x2 - x1;
    let dy = y2 - y1;

    let p = [-dx, dx, -dy, dy];
    let q = [x1 - xwmin, xwmax - x1, y1 - ywmin, ywmax - y1];
    let edges = ["Kiri", "Kanan", "Bawah", "Atas"];

    let u1 = 0;
    let u2 = 1;
    let isOutside = false;

    logText += `> EVALUASI PARAMETER (p, q)\n`;
    for (let i = 0; i < 4; i++) {
        logText += `  Batas ${edges[i].padEnd(5)}: p = ${p[i].toString().padEnd(4)}, q = ${q[i]}\n`;
        if (p[i] === 0) {
            if (q[i] < 0) {
                logText += `  -> Garis sejajar & di luar batas (q < 0). REJECTED.\n`;
                isOutside = true;
                break;
            } else {
                logText += `  -> Garis sejajar & di dalam batas.\n`;
            }
        } else {
            let r = q[i] / p[i];
            logText += `  -> r = ${r.toFixed(3)}. `;
            if (p[i] < 0) {
                u1 = Math.max(u1, r);
                logText += `p < 0, u1 = max(u1, r) = ${u1.toFixed(3)}\n`;
            } else {
                u2 = Math.min(u2, r);
                logText += `p > 0, u2 = min(u2, r) = ${u2.toFixed(3)}\n`;
            }
        }
    }

    if (isOutside || u1 > u2) {
        logText += `\n> KESIMPULAN: Garis sepenuhnya DI LUAR window (u1 > u2 atau q < 0).`;
    } else {
        let nx1 = x1 + u1 * dx;
        let ny1 = y1 + u1 * dy;
        let nx2 = x1 + u2 * dx;
        let ny2 = y1 + u2 * dy;

        logText += `\n> HASIL CLIPPING:\n`;
        logText += `  Titik Potong 1: (${nx1.toFixed(2)}, ${ny1.toFixed(2)})\n`;
        logText += `  Titik Potong 2: (${nx2.toFixed(2)}, ${ny2.toFixed(2)})\n`;

        // Titik Potong (Lingkaran)
        ctx.fillStyle = '#00f0ff';
        let cp1 = w2c(nx1, ny1);
        let cp2 = w2c(nx2, ny2);
        ctx.beginPath(); ctx.arc(cp1.x, cp1.y, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cp2.x, cp2.y, 4, 0, Math.PI*2); ctx.fill();

        // Gambar Garis Terpotong (Cyan tebal dengan glow)
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f0ff';
        drawLine(nx1, ny1, nx2, ny2, '#00f0ff', 3);
        ctx.shadowBlur = 0;
    }
    
    animateText(logText);
}

// ==========================================
// A. Algoritma Linear (Bresenham)
// ==========================================
function bresenham(x0, y0, x1, y1) {
    drawGrid();
    
    let logText = `> INISIALISASI BRESENHAM\n`;
    logText += `> Titik: P0(${x0}, ${y0}) -> P1(${x1}, ${y1})\n\n`;
    
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    logText += `> dx = ${dx}, dy = ${dy}, Step X = ${sx}, Step Y = ${sy}\n`;
    logText += `> Error Awal = ${err}\n\n`;
    logText += `Step |   X   |   Y   |  Error \n`;
    logText += `---------------------------------\n`;

    let x = x0;
    let y = y0;
    let i = 0;
    
    // Gambar garis referensi aktual (Pink redup)
    drawLine(x0, y0, x1, y1, 'rgba(255, 0, 85, 0.3)', 1);

    // Render loop per pixel untuk efek akurasi
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#00f0ff';
    
    while (true) {
        logText += ` ${i.toString().padEnd(3)} | ${x.toString().padEnd(5)} | ${y.toString().padEnd(5)} | ${err.toString().padEnd(5)}\n`;
        plotPixel(x, y, '#00f0ff'); // Plot pixel 1 per 1 logic

        if (x === x1 && y === y1) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
        i++;
    }
    ctx.shadowBlur = 0;
    
    logText += `\n> RENDER SELESAI. Total Piksel: ${i+1}`;
    animateText(logText);
}

// ==========================================
// B. Transformasi 2D
// ==========================================
function transformasi() {
    drawGrid();

    const pointsStr = document.getElementById('t-points').value.trim();
    const tx = parseFloat(document.getElementById('t-tx').value);
    const ty = parseFloat(document.getElementById('t-ty').value);
    const sx = parseFloat(document.getElementById('t-sx').value);
    const sy = parseFloat(document.getElementById('t-sy').value);
    const angle = parseFloat(document.getElementById('t-rot').value);

    let points = pointsStr.split('\n').filter(l => l.trim()!=='').map(line => {
        let p = line.split(',');
        return { x: parseFloat(p[0]), y: parseFloat(p[1]) };
    });

    let logText = `> TRANSFORMASI 2D\n\n[1] MATRIKS KOORDINAT AWAL:\n`;
    points.forEach((p, i) => logText += `    P${i} = (${p.x}, ${p.y})\n`);

    function drawPoly(pts, color, width=2, fill="transparent", glow=0) {
        ctx.beginPath();
        pts.forEach((p, i) => {
            let cp = w2c(p.x, p.y);
            if (i === 0) ctx.moveTo(cp.x, cp.y);
            else ctx.lineTo(cp.x, cp.y);
        });
        ctx.closePath();
        if(glow > 0) { ctx.shadowBlur = glow; ctx.shadowColor = color; }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
        if (fill !== "transparent") {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    // Gambar Poligon Awal (Abu-abu)
    drawPoly(points, 'rgba(255,255,255,0.4)', 1, 'rgba(255,255,255,0.05)');

    // 1. Translasi
    let translated = points.map(p => ({ x: p.x + tx, y: p.y + ty }));
    logText += `\n[2] TRANSLASI (Tx=${tx}, Ty=${ty}):\n`;
    translated.forEach((p, i) => logText += `    P${i}' = (${p.x.toFixed(2)}, ${p.y.toFixed(2)})\n`);
    drawPoly(translated, 'rgba(16, 185, 129, 0.4)', 1); // Hijau Redup

    // 2. Scaling (Relatif terhadap origin (0,0))
    let scaled = translated.map(p => ({ x: p.x * sx, y: p.y * sy }));
    logText += `\n[3] SCALING (Sx=${sx}, Sy=${sy}):\n`;
    scaled.forEach((p, i) => logText += `    P${i}'' = (${p.x.toFixed(2)}, ${p.y.toFixed(2)})\n`);
    drawPoly(scaled, 'rgba(255, 0, 85, 0.5)', 1); // Pink Redup

    // 3. Rotasi (Relatif terhadap origin (0,0))
    const rad = angle * Math.PI / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    let rotated = scaled.map(p => ({
        x: (p.x * cosA - p.y * sinA),
        y: (p.x * sinA + p.y * cosA)
    }));
    logText += `\n[4] ROTASI (${angle}° = ${rad.toFixed(2)} rad):\n`;
    rotated.forEach((p, i) => logText += `    P${i}''' = (${p.x.toFixed(2)}, ${p.y.toFixed(2)})\n`);

    // Gambar Hasil Akhir
    drawPoly(rotated, '#00f0ff', 2, 'rgba(0, 240, 255, 0.15)', 10);
    
    logText += `\n> VISUALISASI:\n`;
    logText += `  Putih  : Objek Asli\n`;
    logText += `  Hijau  : Setelah Translasi\n`;
    logText += `  Pink   : Setelah Scaling\n`;
    logText += `  Cyan   : HASIL AKHIR (Setelah Rotasi)`;

    animateText(logText);
}

// ==========================================
// Event Listeners & UI Switcher
// ==========================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        let targetBtn = e.target.closest('.nav-btn');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');

        const target = targetBtn.getAttribute('data-target');
        document.querySelectorAll('.input-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`input-${target}`).classList.add('active');

        const titles = {
            clipping: { t: 'Algoritma Clipping Liang-Barsky', d: 'Implementasi pemotongan presisi terhadap window boundaries.' },
            bresenham: { t: 'Algoritma Garis Bresenham', d: 'Rasterisasi garis per piksel dengan kalkulasi error integer.' },
            transformasi: { t: 'Transformasi Matriks 2D', d: 'Operasi Translasi -> Scaling -> Rotasi secara bertahap.' }
        };
        document.getElementById('page-title').textContent = titles[target].t;
        document.getElementById('page-desc').textContent = titles[target].d;
        
        drawGrid();
        animateText('> Sistem Siap. Menunggu parameter input...');
    });
});

document.getElementById('btn-calc-clipping').addEventListener('click', () => {
    const xmin = parseFloat(document.getElementById('c-xmin').value);
    const ymin = parseFloat(document.getElementById('c-ymin').value);
    const xmax = parseFloat(document.getElementById('c-xmax').value);
    const ymax = parseFloat(document.getElementById('c-ymax').value);
    const x0 = parseFloat(document.getElementById('c-x0').value);
    const y0 = parseFloat(document.getElementById('c-y0').value);
    const x1 = parseFloat(document.getElementById('c-x1').value);
    const y1 = parseFloat(document.getElementById('c-y1').value);
    liangBarsky(xmin, ymin, xmax, ymax, x0, y0, x1, y1);
});

document.getElementById('btn-calc-bresenham').addEventListener('click', () => {
    const x0 = parseInt(document.getElementById('b-x0').value);
    const y0 = parseInt(document.getElementById('b-y0').value);
    const x1 = parseInt(document.getElementById('b-x1').value);
    const y1 = parseInt(document.getElementById('b-y1').value);
    bresenham(x0, y0, x1, y1);
});

document.getElementById('btn-calc-transformasi').addEventListener('click', () => {
    transformasi();
});

// Init Grid
drawGrid();
