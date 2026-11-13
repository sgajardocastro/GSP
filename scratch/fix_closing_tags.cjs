const fs = require('fs');

let content = fs.readFileSync('scratch/Torre_final_assembled.vue', 'utf8');

// The spot before VISTA 2:
const target = `            <div v-if="col.items.length === 0" class="text-center py-8 text-[11px] text-slate-500 italic">
              Sin fichas con los filtros actuales
            </div>
          </div>

    <!-- ========================================================================= -->
    <!-- VISTA 2: VISTA CARDEX — TARJETERO INDEXADO CON ELEVACIÓN DE FICHAS        -->`;

const replacement = `            <div v-if="col.items.length === 0" class="text-center py-8 text-[11px] text-slate-500 italic">
              Sin fichas con los filtros actuales
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- VISTA 2: VISTA CARDEX — TARJETERO INDEXADO CON ELEVACIÓN DE FICHAS        -->`;

if (!content.includes(target)) {
  console.error('Target not found!');
  process.exit(1);
}

content = content.replace(target, replacement);
fs.writeFileSync('scratch/Torre_final_assembled.vue', content, 'utf8');
console.log('Fixed closing tags in scratch/Torre_final_assembled.vue');
