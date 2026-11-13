const fs = require('fs');

// Read current working Torre.vue (which has working Gantt + PMO OT grouping)
const currentTorre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8');

// Read base recovered (which has the complete kanbanPro & kardex logic + styles)
const baseTorre = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8');

// 1. View selector replacement in currentTorre:
const oldSelector = `      <div class="flex items-center gap-1 bg-[#0b1020] p-1 rounded-xl border border-white/10 shadow-inner">
        <button
          @click="activeView = 'kanban'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
          :class="activeView === 'kanban' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>🗂️</span>
          <span>Kanban</span>
        </button>

        <button
          @click="activeView = 'pmo'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
          :class="activeView === 'pmo' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>📊</span>
          <span>Matriz PMO</span>
        </button>

        <button
          @click="activeView = 'gantt'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
          :class="activeView === 'gantt' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>📅</span>
          <span>Flota Gantt</span>
        </button>

        <button
          @click="activeView = 'contabilidad'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
          :class="activeView === 'contabilidad' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>💼</span>
          <span>Contabilidad</span>
        </button>
      </div>`;

const newSelector = `      <!-- Selector de Vistas Principal -->
      <div class="flex items-center gap-1 bg-[#0b1020] p-1 rounded-xl border border-white/10 shadow-inner">
        <button
          @click="activeView = 'kanban'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="activeView === 'kanban' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'"
          title="Vista Kanban Operativo con filtros avanzados y densidad ajustable"
        >
          <span>🗂️</span>
          <span>Kanban</span>
        </button>

        <button
          @click="activeView = 'kardex'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="activeView === 'kardex' ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20' : 'text-amber-400/90 hover:text-amber-300'"
          title="Vista Cardex: Mueble tarjetero con fichas organizadas por estado"
        >
          <span>🗄️</span>
          <span>Vista Cardex</span>
        </button>

        <button
          @click="activeView = 'pmo'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="activeView === 'pmo' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>📊</span>
          <span>Matriz PMO</span>
        </button>

        <button
          @click="activeView = 'gantt'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="activeView === 'gantt' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>📅</span>
          <span>Flota Gantt</span>
        </button>

        <button
          @click="activeView = 'contabilidad'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="activeView === 'contabilidad' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>💼</span>
          <span>Contabilidad</span>
        </button>
      </div>`;

console.log('Has old selector:', currentTorre.includes(oldSelector));
