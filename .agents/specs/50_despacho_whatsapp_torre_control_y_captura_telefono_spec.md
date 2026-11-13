# 📐 Especificación Técnica: Integración de Despacho WhatsApp en Torre de Control y Protocolo de Captura de Teléfono (Spec 50)

**Documento:** `50_despacho_whatsapp_torre_control_y_captura_telefono_spec.md`  
**Ecosistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Fase de Dominio:** Torre de Control Operativa (`Torre.vue`), Preparación de Salida / Convoy (`preparacion_salida`), Control de Reports Diarios (`reports`)  
**Estado:** `PROPUESTA FORMAL DE ESPECIFICACIÓN (EN REVISIÓN)`  
**Fecha de Creación:** 21 de Septiembre de 2026  
**Autor:** Sergio Gajardo (LeanGlobal) / Jorge Ponce (Grúas San Pablo)  

---

## 1. 📌 Diagnóstico y Justificación Operacional

### 1.1. Contexto de Operación
En el flujo operativo de Grúas San Pablo, el coordinador de operaciones en la **Torre de Control** asigna los equipos (grúas telescópicas, camiones pluma, camiones cama baja) y el personal (operadores, choferes, riggers) a cada Orden de Trabajo (OT).

Para que la experiencia en terreno sea exitosa y sin fricción técnica:
1. El operador no debe ingresar a portales complejos ni recordar credenciales en faena: el acceso debe llegarle directo a su **WhatsApp personal** mediante un enlace web único (`https://servidor.leanglobal.cl/lg-gsp-dev/viaje/:token`).
2. La Torre de Control requiere un mecanismo de **1 solo clic** para despachar este enlace al conductor cuando el convoy sale de base, y otro para recordar la confección del **Report Diario de Izaje** al final de la jornada.

### 1.2. Problemática Detectada: Ausencia de Teléfono en Ficha del Personal
En la base de datos operativa (`tsec_users`, `tper_personal`), parte del personal de faena no cuenta con su número telefónico registrado (`movil`, `celular` o `telefono` vacíos o nulos). 
* **Riesgo:** Si el sistema asume que el teléfono siempre existe, el envío fallará silenciosamente, generará errores en consola o frustrará al coordinador de operaciones.
* **Solución de Dominio:** Implementar un **Protocolo de Captura al Vuelo (Fallback Asistido)** que detecte la falta de número, alerte visualmente al coordinador, y le permita ingresar el teléfono en una micro-ventana modal instantánea para despachar en el acto y opcionalmente persistirlo en la ficha del operador.

---

## 2. 🎯 Puntos de Integración en la Torre de Control (`GestorOportunidades.vue`)

### 2.1. Punto 1: Despacho de Ruta en Convoy (`operacionesSubTab === 'preparacion_salida'`)
* **Ubicación:** Dentro del bloque `Panel de Monitoreo de Convoy & Enlaces de Viaje Móvil (/viaje/:token)`.
* **Elemento:** En cada tarjeta de vehículo (`viajesConvoyLista`), junto a los botones `[ Ver Mapa ]` y `[ Copiar Link ]`:
  * **Botón Activo:** `[ 📲 Despachar WhatsApp Viaje ]`
  * **Indicador de Teléfono:** Muestra el número formateado (`+56 9 XXXX XXXX`) o un badge de alerta `[ ⚠️ Sin Teléfono ]`.
* **Payload del Mensaje 1 (Despacho de Viaje):**
  ```text
  🚛 *GRÚAS SAN PABLO - HOJA DE RUTA OPERACIONAL*
  Estimado(a) *{chofer_nombre}*:
  Se ha generado su Hoja de Ruta para el servicio:
  
  📋 *OT:* {codi_proyecto}
  🏗️ *Equipo:* {patente} ({modelo})
  🏢 *Cliente:* {nombre_cliente}
  📍 *Destino:* {obra_destino}
  
  👉 Inicie su viaje y registre odómetro aquí:
  https://servidor.leanglobal.cl/lg-gsp-dev/viaje/{token}
  
  _Buen viaje y conduzca con precaución._
  ```

### 2.2. Punto 2: Recordatorio de Report Diario de Izaje (`operacionesSubTab === 'reports'`)
* **Ubicación:** En la barra superior de `Control de Ejecución & Reports Diarios de Izaje` (junto al botón `Refrescar`).
* **Elemento:** 
  * Botón: `[ 📲 Recordar Report Diario por WhatsApp ]`
  * Si hay múltiples operadores en el proyecto, permite seleccionar a qué operador notificar o notificar a toda la tripulación activa.
* **Payload del Mensaje 2 (Recordatorio Report Diario):**
  ```text
  📋 *GRÚAS SAN PABLO - RECORDATORIO REPORT DIARIO*
  Estimado(a) *{chofer_nombre}*:
  Favor recuerde ingresar y firmar el Report Diario de hoy en faena:
  
  📋 *OT:* {codi_proyecto} - {nombre_cliente}
  🚜 *Equipo:* {patente}
  
  👉 Abra el Report Diario y solicite la firma del mandante:
  https://servidor.leanglobal.cl/lg-gsp-dev/viaje/{token}?fase=reporte
  
  _Recuerde registrar horómetros y firma antes de finalizar el turno._
  ```

---

## 3. 🛡️ Protocolo UX para Operadores Sin Teléfono Registrado

### 3.1. Detección Jerárquica del Teléfono
El sistema buscará el teléfono del operador siguiendo el siguiente orden de resolución:
```javascript
const telefono = 
  vj.operador_telefono ||
  operadorObj?.movil ||
  operadorObj?.celular ||
  operadorObj?.telefono ||
  opportunity.value?.json_field?.ejecucion_v1?.telefonos_tripulacion?.[id_user] ||
  ''
```

### 3.2. Estados del Botón de Despacho
1. **Con Teléfono Válido:**
   * Botón estilizado verde/emerald: `[ 📲 WhatsApp (+569...) ]`.
   * Un clic despacha directamente al microservicio `/lg-gsp-dev/whatsapp/enviar`.
2. **Sin Teléfono Registrado:**
   * Botón estilizado ámbar/advertencia: `[ ⚠️ Despachar (Sin Fono) ]`.
   * Al hacer clic, se despliega el **Micro-Modal de Captura al Vuelo**.

### 3.3. Micro-Modal de Captura al Vuelo (`ModalCapturaTelefono.vue`)
* **Campos:**
  * Nombre del Operador: *[ Juan Pérez ] (Solo Lectura)*
  * Input Teléfono: Campo numérico formateado para Chile: `+56 9 [ ________ ]` (8 dígitos).
  * Checkbox: `[x] Guardar este teléfono en la ficha del trabajador para futuros servicios`.
* **Botones de Acción:**
  * `[ Cancelar ]`
  * `[ 📋 Copiar Enlace ]` (Copia el link al portapapeles sin enviar WhatsApp).
  * `[ 🚀 Enviar WhatsApp Ahora ]` (Valida formato, actualiza el estado y despacha el mensaje).

---

## 4. ⚙️ Integración con Microservicio WhatsApp (`servidor.leanglobal.cl:3085`)

### 4.1. Endpoint Oficial
* **URL:** `POST https://servidor.leanglobal.cl/lg-gsp-dev/whatsapp/enviar`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "numero": "+56912345678",
    "mensaje": "🚛 *GRÚAS SAN PABLO...*"
  }
  ```
* **Respuesta Exitosa (HTTP 200):**
  ```json
  {
    "ok": true,
    "mensaje": "Mensaje enviado exitosamente a +56912345678"
  }
  ```

### 4.2. Feedback Visual y Auditoría Local
* Durante el envío: Spinner `[ ⏳ Enviando... ]`.
* Al completar con éxito: Toast emergente `✅ WhatsApp despachado exitosamente a Juan Pérez (+569...)`.
* Se almacena en el estado del viaje la marca temporal `ultimo_despacho_whatsapp: "2026-09-21T21:15:00Z"` para que el coordinador sepa a qué hora fue notificado.

---

## 5. 📋 Plan de Verificación y Testing

| ID | Caso de Prueba | Resultado Esperado |
|---|---|---|
| **CP-50.1** | Operador con teléfono registrado presiona `[ Despachar WhatsApp ]` | Envío instantáneo, HTTP 200, mensaje recibido en celular real. |
| **CP-50.2** | Operador SIN teléfono registrado presiona el botón | Se abre el modal de captura sin errores de consola. |
| **CP-50.3** | Coordinador ingresa número en modal y presiona `Enviar` | Se envía el WhatsApp al nuevo número y se actualiza la tarjeta. |
| **CP-50.4** | Clic en `[ Copiar Link ]` dentro del modal | Se copia la URL al portapapeles y se muestra toast verde. |
| **CP-50.5** | Envío de recordatorio de Report Diario en `reports` | El operador recibe mensaje con link directo a `?fase=reporte`. |
