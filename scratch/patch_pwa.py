import sys, shutil

# 1. 541.e8b54b5f.js (ViajeConductor)
f541 = '/var/www/html/pwa-gsp-prod/js/541.e8b54b5f.js'
shutil.copyfile(f541, f541 + '.bak')

with open(f541, 'r', encoding='utf-8') as f:
    c = f.read()

# Salida horometro
t1 = 'if(t>0&&o<t)return void alert(`\U0001F6A8 Valor Incremental Inv\u00e1lido:\\n\\nEl Hor\u00f3metro de Salida (${o} HRS) no puede ser menor al \u00faltimo registro acumulado del equipo (${t} HRS).`);'
r1 = 'if(t>0&&o<t)console.warn(`[REQ-1143] Hor\u00f3metro Salida (${o} HRS) menor al acumulado (${t} HRS).`);'

# Salida odometro
t2 = 'if(a>0&&e<a)return void alert(`\U0001F6A8 Valor Incremental Inv\u00e1lido:\\n\\nEl Od\u00f3metro de Salida (${e} KM) no puede ser menor al \u00faltimo registro acumulado del equipo (${a} KM).`);'
r2 = 'if(a>0&&e<a)console.warn(`[REQ-1143] Od\u00f3metro Salida (${e} KM) menor al acumulado (${a} KM).`);'

# Llegada horometro
t3 = 'if(t>0&&o<t)return void alert(`\U0001F6A8 Valor Incremental Inv\u00e1lido:\\n\\nEl Hor\u00f3metro de Llegada (${o} HRS) no puede ser menor al Hor\u00f3metro de Salida (${t} HRS).`);'
r3 = 'if(t>0&&o<t)console.warn(`[REQ-1143] Hor\u00f3metro Llegada (${o} HRS) menor a Salida (${t} HRS).`);'

# Llegada odometro
t4 = 'if(a>0&&e<a)return void alert(`\U0001F6A8 Valor Incremental Inv\u00e1lido:\\n\\nEl Od\u00f3metro de Llegada (${e} KM) no puede ser menor al Od\u00f3metro de Salida (${a} KM).`);'
r4 = 'if(a>0&&e<a)console.warn(`[REQ-1143] Od\u00f3metro Llegada (${e} KM) menor a Salida (${a} KM).`);'

cnt = 0
for t, r in [(t1, r1), (t2, r2), (t3, r3), (t4, r4)]:
    if t in c:
        c = c.replace(t, r)
        cnt += 1
    else:
        print(f"WARN: target not found: {t[:40]}")

with open(f541, 'w', encoding='utf-8') as f:
    f.write(c)
print(f"541.e8b54b5f.js: {cnt}/4 replacements done.")

# 2. 943.3cbaa13d.js (ReportDiarioIzaje)
f943 = '/var/www/html/pwa-gsp-prod/js/943.3cbaa13d.js'
shutil.copyfile(f943, f943 + '.bak')

with open(f943, 'r', encoding='utf-8') as f:
    c943 = f.read()

# Inicio Report
t_rep = 'if(oo.value>0&&Number(io.horometro_inicio)<oo.value)return no.text=`\u26a0\ufe0f El Hor\u00f3metro de Inicio (${io.horometro_inicio} hrs) no puede ser menor al \u00faltimo hor\u00f3metro registrado (${oo.value} hrs).`,no.color="error",void(no.show=!0);'
r_rep = 'if(oo.value>0&&Number(io.horometro_inicio)<oo.value)console.warn(`[REQ-1143] Hor\u00f3metro de Inicio (${io.horometro_inicio} hrs) menor al sugerido (${oo.value} hrs).`);'

cnt_rep = 0
if t_rep in c943:
    c943 = c943.replace(t_rep, r_rep)
    cnt_rep += 1
else:
    print(f"WARN: t_rep not found in 943")

with open(f943, 'w', encoding='utf-8') as f:
    f.write(c943)
print(f"943.3cbaa13d.js: {cnt_rep}/1 replacement done.")
