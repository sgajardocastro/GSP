# 🛡️ Regla Canónica: Gobernanza de Almacenamiento, Rutas y Esquemas de Base de Datos

> **Aplica a:** Backend Node.js, Frontend Vue 3, PWA Operador y Scripts de Despliegue.  
> **Estado:** Obligatorio e Inviolable.

---

## 1. 🚫 Prohibición Absoluta de Esquemas Hardcodeados en SQL
1. **Delegación a `search_path`:** Queda terminantemente prohibido escribir nombres de esquemas PostgreSQL (`sch_leangsp.`, `sch_leangsp_prod.`, `sch_transmac.`) en sentencias SQL dentro de controladores, modelos o servicios.
2. **Convención Canónica:** Todas las consultas deben escribir exclusivamente el nombre de la tabla sin prefijo:
   - ✅ Correcto: `SELECT * FROM tpry_proyecto WHERE id_proyecto = $1`
   - ✅ Correcto: `INSERT INTO tope_acta_plataforma (...)`
   - ❌ Prohibido: `SELECT * FROM sch_leangsp.tpry_proyecto ...`
3. **Mecanismo:** El pool de base de datos (`postgresPool.js`) ejecuta al conectar `SET search_path TO ${config.dbSchema}, public`. El esquema activo es resuelto automáticamente por el entorno (`APP_ENV`).
4. **Auditoría de Bloqueo:** Antes de cualquier pase a producción o release, debe ejecutarse:
   `git grep -n "sch_leangsp\." ejecucion/backend_remoto/src`
   Cualquier coincidencia bloquea el despliegue.

---

## 2. 📁 Estándar Estricto de Almacenamiento (LG-Storage Standard)
1. **Jerarquía Única en Disco:**
   `/u05/LeanDocs/{tenant_code}/{app_env}/{modulo}/{YYYY}/{MM}/{filename}`
2. **Catálogo Cerrado de Módulos:**
   El parámetro `modulo` en `buildStoragePath(tenant, modulo)` solo acepta valores del catálogo oficial:
   `['contratos', 'actas', 'cotizaciones', 'ot', 'reportes', 'certificados', 'general']`.
   Queda estrictamente prohibido anidar IDs de proyecto o variables dentro de `modulo` (ej: `actas/109` es inválido).
3. **SSOT en Base de Datos (`tfmg_file`):**
   - En `path_doc` / `path_relativo` SOLO se almacena la ruta relativa POSIX (ej: `GSP/dev/contratos/2026/10`).
   - NUNCA almacenar rutas absolutas `/u05/LeanDocs/...` en base de datos.
4. **Helper Canónico en Cliente:**
   El frontend y PWA deben invocar la URL canónica `/api/archivo/ver/:id_doc` o el helper oficial `getStorageUrl(id_doc)`.

---

## 3. 📚 Contrato de Doble Indexación en la Biblioteca Documental (`Documentos.vue`)
Todo documento emitido en la plataforma debe tener trazabilidad visible inmediata en la Biblioteca:
1. **Dimensión 2 (Flota & Equipos):** Al consultar una máquina física (`id_equipo`), deben mostrarse agregados:
   - Certificados de equipo (`tequ_documentacion`).
   - Actas 360° de Terreno donde participó la máquina (Entrega y Retiro).
   - Contratos de Arriendo vigentes vinculados a la máquina.
2. **Dimensión 4 (Clientes & Procesos OTs):** Toda OT debe listar de forma reactiva:
   - Cotizaciones históricas en PDF.
   - Contrato legal emitido / firmado FES con su `id_doc`.
   - Actas 360° de entrega y retorno.
   - Visitas técnicas e informes diarios de izaje.
