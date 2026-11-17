# 📋 CASO-20261116-03: Falla de Envío de Correos y Cotizaciones por Timeout SMTP (Bloqueo Firewall ZGlobalHost) y Migración a Google Workspace

---

## 1. Ficha del Incidente

* **ID del Caso:** `CASO-20261116-03`
* **Fecha / Hora:** 2026-11-16 12:00 CLT (GMT-03:00)
* **Operador / Usuario Afectado:** Wilson (Equipo Comercial / CRM) y Usuarios del Sistema
* **Negocio / OT:** `GSP-2611-00043` (ID 91, *planta comasa*) y `GSP-2611-00047` (ID 97, *planta oleotop freire*) / Despacho General de Cotizaciones
* **Equipo Involucrado:** Plataforma Web CRM / Backend de Notificaciones
* **Ambiente:** Producción (`PROD`) y Desarrollo (`DEV`)
* **Severidad:** Crítica (bloqueo total del despacho de cotizaciones y notificaciones transaccionales)

---

## 2. Síntoma Reportado

Al intentar despachar una cotización por correo desde el Gestor de Oportunidades (CRM), la acción fallaba arrojando error al usuario. En el log del servicio PM2 ID 13 (`lean-services-gsp-prod`) se registraba:
```text
13|lean-services-gsp-prod  | ❌ Error en postMessage: Error: Connection timeout
13|lean-services-gsp-prod  |     at SMTPConnection._formatError (/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/nodemailer/lib/smtp-connection/index.js:887:19)
13|lean-services-gsp-prod  |     at SMTPConnection._onError (/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/nodemailer/lib/smtp-connection/index.js:868:20)
13|lean-services-gsp-prod  |     at SMTPConnection._onConnectionError (/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/nodemailer/lib/smtp-connection/index.js:405:18)
13|lean-services-gsp-prod  |     at Timeout.<anonymous> (/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/nodemailer/lib/smtp-connection/index.js:385:18)
...
13|lean-services-gsp-prod  |   code: 'ETIMEDOUT',
13|lean-services-gsp-prod  |   command: 'CONN'
```
Como consecuencia del fallo en el envío, los procesos comerciales quedaban estancados en fase inicial sin avanzar a verificación/validación.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

1. **Pruebas de Conectividad Cruzada:**
   * Desde computador local a `138.255.101.224:465` (`powercp2.zglobalhost.com`): `TcpTestSucceeded : True` (Servidor SMTP del hosting activo).
   * Desde servidor de producción (`138.255.103.18`) a `138.255.101.224`: 100% Packet loss en Ping, y Timeout en puertos 25, 465, 587, 80, 443 y 2083.
   * Desde servidor de producción a `smtp.gmail.com:587`: Conexión exitosa (código 0).
2. **Causa Raíz:**
   * El firewall de seguridad perimetral de ZGlobalHost (`cPHulk` / `CSF/LFD`) en el servidor `powercp2.zglobalhost.com` bloqueó (baneó) la dirección IP pública del servidor VPS de producción (`138.255.103.18`), descartando todo paquete TCP entrante.

---

## 4. Causa Raíz de Arquitectura

Dependencia de un servidor SMTP cPanel de hosting compartido para notificaciones críticas de la empresa, susceptible a baneos automáticos de IP por rate limits o fallas de red entre subredes del proveedor.

---

## 5. Plan de Mitigación y Resolución

1. **Desbloqueo Inmediato de Oportunidades Bloqueadas en BD:**
   * Se identificaron los procesos `GSP-2611-00043` (`id_proyecto = 91`) y `GSP-2611-00047` (`id_proyecto = 97`).
   * Se actualizaron en `sch_leangsp_prod.tpry_proyecto` a `id_proyecto_estado = 3` (**Validación & Diff / Verificación Técnica**), destrabando la operación comercial y técnica.
2. **Migración a Pasarela Google Workspace:**
   * Generación de credencial de aplicación para `sgajardoc@gmail.com`.
   * Actualización del transporte Nodemailer en `src/models/messageModel.js` a `smtp.gmail.com:587` con TLS.
   * Configuración de remitente `Grúas San Pablo - Plataforma <sgajardoc@gmail.com>` con `replyTo: notificaciones.gsp@leanglobal.cl`.
   * Reinicio de PM2 ID 13 (`lean-services-gsp-prod`).
3. **Verificación Empírica de Envío:**
   * Despacho exitoso de correo testigo con respuesta `250 OK` recibida en tiempo real (`response: "250 OK id=1xSyqK-00000008cQv-3d0I"`).

---

## 6. Protocolo de Respuesta y Guía al Usuario

* Wilson y el equipo comercial ya pueden despachar cotizaciones por correo desde el CRM; los correos salen de inmediato sin timeout.
* Los proyectos `GSP 43` y `GSP 47` están disponibles en la pestaña de **Validación & Diff** para su curso operacional normal.

---

## 7. Lecciones Aprendidas y Acciones Preventivas

* El canal de notificaciones transaccionales y comerciales de producción debe operar sobre infraestructuras de correo de alta confiabilidad (Google Workspace / Relay corporativo), evitando depender de hostings cPanel propensos a baneos por firewall.
