# 📐 Especificación Técnica: SPEC-122
## Reestructuración de Layout a Dos Paneles y Despliegue de PDF con Consola Lateral en ModalITS

* **Identificador:** `SPEC-122`
* **Requerimiento Asociado:** `REQ-1136`
* **Caso de Soporte:** `CASO-20261109-06`
* **Componente:** `ejecucion/frontend/src/components/Operaciones/ModalITS.vue`
* **Versión de Implementación:** `v1.0.205`
* **Fecha:** 2026-11-09
* **Autor:** Sergio Gajardo / Antigravity

---

## 1. Contexto y Problema del Negocio
En el flujo aprobatorio del Informe de Término de Servicio (ITS), los pasos directivos (Paso 2: Jefatura de Operaciones con Jorge Ponce / Alfonso Porperrello; Paso 3: Jefatura de Contabilidad con Felipe Julio) operan bajo el **Modo de Revisión Ejecutiva** (`esModoRevisionEjecutiva`).

En la reunión de coordinación del 09 de noviembre de 2026, Jorge Ponce reportó:
1. **Vista Aplastada del PDF:** En pantallas de escritorio estándar, el contenedor del visor PDF en el modal se comprime verticalmente, perdiendo legibilidad documental y obligando a hacer scroll interno excesivo.
2. **Ubicación Inadecuada de Firmas y Observaciones:** Los controles de decisión estaban ubicados en una barra inferior horizontal fija, separada del flujo de lectura del revisor.

**Acuerdo Formal de Reunión:**
> *"Se acordó que la vista previa del ITS se muestre como un PDF normal con la firma y la observación ubicadas a un costado."*

---

## 2. Diagnóstico de Causa Raíz Técnica
1. En `ModalITS.vue`, la caja contenedora del modal utiliza `max-h-[96vh]` sin una altura mínima forzada (`min-h-[85vh]` o `h-[90vh]`) en el viewport de revisión ejecutiva.
2. El contenedor del `iframe` dentro de un layout flex vertical (`flex flex-col`) colapsa a la altura intrínseca calculada por el motor de renderizado de ciertos navegadores.
3. La disposición vertical monolítica (header -> visor comprimido -> footer de botones) desperdicia el ancho horizontal de pantallas panorámicas (16:9 / 1080p y 2K).

---

## 3. Solución de Arquitectura ("Cero Parches")

### 3.1. Layout de 2 Paneles (`flex flex-row h-full min-h-[80vh]`)
En `ModalITS.vue`, para `esModoRevisionEjecutiva && vistaRevisionActiva === 'PDF'`:
```html
<div class="flex-1 flex flex-col md:flex-row min-h-[82vh] max-h-[86vh] overflow-hidden bg-slate-950">
  <!-- PANEL IZQUIERDO: VISOR DOCUMENTAL (70% - 75% ANCHO) -->
  <div class="flex-1 flex flex-col min-w-0 bg-slate-900 border-r border-white/10 relative">
    ... Barra superior con botón ↗ Abrir en Nueva Ventana y 🔄 Actualizar ...
    <div class="flex-1 relative w-full h-full overflow-hidden bg-[#1e293b]">
      <iframe :src="urlPdfPreviewIframe" class="w-full h-full border-0" ... />
    </div>
  </div>

  <!-- PANEL DERECHO: CONSOLA LATERAL DE DECISIÓN Y FIRMA FES (380px FIJO) -->
  <aside class="w-full md:w-[380px] lg:w-[420px] flex flex-col bg-[#050810] border-t md:border-t-0 border-white/10 p-5 space-y-4 shrink-0 overflow-y-auto">
    ... Ficha Ejecutiva del ITS y Paso Pendiente ...
    ... Cuadro de Observaciones Directas para Devolución ...
    ... Historial Cronológico de Revisiones y Devoluciones ...
    ... Botones de Decisión: 🔏 Aprobar ITS (PIN FES) y ❌ Devolver con Observaciones ...
  </aside>
</div>
```

### 3.2. Beneficios de Usabilidad y Experiencia
1. **Lectura Documental Fluida:** El PDF oficial formalizado por Yiara Mendoza en Paso 1 se visualiza en alta definición y con proporciones naturales sin aplastamiento.
2. **Ergonomía de Aprobación:** La Jefatura de Operaciones o Contabilidad lee el documento y, en la misma línea visual a la derecha, introduce observaciones y estampa su firma PIN FES sin perder de vista los datos del informe.

---

## 4. Criterios de Aceptación y Pruebas
1. En modo revisión ejecutiva, el visor PDF debe desplegarse en layout de 2 paneles (PDF amplio a la izquierda, firma y observaciones a la derecha).
2. La altura del visor no debe colapsar ni verse aplastada (mínimo `80vh`).
3. El botón `↗ Abrir en Pestaña` debe abrir el PDF oficial en una nueva pestaña del navegador.
4. Las acciones `🔏 Aprobar ITS` y `❌ Devolver con Observaciones` deben ejecutarse correctamente desde el panel lateral.
5. `npm run build` en frontend debe compilar con 0 errores.
