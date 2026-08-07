# 🛡️ Constitución del Proyecto: Grúas San Pablo (GSP)

## 📌 Principio Fundamental: Spec-Driven
> **"Un resumen es un error. Un detalle omitido es un fallo de seguridad. La especificación ES el producto."**

1. **Metodología Obligatoria:** Todo componente, formulario o endpoint debe ser diseñado y documentado formalmente en una Especificación (`.agents/specs/` o `implementation_plan.md`) **antes** de escribir cualquier línea de código.
2. **Sin Especificación No Hay Código:** Queda prohibido implementar características no especificadas formalmente.

---

## 🚫 Restricción de Modificaciones Autónomas y Desvíos de Servicios
1. **Gobernanza Absoluta del Usuario:** El agente NO toma decisiones sobre qué hacer, qué instalar o qué comandos ejecutar. EL USUARIO ES LA ÚNICA AUTORIDAD QUE AUTORIZA CUALQUIER MODIFICACIÓN sobre los componentes, controladores o archivos del producto. TODAS las decisiones las toma única y exclusivamente el usuario.
2. **Protocolo Stop & Ask:** Ante cualquier ambigüedad, el agente SE DETIENE y pregunta. Queda strictly prohibido asumir, predecir o inventar componentes, campos o etiquetas no pedidas explícitamente.
3. **PROHIBICIÓN ABSOLUTA DE MODIFICAR BACKEND, DB Y EJECUTAR SSH SIN AUTORIZACIÓN:** Queda ESTRICTAMENTE PROHIBIDO modificar controladores, modelos o archivos backend, alterar la base de datos PostgreSQL, o ejecutar scripts de conexión SSH hacia servidores remotos. CUALQUIER intervención en el backend o servidor requiere la AUTORIZACIÓN EXPLÍCITA Y POR ESCRITO DEL USUARIO en el chat antes de realizarse.
4. **Prohibición Total de Levantar Backend Local (`npm run dev / start`):** El entorno de ejecución del backend vive única y exclusivamente en el servidor remoto. Todo desarrollo o prueba de Frontend y PWA en modo local debe apuntar y comunicarse con el backend del servidor remoto. ¡NUNCA ejecutes el servidor backend en la máquina local del usuario!
5. **Prohibición Total de Instalación de Paquetes en Servidor (`yum`, `apt`, `dnf`):** En el servidor remoto SSH ÚNICAMENTE se permite ejecutar `git pull` y `pm2 restart 10` cuando el usuario lo autorice explícitamente.
6. **Prohibición Absoluta de Controladores / Servicios Paralelos:** Todo flujo debe consumir obligatoriamente los endpoints oficiales definidos en `.agents/skills/`.
7. **Cero Suposiciones & Verificación Empírica Obligatoria:** El agente NO puede declarar victoria ni responder que una tarea está resuelta sin haber ejecutado una prueba real (HTTP 200 OK / Vite build 0 errores).
8. **Prohibición Absoluta de Decisiones Estúpidas, Alucinaciones y Componentes Inventados:** Queda ESTRICAMENTE PROHIBIDO inventar o asumir tipos de componentes, propiedades JSON o nombres de atributos (`dateField`, `signatureCapture`, `matrizCheck`) sin inspección previa directa en el código fuente (`ejecucion/pwa/src/`). Queda PROHIBIDO afirmar que un survey o vista funciona sin verificación empírica visual en pantalla.
9. **Regla Inviolable de Separación Estricta de Turnos (Cero Herramientas en Diagnóstico):** En cualquier turno donde el agente presente un diagnóstico, propuesta, hallazgo de base de datos o pregunta al usuario, queda **ESTRICTAMENTE PROHIBIDO invocar cualquier herramienta de edición, script o comando SSH**. Ese turno debe responderse ÚNICA Y EXCLUSIVAMENTE con texto en el chat. La invocación de herramientas queda diferida de forma obligatoria al turno posterior a recibir la aprobación explícita por escrito del usuario en el chat.

---

## 📚 Estructura de Reglas y Workflows (`.agents/`)
- **Reglas Generales:** Consúltese [rules/spec_driven.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/rules/spec_driven.md), [rules/frontend_standards.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/rules/frontend_standards.md), [rules/architecture_and_domain.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/rules/architecture_and_domain.md), [rules/inmutabilidad_etapas_concluidas_y_mutacion_por_excepcion.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/rules/inmutabilidad_etapas_concluidas_y_mutacion_por_excepcion.md) y [rules/zero_assumptions_protocol.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/rules/zero_assumptions_protocol.md).
- **Regla de Auditoría Cero Confianza:** Consúltese [rules/qa_deterministic_auditing.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/rules/qa_deterministic_auditing.md).
- **Estándar de PDFs y Correos B2B:** Consúltese [skills/pdf_and_email_standards/SKILL.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/skills/pdf_and_email_standards/SKILL.md).
- **Gestión de Tareas:** El backlog y control de tareas de este proyecto se gestiona ÚNICA Y EXCLUSIVAMENTE en el archivo físico [Gestión/tareas.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/Gestión/tareas.md).
