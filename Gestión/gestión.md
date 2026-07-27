# 🎯 Gestión General de la Propuesta: Grúas San Pablo (GSP)

Este documento define las líneas generales, el alcance, los hitos clave y la propuesta de valor del **Sistema de Gestión de Operación y Control Financiero para Grúas San Pablo (GSP)**, desarrollado bajo el estándar de **LeanGlobal**.

---

## 1. Visión y Propuesta de Valor

El objetivo de la propuesta comercial es transformar la operación de GSP desde un flujo manual dependiente de reportes en papel hacia un ecosistema digital integrado. La solución ataca directamente la ineficiencia que golpea el flujo de caja, logrando que el trabajo devengado se convierta en facturación en el menor tiempo posible.

### Pilares Clave de la Solución
*   **0% Papel en Terreno:** Reemplazo de reportes de servicio en triplicado, check-lists pre-operacionales y Análisis de Seguridad en el Trabajo (AST) por una App Móvil parametrizable con firma electrónica digital (FES) integrada.
*   **Cruce de Devengado vs Facturado:** Visibilidad total e instantánea sobre lo devengado en faena, permitiendo facturar de inmediato y justificar requerimientos de capital de trabajo ante bancos.
*   **Torre de Control en Tiempo Real:** Vista maestra (Kanban/Lista) para seguir el estado de cada servicio (planificación, acreditación de personal/equipo, despacho logístico, ejecución de maniobra y estado de pago).

---

## 2. Preparación del Entorno Conceptual de la Propuesta

Para consolidar esta oportunidad de negocio con GSP, se ha estructurado una fase de preparación que abarca tres componentes clave:

1.  **Entorno Conceptual (Antecedentes):** Compilación y estructuración técnica de la descripción de Grúas San Pablo ([DescripciónGSP.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/antecedentes_reuniones/antecedentes/DescripciónGSP.md)), las variables del negocio de izaje pesado ([ReferenciaGrúasTransmac.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/antecedentes_reuniones/antecedentes/ReferenciaGrúasTransmac.md)), la propuesta operativa de consola ([ConsolaGSP.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/antecedentes_reuniones/antecedentes/ConsolaGSP.md)) and el comportamiento contable/operativo del devengado ([DescripciónDevengado.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/antecedentes_reuniones/antecedentes/DescripciónDevengado.md)) (todo ya completado en la presente sesión).
2.  **Presentación Web de Conceptos:** Creación de una presentación web interactiva local que consolide de manera visualmente atractiva y dinámica todo el material conceptualizado, permitiendo una navegación ágil de los antecedentes.
3.  **Construcción de la Maqueta (Mockup):** Desarrollo de una simulación visual y funcional de la Consola de Control de GSP (despacho, torre de control, KPIs de devengado) and la interfaz de la App del Operador en terreno.

---

## 3. Plan de Hitos y Entregables (Cronograma Alto Nivel)

### Hito 1: Prototipo y Maqueta Comercial (Semana del 2026-06-29)
*   *Entregables:*
    *   Presentación Web con el material conceptual.
    *   Maqueta visual interactiva de la Consola de Control GSP y la App del Operador en Terreno.
*   *Hito clave:* Reunión comercial presencial con el dueño de Grúas San Pablo y Marcelo Reyes (Martes 30 de Junio a las 16:00).

### Hito 2: Especificación Técnica y Funcional
*   *Entregable:* Documentación detallada del modelo de base de datos (Prisma), especificación de endpoints de la API (Backend) y especificaciones UI/UX (Frontend) del ecosistema.

### Hito 3: Propuesta Comercial y Económica
*   *Entregable:* Cotización de desarrollo de software, licenciamiento de la plataforma base de LeanGlobal, y alcance final de horas de implementación y soporte.

Este plan consultivo nos permite iniciar de inmediato la ejecución del proyecto, proyectando una entrega final en producción en un plazo de solo **7 semanas** (S1: prototipo, S2: configuración, S3-S7: adaptaciones, integración con Laudus ERP y marcha blanca), sujeto a las condiciones operativas de habilitación de accesos de red en la Semana 2 y a una Marcha Blanca acotada en la Semana 7.

---

## 4. Factores de Éxito de la Consultoría
*   **Simplicidad Operativa:** La interfaz debe ser de alta densidad pero muy intuitiva (evitar llenarse de gráficos complejos e inútiles para la toma de decisiones rápidas).
*   **Entendimiento del Negocio:** Utilizar los tecnicismos propios del rubro (rigging, contrapesos, camas bajas, operadores autorizados por tonelaje, etc.) para generar confianza con la gerencia general de GSP.

---

## 5. Matriz de Mitigación de Riesgos (Integración Laudus ERP)

Para asegurar la viabilidad del proyecto, se ha identificado un factor de riesgo crítico asociado a la infraestructura contable de Laudus ERP:

*   **Riesgo:** Retraso en la habilitación de infraestructura para Laudus On-Premise.
*   **Impacto:** Alto (Bloqueo de la fase de pruebas e integración).
*   **Probabilidad:** Media-Alta.
*   **Plan de Mitigación:** Definir en la sesión de inicio (Kick-off) la arquitectura de Laudus del cliente. De ser On-Premise, condicionar el inicio del desarrollo a la entrega efectiva de accesos a bases de datos o APIs locales bajo un protocolo de comunicación firmado por el encargado de TI del cliente.

### Análisis Comparativo de Escenarios

| Criterio | Escenario X: Laudus Cloud | Escenario Y: Laudus On-Premise (Local) |
| :--- | :--- | :--- |
| **Nivel de Esfuerzo** | Bajo a Medio (Predecible y acotado) | Alto (Altamente variable y complejo) |
| **Conexión** | API REST oficial mediante HTTPS y tokens JWT | Acceso directo DB local (SQL Server / Firebird) o agente local |
| **Lectura OCs/Facturas** | Estándar (endpoints oficiales de compra/venta) | Complejo / Ingeniería inversa de base de datos local |
| **Dependencia TI** | Mínima (entrega de credenciales API) | Máxima (apertura de puertos de red, VPNs, soporte TI cliente) |
| **Estabilidad** | Alta (servidores Visma / Laudus Cloud) | Incierta (depende de servidores locales e internet de oficina GSP) |
| **Plazos y Costos** | Desarrollo estimado en días, costos estables | Riesgo de duplicar/triplicar plazos y elevar costos |

---

## 6. Gestión del Alcance y Control de Cambios

El alcance técnico y funcional del proyecto está estrictamente delimitado por las especificaciones, características y pantallas descritas en el dossier de la propuesta y en la maqueta interactiva publicada. Cualquier requerimiento adicional será gestionado bajo la siguiente política de control de cambios:

*   **Identificación de Desviación:** Se formalizará una Solicitud de Cambio por escrito especificando el nuevo requerimiento operacional.
*   **Evaluación de Impacto:** LeanGlobal evaluará el impacto técnico en plazos (semanas) y cotización en un plazo máximo de 3 días hábiles.
*   **Aprobación Mutua:** Todo cambio de alcance requerirá la firma de un anexo de contrato técnico-comercial antes de iniciar su desarrollo.

---

## 7. Fase de Ejecución: Sprint 1 (Multi-Empresa & Preventa)

Tras el **Gap Analysis Técnico**, se definió que la primera fase de desarrollo directo (Sprint 1) consistirá en **reutilizar el backend Node.js heredado de LeanServices**, inyectándole la lógica crítica de Multi-Tenant:
*   Filtros dinámicos en Modelos mediante intercepción de JWT.
*   Conmutador de Vista Global para roles gerenciales.
*   Endpoint especializado para inicialización del proceso comercial ("Preventa").
*   Gestión (CRUD) para las 4 empresas hermanas (`tpar_empresas`).
Esta fase cierra las brechas arquitectónicas de datos antes de expandir el frontend comercial.
