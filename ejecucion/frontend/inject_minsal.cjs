const fs = require('fs');

const vueFile = 'd:\\\\SGajardo\\\\Google Drive\\\\Antigravity\\\\Transmac\\\\frontend\\\\src\\\\views\\\\ListadosMinsal.vue';
let content = fs.readFileSync(vueFile, 'utf8');

const newLoop = `          <div class="divide-y divide-border/30 overflow-y-auto max-h-[600px] scrollbar-hide">
            <div v-for="(segment, sIdx) in checklistData[activeTab]" :key="sIdx" class="w-full flex-col">
              
              <!-- Segment Header Accordion -->
              <button @click="segment.collapsed = !segment.collapsed" class="w-full bg-muted/40 px-6 py-4 flex justify-between items-center transition-colors hover:bg-muted/60 outline-none border-b border-border/30">
                <h3 class="text-[11px] font-extrabold text-emerald-500 uppercase tracking-widest text-left">{{ segment.title }}</h3>
                <ChevronUp v-if="!segment.collapsed" class="w-4 h-4 text-emerald-500 transition-transform" />
                <ChevronDown v-else class="w-4 h-4 text-emerald-500 transition-transform" />
              </button>
              
              <!-- Segment Questions -->
              <div v-show="!segment.collapsed" class="divide-y divide-border/20">
                <div v-for="(item, idx) in segment.questions" :key="idx" class="w-full px-6 py-4 flex hover:bg-muted/10 transition-colors bg-card">
                  <div class="w-12 shrink-0">
                    <span class="font-bold text-emerald-500/70 text-xs">{{ item.id }}</span>
                  </div>
                  <div class="flex-1 pr-4 border-r border-border/30">
                    <p class="text-[12px] font-medium text-foreground/90 leading-relaxed text-justify">
                      {{ item.text }}
                    </p>
                    <p v-if="item.ref" class="text-[10px] text-muted-foreground mt-2 italic border-l-2 border-muted pl-2 whitespace-pre-line">{{ item.ref }}</p>
                  </div>
                  <div class="w-[22%] px-4 flex items-start">
                    <select v-model="item.val" class="w-full bg-background border border-border/50 rounded-lg px-2 py-2 text-center text-[11px] font-semibold text-emerald-400 focus:border-emerald-500 outline-none cursor-pointer appearance-none shadow-sm">
                      <option value="0">Pendiente (0)</option>
                      <option value="0.25">Programado (0.25)</option>
                      <option value="0.5">En desarrollo (0.5)</option>
                      <option value="1">Realizado (1)</option>
                      <option value="NA">N/A</option>
                    </select>
                  </div>
                  <div class="w-16 shrink-0 flex justify-center items-start pt-1">
                    <span class="text-[12px] font-black" :class="getKpiColor(item.val)">{{ item.val === 'NA' ? 'N/A' : (item.val || '0') }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="!checklistData[activeTab] || checklistData[activeTab].length === 0" class="p-12 text-center">
              <p class="text-muted-foreground text-sm uppercase tracking-widest font-bold opacity-50">Sección en Desarrollo / Pauta Pendiente</p>
            </div>
          </div>`;

// Replace loop part
const startIdx = content.indexOf('<div class="divide-y divide-border/30 overflow-y-auto max-h-[600px] scrollbar-hide">');
const endDivStr = '          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</template>';
const endIdx = content.indexOf(endDivStr);

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + newLoop + "\n        </div>\n      </div>\n    </div>\n  </div>\n</template>" + content.substring(endIdx + endDivStr.length);
}

// Replace data block
const checkDataStr = 'const checklistData = reactive(';
const checkDataIdx = content.indexOf(checkDataStr);
if (checkDataIdx !== -1) {
    const dataTxt = fs.readFileSync('minsal_data.txt', 'utf8');
    content = content.substring(0, checkDataIdx) + dataTxt + "\n</script>\n";
}

fs.writeFileSync(vueFile, content);
console.log('Update Complete');
