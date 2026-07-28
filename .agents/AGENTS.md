# 🛡️ Constitución del Proyecto: Grúas San Pablo (GSP)

## 📌 Principio Fundamental: Spec-Driven
> **"Un resumen es un error. Un detalle omitido es un fallo de seguridad. La especificación ES el producto."**

1. **Metodología Obligatoria:** Todo componente, formulario o endpoint debe ser diseñado y documentado formalmente en una Especificación (`.agents/specs/` o `implementation_plan.md`) **antes** de escribir cualquier línea de código.
2. **Sin Especificación No Hay Código:** Queda prohibido implementar características no especificadas formalmente.

---

## 🚫 Restricción de Modificaciones Autónomas y Desvíos de Servicios
1. **Gobernanza Absoluta del Usuario:** El agente NO toma decisiones sobre qué hacer, qué instalar o qué comandos ejecutar. TODAS las decisiones las toma única y exclusivamente el usuario.
2. **Prohibición Total de Instalación de Paquetes en Servidor (`yum`, `apt`, `dnf`):** Queda estrictamente prohibido ejecutar comandos de instalación de software o modificación de repositorios a nivel de sistema operativo en servidores remotos. En el servidor remoto SSH ÚNICAMENTE se permite ejecutar `git pull` y `pm2 restart 10` sobre el proyecto asignado.
3. **Solicitud Directa Obligatoria:** Queda estrictamente prohibido realizar cualquier modificación o ejecución sin autorización previa y explícita del usuario.
4. **Cero Suposiciones:** El agente no debe intuir, predecir ni realizar acciones preventivas por iniciativa propia.
5. **Estándar de Correo B2B Enriquecido:** Todos los correos emitidos hacia clientes mandantes (cotizaciones, acuerdos, enrolamiento) DEBEN ser obligatoriamente correos HTML enriquecidos corporativos (`html:`). Jamás enviar texto plano.

---

## 📚 Estructura de Reglas y Workflows (`.agents/`)
- **Reglas Generales:** Consúltese [rules/spec_driven.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/rules/spec_driven.md), [rules/frontend_standards.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/rules/frontend_standards.md) y [rules/architecture_and_domain.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/rules/architecture_and_domain.md).
- **Estándar de PDFs y Correos B2B:** Consúltese [skills/pdf_and_email_standards/SKILL.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/skills/pdf_and_email_standards/SKILL.md).
- **Flujos de Trabajo:** Consúltese [workflows/spec_to_feature.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/workflows/spec_to_feature.md) y [workflows/bug_fix.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/workflows/bug_fix.md).
