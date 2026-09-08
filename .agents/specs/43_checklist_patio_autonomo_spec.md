# 🛡️ Especificación Técnica 43: Protocolo Autónomo de Portón y Checklist de Patio (GSP)

**Código Canónico:** `SPEC-43-CHECKLIST-PATIO-AUTONOMO`  
**Template Asociado:** `Template 79` (`TMPL-GSP-CHECKLIST-PATIO`)  
**Fecha:** 2026-09-07  
**Estado:** `VIGENTE / APROBADA`

---

## 📌 1. Principios Rectores y Diagnóstico Operativo

1. **Autonomía y Desacoplamiento de OT:**
   - La inspección física de patio debe poder realizarse de forma inmediata por el Jefe de Patio, Guardia de Portón o el Conductor/Operador sin requerir una Orden de Trabajo precargada.
   - Para no vulnerar restricciones referenciales de la base de datos (`sch_leangsp.tsrv_survey`), se asocia a la empresa matriz de GSP (`id_empresa_cliente = 9`) y proyecto comodín de patio (`id_proyecto = 94`).

2. **Cero Duplicidad de Datos (Odómetros y Horómetros):**
   - **Principio Fundamental:** El modal de inicio en la PWA es un disparador de acceso rápido, **no** un formulario duplicado.
   - El odómetro, horómetro, estado de cabina, fotografías y niveles mecánicos pertenecen exclusiva y formalmente al **cuerpo del Checklist (Template 79 / `Inspeccion.vue`)**.
   - Queda estrictamente eliminado cualquier input de odómetro y horómetro del modal previo de apertura en la PWA.

3. **Ergonomía de Portón (Alto Contraste y Selección Táctil):**
   - La selección del tipo de movimiento debe presentar contraste inequívoco:
     - `🟢 ENTRADA A PATIO`: Botón sólido verde esmeralda (`color="emerald-darken-2"`, `variant="flat"`) al estar seleccionado; gris oscuro delineado (`variant="outlined"`) al estar inactivo.
     - `🔴 SALIDA A FAENA`: Botón sólido ámbar oscuro (`color="amber-darken-2"`, `variant="flat"`) al estar seleccionado; gris oscuro delineado (`variant="outlined"`) al estar inactivo.
   - El selector de equipos debe resolver la colección completa de la flota mediante autocompletado reactivo en vivo (`<v-autocomplete>`), admitiendo búsqueda por patente, modelo, marca o categoría.

---

## 🚜 2. Contrato de Datos Frontend (PWA `Surveys.vue`)

### 2.1 Estructura del Modal de Portón
```vue
<v-dialog v-model="dialogPatio" max-width="540">
  <v-card class="bg-[#0f172a] text-white border border-slate-700 rounded-xl">
    <!-- Selector de Movimiento Bimodal de Alto Contraste -->
    <div class="d-flex ga-2">
      <v-btn
        class="flex-1 font-black text-xs py-3"
        :color="formPatio.tipo_movimiento === 'ENTRADA' ? 'emerald-darken-2' : 'grey-darken-4'"
        :variant="formPatio.tipo_movimiento === 'ENTRADA' ? 'flat' : 'outlined'"
        @click="formPatio.tipo_movimiento = 'ENTRADA'"
      >
        🟢 ENTRADA A PATIO
      </v-btn>
      <v-btn
        class="flex-1 font-black text-xs py-3"
        :color="formPatio.tipo_movimiento === 'SALIDA' ? 'amber-darken-2' : 'grey-darken-4'"
        :variant="formPatio.tipo_movimiento === 'SALIDA' ? 'flat' : 'outlined'"
        @click="formPatio.tipo_movimiento = 'SALIDA'"
      >
        🔴 SALIDA A FAENA
      </v-btn>
    </div>

    <!-- Autocompletado de Flota -->
    <v-autocomplete
      v-model="formPatio.equipoSeleccionado"
      :items="equiposPatio"
      item-title="display_label"
      return-object
      label="Buscar Equipo o Patente (ej: 1070, LTM, Patente)"
      :loading="cargandoEquiposPatio"
      clearable
    />

    <!-- Novedad / Observación opcional de portón -->
    <v-textarea
      v-model="formPatio.observaciones"
      label="Observación o novedad de portón (opcional)"
      rows="2"
    />
  </v-card>
</v-dialog>
```

### 2.2 Consumo de Endpoint de Flota
- **Endpoint:** `GET /api/operaciones/patio/equipos`
- **Mapeo de Datos:** El controlador responde `{ success: true, data: [...] }`. El cliente debe mapear:
  ```javascript
  const lista = data?.data || data?.equipos || [];
  equiposPatio.value = Array.isArray(lista) ? lista : [];
  ```

---

## 📡 3. Contrato de Invocación (`POST /api/operaciones/patio/iniciar`)

- **Payload de Solicitud:**
  ```json
  {
    "tipo_movimiento": "ENTRADA" | "SALIDA",
    "patente": "AB-CD-12",
    "id_equipo": 45,
    "id_user": 53,
    "observaciones": "Ingreso con novedad en neumático trasero"
  }
  ```
- **Respuesta Exitosa (HTTP 201):**
  ```json
  {
    "success": true,
    "id_survey": 276,
    "message": "Inspección autónoma de patio iniciada exitosamente"
  }
  ```
- **Redirección Inmediata:**
  `router.push({ path: '/inspeccion', query: { idInspeccion: String(data.id_survey) } })`

---

## 📑 4. Estructura Interna del Checklist (Template 79)
El levantamiento técnico de terreno se realiza íntegramente dentro de `Inspeccion.vue` a través de los 8 segmentos canónicos:
1. `1. DATOS GENERALES DE LA INSPECCIÓN` (Tipo de movimiento, patente, categoría, inspector).
2. `2. ESTADO DE CABINA E ILUMINACIÓN` (Odómetro/horómetro con foto del tablero, balizas, plumillas, focos).
3. `3. NIVELES MECÁNICOS Y FLUIDOS` (Aceite motor, refrigerante, hidráulico, transmisión).
4. `4. NEUMÁTICOS, TREN RODANTE Y FRENOS` (Presión, cortes, torque tuercas, fugas de aire).
5. `5. ESTRUCTURA Y ELEMENTOS DE IZAJE` (Pluma telescópica, pastecas, cables, estabilizadores).
6. `6. IMPLEMENTOS Y ACCESORIOS DE MANIOBRA` (Eslingas, grilletes, estrobos, fajas).
7. `7. DOCUMENTACIÓN TÉCNICA Y SEGURIDAD` (Certificación vigente, extintor, botiquín, cuñas).
8. `8. CONFORMIDAD Y FIRMAS` (Firma digital FES del operador y visto bueno del jefe de patio).
