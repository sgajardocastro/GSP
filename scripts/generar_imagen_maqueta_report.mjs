import puppeteer from '../ejecucion/backend_remoto/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1050, deviceScaleFactor: 2 });

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Maqueta Visual - Intervención ModalVisorReport</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #030712; color: #f3f4f6; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="p-6 flex items-center justify-center min-h-screen">

  <!-- MODAL CONTAINER (Exact Replica of ModalVisorReport.vue) -->
  <div class="bg-[#0b1021] border border-amber-500/50 rounded-2xl w-full max-w-[1300px] overflow-hidden shadow-2xl shadow-black relative">
    
    <!-- HEADER -->
    <div class="bg-[#050810] px-6 py-3.5 border-b border-white/10 flex justify-between items-center">
      <div class="flex items-center gap-3">
        <span class="text-3xl">📋</span>
        <div>
          <div class="flex items-center gap-2.5">
            <h3 class="text-base font-black text-white uppercase tracking-wider font-mono">
              Report Diario Digital — Día 1 <span class="text-amber-400 font-normal">· #2841</span>
            </h3>
            <span class="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
              ✅ Validado FES (Yara Mendoza)
            </span>
            <span class="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border bg-blue-500/20 text-blue-300 border-blue-500/40">
              📍 Régimen: RURAL
            </span>
          </div>
          <p class="text-xs text-slate-300 mt-0.5">
            OT: <strong class="text-amber-400 font-mono">GSP-2610-233-004</strong> • 
            Cliente: <span class="text-slate-100 font-semibold">TENSACON S.A.</span> • 
            Faena: <span class="text-slate-100 font-semibold">Planta Ferrero (San Francisco de Mostazal)</span> • 
            Fecha: <span class="text-slate-100 font-semibold">24/10/2026</span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <span class="px-3 py-1.5 text-xs font-bold font-mono rounded-lg border border-red-500/40 bg-red-500/15 text-red-200 flex items-center gap-1.5">
          <span>📄</span>
          <span>PDF Firmado FES</span>
          <span class="text-[9px] bg-red-950/80 text-red-300 px-1 py-0.5 rounded border border-red-500/40">FES-8F29A1</span>
        </span>
        <span class="text-slate-400 text-2xl px-2 font-bold">✕</span>
      </div>
    </div>

    <!-- CUERPO EN 2 COLUMNAS (GRID 12 COLS) -->
    <div class="p-5 grid grid-cols-12 gap-5">
      
      <!-- ================= COLUMNA IZQUIERDA (7 COLS) ================= -->
      <div class="col-span-7 flex flex-col gap-4">
        
        <!-- RESUMEN DE PERSONAL Y EQUIPO -->
        <div class="grid grid-cols-4 gap-2 bg-[#080d1a] border border-white/10 rounded-xl p-3 text-xs">
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">🚚 Grúa en Terreno</span>
            <strong class="text-amber-300 font-mono text-xs block mt-0.5">PJYY.20-1</strong>
            <span class="text-[10px] text-slate-400 block truncate">LIEBHERR LTM-1090 (90 Ton)</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">👷 Operador Asignado</span>
            <strong class="text-white text-xs block mt-0.5">Robert Rodríguez</strong>
            <span class="text-[10px] text-slate-400">GSP Operaciones</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">🦺 Rigger Asistente</span>
            <strong class="text-white text-xs block mt-0.5">Alan Sarpi</strong>
            <span class="text-[10px] text-slate-400">Rigger Certificado</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">📋 Base Mínima OT</span>
            <strong class="text-emerald-400 font-mono text-xs block mt-0.5">9.0 hrs</strong>
            <span class="text-[10px] text-slate-400 block">Piso Mínimo Pactado</span>
          </div>
        </div>

        <!-- SECCIÓN 1: DATOS REPORTADOS POR OPERACIONES EN FAENA (EXISTENTE INTACTA) -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>📝</span>
              <span>1. Datos de Faena Reportados por el Operador en Terreno</span>
            </span>
            <span class="text-[10px] text-slate-400 font-mono">Report Diario PWA</span>
          </div>

          <div class="grid grid-cols-3 gap-2.5">
            <!-- Horario Faena -->
            <div class="bg-[#050810] border border-white/10 rounded-xl p-3">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">⏱️ Horario Faena Obra</span>
              <div class="text-xs font-mono font-bold text-white mt-1">
                08:30 ➔ 18:00
              </div>
              <div class="pt-2 border-t border-white/5 mt-2 flex justify-between text-[11px] text-slate-300">
                <span>Colación:</span>
                <span class="font-mono font-bold text-amber-300">-1.0 hr</span>
              </div>
            </div>

            <!-- Horómetro Motor -->
            <div class="bg-[#050810] border border-white/10 rounded-xl p-3">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">⚙️ Horómetro Motor</span>
              <div class="text-xs font-mono font-bold text-amber-400 mt-1">
                4.821,4 ➔ 4.829,8
              </div>
              <div class="pt-2 border-t border-white/5 mt-2 flex justify-between text-[11px] text-slate-300">
                <span>Δ Motor:</span>
                <strong class="font-mono text-white">8.4 hrs</strong>
              </div>
            </div>

            <!-- Odómetro Chasis -->
            <div class="bg-[#050810] border border-white/10 rounded-xl p-3">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">🛣️ Odómetro Chasis</span>
              <div class="text-xs font-mono font-bold text-slate-200 mt-1">
                112.430 ➔ 112.585 km
              </div>
              <div class="pt-2 border-t border-white/5 mt-2 flex justify-between text-[11px] text-slate-300">
                <span>Δ Distancia:</span>
                <strong class="font-mono text-white">155 km</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: CÁLCULO DE FACTURACIÓN CLIENTE (EXISTENTE INTACTA) -->
        <div class="space-y-1.5">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span>⚡</span>
            <span>2. Liquidación Comercial Mandante (Perspectiva Cliente)</span>
          </span>

          <div class="grid grid-cols-3 gap-2.5">
            <div class="bg-[#050810] border border-white/10 rounded-xl p-3">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">⏱️ Operación Faena</span>
              <div class="text-xl font-black font-mono text-white mt-1">
                8.5 <span class="text-[10px] text-slate-400 font-normal">HRS</span>
              </div>
              <div class="text-[10px] text-slate-400 font-mono mt-1">
                (9.5h brutas - 1.0h colación)
              </div>
            </div>

            <div class="bg-[#050810] border border-amber-500/30 bg-amber-950/10 rounded-xl p-3">
              <span class="text-[10px] text-amber-400 font-bold uppercase block">💰 Horas a Facturar</span>
              <div class="text-xl font-black font-mono text-amber-400 mt-1">
                9.0 <span class="text-[10px] text-amber-300 font-normal">HRS</span>
              </div>
              <div class="text-[10px] text-amber-300/80 font-mono mt-1">
                Ajustado a piso mínimo (9h)
              </div>
            </div>

            <div class="bg-[#050810] border border-white/10 rounded-xl p-3">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">🌙 Sobretiempo Faena</span>
              <div class="text-xl font-black font-mono text-slate-300 mt-1">
                0.0 <span class="text-[10px] text-slate-400 font-normal">HRS</span>
              </div>
              <div class="text-[10px] text-slate-500 font-mono mt-1">
                Sin sobretiempo en obra
              </div>
            </div>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- 🔴🔴🔴 AQUÍ SE INTERVIENE: NUEVA SECCIÓN 3 DE NÓMINA OPERADOR 🔴🔴🔴 -->
        <!-- ================================================================= -->
        <div class="relative mt-2">
          <!-- GLOW CALLOUT BOX -->
          <div class="absolute -top-3.5 left-4 z-10 bg-cyan-400 text-slate-950 text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg shadow-cyan-500/50 flex items-center gap-1.5 border border-cyan-200">
            <span>📍</span>
            <span>AQUÍ SE INTERVIENE: 3. Liquidación Operador (Cruce con Viaje)</span>
          </div>

          <div class="border-2 border-cyan-400 bg-cyan-950/30 rounded-2xl p-4 pt-5 space-y-3 shadow-2xl shadow-cyan-950 ring-2 ring-cyan-500/40">
            <div class="flex items-center justify-between border-b border-cyan-500/30 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-base">👷</span>
                <span class="text-xs font-mono font-black text-cyan-300 uppercase tracking-wider">
                  Cómputo Nómina Operador & Viáticos Tabulares (Control de Gestión)
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-mono text-slate-400">Origen de Datos:</span>
                <span class="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded">
                  Registro de Viaje (tequ_log_desplazamiento)
                </span>
              </div>
            </div>

            <!-- CUADRO DE HORARIOS DE VIAJE (ORIGEN REAL) -->
            <div class="grid grid-cols-4 gap-2 text-xs font-mono">
              <div class="bg-black/60 p-2.5 rounded-xl border border-cyan-500/30">
                <span class="text-[9px] text-slate-400 uppercase font-bold block">🚀 Salida Planta GSP</span>
                <strong class="text-white text-sm block mt-0.5">07:00</strong>
                <span class="text-[9px] text-slate-500">Base Santiago</span>
              </div>
              <div class="bg-black/60 p-2.5 rounded-xl border border-cyan-500/30">
                <span class="text-[9px] text-slate-400 uppercase font-bold block">🏁 Retorno Planta GSP</span>
                <strong class="text-white text-sm block mt-0.5">19:30</strong>
                <span class="text-[9px] text-slate-500">Llegada efectiva</span>
              </div>
              <div class="bg-black/60 p-2.5 rounded-xl border border-cyan-500/30">
                <span class="text-[9px] text-slate-400 uppercase font-bold block">⏱️ Amplitud Viaje</span>
                <strong class="text-cyan-300 text-sm block mt-0.5">12.5 hrs</strong>
                <span class="text-[9px] text-slate-400">Total fuera de base</span>
              </div>
              <div class="bg-black/60 p-2.5 rounded-xl border border-cyan-500/30">
                <span class="text-[9px] text-slate-400 uppercase font-bold block">🚜 Tonelaje Cotizado</span>
                <strong class="text-amber-400 text-sm block mt-0.5">80 TON</strong>
                <span class="text-[9px] text-slate-400">Tarifa: $6.000/hr</span>
              </div>
            </div>

            <!-- RESULTADO COMPUTADO PARA MARITZA / NÓMINA -->
            <div class="grid grid-cols-3 gap-2.5 pt-1 text-xs">
              <div class="bg-[#050810] border border-cyan-500/40 rounded-xl p-3">
                <span class="text-[10px] text-slate-400 font-bold uppercase block">🚚 Flete Reconocido</span>
                <div class="text-lg font-black font-mono text-cyan-400 mt-0.5">
                  +2.5 <span class="text-[10px] font-normal text-slate-400">HRS</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-1 leading-tight">
                  Regla Rural: Excedente de traslado (12.5h - 1h col - 9h mín)
                </div>
              </div>

              <div class="bg-[#050810] border border-emerald-500/40 rounded-xl p-3">
                <span class="text-[10px] text-emerald-400 font-bold uppercase block">🍱 Viático Alimentación</span>
                <div class="text-lg font-black font-mono text-emerald-300 mt-0.5">
                  $18.500 <span class="text-[10px] font-normal text-slate-400">CLP</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-1 leading-tight">
                  Tabla: Desayuno + Almuerzo + Cena (07:00 a 19:30)
                </div>
              </div>

              <div class="bg-[#050810] border border-amber-500/40 rounded-xl p-3">
                <span class="text-[10px] text-amber-400 font-bold uppercase block">💵 Total Día Operador</span>
                <div class="text-lg font-black font-mono text-amber-300 mt-0.5">
                  $87.500 <span class="text-[10px] font-normal text-slate-400">CLP</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-1 leading-tight">
                  (11.5 hrs x $6.000) + $18.500 viático
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- ================= COLUMNA DERECHA (5 COLS) ================= -->
      <div class="col-span-5 flex flex-col gap-4">
        
        <!-- FIRMA CLIENTE EN TERRENO & GPS (EXISTENTE INTACTA) -->
        <div class="bg-[#080d1a] border border-amber-500/30 rounded-xl p-3.5 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              ✍️ Firma Mandante & GPS en Faena
            </span>
            <span class="text-[10px] text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
              18:05:22
            </span>
          </div>

          <div class="bg-black/40 p-2 rounded-lg border border-white/5 text-xs grid grid-cols-3 gap-2">
            <div>
              <span class="text-slate-400 text-[10px] uppercase font-bold block">Supervisor</span>
              <strong class="text-white text-[11px] block truncate">Carlos Venegas</strong>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] uppercase font-bold block">RUT</span>
              <strong class="text-amber-300 font-mono text-[11px] block truncate">14.321.890-K</strong>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] uppercase font-bold block">Cargo</span>
              <strong class="text-slate-200 text-[11px] block truncate">Jefe Montaje</strong>
            </div>
          </div>

          <!-- TRAZO FIRMA -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase block mb-1">✍️ Firma Capturada</span>
              <div class="bg-white rounded-lg p-2 h-24 flex items-center justify-center border border-slate-300">
                <svg viewBox="0 0 200 80" class="w-full h-full stroke-blue-900 fill-none stroke-[3] stroke-linecap-round">
                  <path d="M 20 45 Q 40 10, 60 45 T 100 40 T 140 20 T 180 50 Q 150 70, 90 60 Q 40 50, 160 55" />
                </svg>
              </div>
            </div>

            <div>
              <span class="text-[10px] font-bold text-emerald-400 uppercase block mb-1">📍 Georreferencia GPS</span>
              <div class="bg-slate-900 rounded-lg p-2 h-24 border border-white/10 flex flex-col justify-center items-center text-center">
                <span class="text-xl">🗺️</span>
                <span class="text-[10px] font-mono text-emerald-300 mt-1">-33.9821, -70.7104</span>
                <span class="text-[9px] text-slate-400">San Francisco de Mostazal</span>
              </div>
            </div>
          </div>
        </div>

        <!-- FOTOS DE TABLERO Y AUDITORÍA FES (EXISTENTE INTACTA) -->
        <div class="bg-[#080d1a] border border-white/10 rounded-xl p-3.5 space-y-2">
          <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block">
            📸 Fotos de Horómetro y Tablero
          </span>
          <div class="grid grid-cols-2 gap-2 text-center text-xs">
            <div class="bg-black/50 p-2 rounded-lg border border-emerald-500/30">
              <span class="text-[10px] text-emerald-400 font-bold block mb-1">🟢 Inicio Faena</span>
              <div class="h-16 bg-slate-900 rounded flex items-center justify-center border border-white/10 text-slate-500 text-xs">
                [Foto Horómetro 4.821,4]
              </div>
            </div>
            <div class="bg-black/50 p-2 rounded-lg border border-rose-500/30">
              <span class="text-[10px] text-rose-400 font-bold block mb-1">🔴 Término Faena</span>
              <div class="h-16 bg-slate-900 rounded flex items-center justify-center border border-white/10 text-slate-500 text-xs">
                [Foto Horómetro 4.829,8]
              </div>
            </div>
          </div>
        </div>

        <!-- CONTROL DE GESTIÓN Y SELLO FES -->
        <div class="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-3.5 text-xs space-y-2">
          <div class="flex items-center justify-between text-emerald-400 font-bold uppercase font-mono">
            <span>🛡️ Validación Control de Gestión</span>
            <span class="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">FES ACTIVO</span>
          </div>
          <div class="text-[11px] text-slate-300">
            Validador: <strong class="text-white">Yara Mendoza</strong> (Control de Gestión)
          </div>
          <div class="bg-black/60 p-2 rounded border border-emerald-500/30 font-mono text-[10px] text-emerald-300 flex justify-between">
            <span>Sello FES: FES-YARA-20261024-004</span>
            <span class="text-slate-400">Ley 19.799</span>
          </div>
        </div>

      </div>

    </div>

  </div>

</body>
</html>`;

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const artifactDir = 'C:\\Users\\sgaja\\.gemini\\antigravity\\brain\\73bb4c73-b56c-4f0c-a8e6-72a2e2272c01';
  const outputPath = path.join(artifactDir, 'maqueta_intervencion_formulario_visor_report.png');

  await page.screenshot({
    path: outputPath,
    fullPage: false,
    clip: { x: 0, y: 0, width: 1400, height: 1020 }
  });

  console.log('✅ Screenshot generado con éxito en:', outputPath);
  await browser.close();
}

main().catch(err => {
  console.error('Error generando screenshot:', err);
  process.exit(1);
});
