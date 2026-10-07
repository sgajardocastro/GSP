const ProyectoModel = require('../models/proyectoModel');
const archivoModel = require('../models/archivoModel');
const pool = require('../config/postgresPool');

const proyecto = new ProyectoModel();

const CATALOGO_EQUIPOS_EXPRESS = [
  {
    id: 'GRUAS_TELESCOPICAS',
    nombre: 'Grúas Telescópicas',
    icono: '🚜',
    subcategoria: 'Grúa Telescópica',
    tipo_servicio: 'GRUAS TELESCOPICAS',
    opciones: [
      { id: 'gt_40', label: '40 TON', capacidad: 40, modelo_ref: 'Liebherr LTM 1040', tarifa_sugerida: 950000, horas_min: 9 },
      { id: 'gt_50', label: '50 TON', capacidad: 50, modelo_ref: 'Liebherr LTM 1050 / Tadano ATF 50', tarifa_sugerida: 1200000, horas_min: 9 },
      { id: 'gt_70', label: '70 TON', capacidad: 70, modelo_ref: 'Liebherr LTM 1070 / XCMG XCT70', tarifa_sugerida: 1650000, horas_min: 9 },
      { id: 'gt_100', label: '100 TON', capacidad: 100, modelo_ref: 'Liebherr LTM 1100 / Tadano ATF 100', tarifa_sugerida: 2400000, horas_min: 9 },
      { id: 'gt_150', label: '150 TON', capacidad: 150, modelo_ref: 'Liebherr LTM 1150', tarifa_sugerida: 3400000, horas_min: 9 },
      { id: 'gt_220', label: '220 TON', capacidad: 220, modelo_ref: 'Liebherr LTM 1220', tarifa_sugerida: 4800000, horas_min: 9 },
      { id: 'gt_250', label: '250 TON', capacidad: 250, modelo_ref: 'XCMG XCA250', tarifa_sugerida: 5500000, horas_min: 9 }
    ]
  },
  {
    id: 'CAMIONES_PLUMA',
    nombre: 'Camiones Pluma',
    icono: '🚛',
    subcategoria: 'Camión Pluma',
    tipo_servicio: 'CAMIONES',
    opciones: [
      { id: 'cp_10', label: '10-12 TON', capacidad: 12, modelo_ref: 'Tremac / International', tarifa_sugerida: 420000, horas_min: 9 },
      { id: 'cp_15', label: '15-18 TON', capacidad: 18, modelo_ref: 'Mercedes-Benz / VW Constellation', tarifa_sugerida: 540000, horas_min: 9 },
      { id: 'cp_20', label: '20-25 TON', capacidad: 25, modelo_ref: 'Volvo FH / Scania G500', tarifa_sugerida: 680000, horas_min: 9 }
    ]
  }
];

const TARIFA_TRASLADO_SUGERIDA = 450000;
const VALIDEZ_DIAS_ESTANDAR = 5;

const formatCLP = (v) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(v || 0);
};

module.exports = {
  // GET /api/comercial/express/catalogo o /api/proyectos/express/catalogo
  getCatalogo: async (req, res) => {
    try {
      return res.status(200).json({
        success: true,
        familias: CATALOGO_EQUIPOS_EXPRESS,
        traslado_sugerido: TARIFA_TRASLADO_SUGERIDA,
        validez_dias_estandar: VALIDEZ_DIAS_ESTANDAR
      });
    } catch (err) {
      console.error('[CotizadorExpress] Error getCatalogo:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // POST /api/comercial/express/cotizar o /api/proyectos/express/cotizar
  cotizarExpress: async (req, res) => {
    const client = await pool.connect();
    try {
      const {
        id_empresa_emisora = 9,
        cliente = {},
        servicio = {},
        condiciones = {}
      } = req.body || {};

      // 1. Validaciones mínimas
      if (!cliente.nombre || !String(cliente.nombre).trim()) {
        return res.status(400).json({ error: 'El nombre o razón social del cliente mandante es obligatorio.' });
      }
      if (!cliente.telefono || !String(cliente.telefono).trim()) {
        return res.status(400).json({ error: 'El número de teléfono WhatsApp de contacto es obligatorio.' });
      }
      if (!servicio.tipo_equipo) {
        return res.status(400).json({ error: 'Debe seleccionar un tipo de equipo (Grúa Telescópica o Camión Pluma).' });
      }

      const userId = Number(req.user?.id_user) || 1;
      let vendedorNombre = req.user?.nombre || 'Ejecutivo Comercial';
      let vendedorEmail = req.user?.email || req.user?.correo || '';

      // Obtener datos del usuario si faltan
      try {
        const uRes = await client.query('SELECT name_user, email_user, nombre_user FROM tpar_usuarios WHERE id_user = $1 LIMIT 1', [userId]);
        if (uRes.rowCount > 0) {
          vendedorNombre = uRes.rows[0].nombre_user || uRes.rows[0].name_user || vendedorNombre;
          vendedorEmail = uRes.rows[0].email_user || vendedorEmail;
        }
      } catch (_) {}

      await client.query('BEGIN');

      // 2. Identificar o Registrar Empresa Cliente en tpar_empresas
      let resolvedIdCliente = cliente.id_empresa ? Number(cliente.id_empresa) : null;
      const nombreClienteLimpio = String(cliente.nombre).trim();

      if (!resolvedIdCliente) {
        // Buscar si ya existe por razón social o nombre
        const findEmp = await client.query(`
          SELECT id_empresa, razon_social, rut_empresa 
          FROM tpar_empresas 
          WHERE LOWER(TRIM(razon_social)) = LOWER(TRIM($1)) OR LOWER(TRIM(name_empresa)) = LOWER(TRIM($1))
          LIMIT 1
        `, [nombreClienteLimpio]);

        if (findEmp.rowCount > 0) {
          resolvedIdCliente = findEmp.rows[0].id_empresa;
        } else {
          // Crear prospecto provisional en tpar_empresas
          const rutProv = (cliente.rut && String(cliente.rut).trim()) ? String(cliente.rut).trim() : 'PROV-SIN-RUT';
          const insEmp = await client.query(`
            INSERT INTO tpar_empresas (
              razon_social, name_empresa, rut_empresa, fono_contacto, flag_externo, json_field
            ) VALUES (
              $1, $1, $2, $3, true, $4
            ) RETURNING id_empresa
          `, [
            nombreClienteLimpio,
            rutProv,
            String(cliente.telefono).trim(),
            JSON.stringify({ es_prospecto_express: true, contacto_inicial: cliente.contacto_nombre || '' })
          ]);
          resolvedIdCliente = insEmp.rows[0].id_empresa;
        }
      }

      // Auto-guardar o actualizar contacto en tpar_contactos
      if (resolvedIdCliente && cliente.contacto_nombre) {
        try {
          const contNombre = String(cliente.contacto_nombre).trim();
          const contFono = String(cliente.telefono || '').trim();
          const contMail = String(cliente.email || '').trim();

          const checkCont = await client.query(`
            SELECT id_contacto FROM tpar_contactos 
            WHERE id_empresa = $1 AND LOWER(TRIM(nombre)) = LOWER(TRIM($2)) 
            LIMIT 1
          `, [resolvedIdCliente, contNombre]);

          if (checkCont.rowCount === 0) {
            await client.query(`
              INSERT INTO tpar_contactos (id_empresa, nombre, fono, email, cargo)
              VALUES ($1, $2, $3, $4, 'Contacto Comercial')
            `, [resolvedIdCliente, contNombre, contFono, contMail]);
          }
        } catch (cErr) {
          console.warn('[CotizadorExpress] Warning guardando contacto:', cErr.message);
        }
      }

      // 3. Generar Código Transaccional Oficial (codi_proyecto)
      const codiGenerado = await proyecto.generarCodigoTransaccional(id_empresa_emisora, resolvedIdCliente, client);

      // 4. Ensamblar Líneas de Servicio Canónicas (crm_v1.lineas_servicio)
      const dias = Math.max(1, Number(servicio.dias_servicio) || 1);
      const horasMin = Number(servicio.horas_minimas_dia) || 9;
      const tarifaDia = Number(servicio.tarifa_dia) || 0;
      const subtotalEquipo = dias * tarifaDia;

      const esPluma = servicio.tipo_equipo === 'CAMIONES_PLUMA' || String(servicio.tipo_equipo).toUpperCase().includes('PLUMA');
      const tipoCanonica = esPluma ? 'CAMIONES' : 'GRUAS TELESCOPICAS';
      const subcategoriaCanonica = esPluma ? 'Camión Pluma' : 'Grúa Telescópica';
      const capacidadTexto = servicio.capacidad_label || servicio.tonelaje || (esPluma ? '15 TON' : '70 TON');

      const lineasServicio = [
        {
          _uid: `line-${Date.now()}-1`,
          tipo: tipoCanonica,
          subcategoria: subcategoriaCanonica,
          descripcion: `Arriendo ${subcategoriaCanonica} ${capacidadTexto} con Operador y Rigger`,
          unidad: 'Horas Diarias Minimas',
          cantidad_dias: dias,
          cantidad_horas: horasMin,
          cantidad: dias,
          pisoMinimo: horasMin,
          valorUnitario: tarifaDia,
          valor_unitario: tarifaDia,
          subtotal: subtotalEquipo,
          is_linea_base: true
        }
      ];

      let subtotalTraslado = 0;
      if (servicio.incluye_traslado) {
        const valorFlete = Number(servicio.valor_traslado) || TARIFA_TRASLADO_SUGERIDA;
        subtotalTraslado = valorFlete;
        lineasServicio.push({
          _uid: `line-${Date.now()}-2`,
          tipo: 'TRASLADOS',
          subcategoria: 'Flete / Movilización',
          descripcion: 'Movilización y Desmovilización Ida y Vuelta Faena',
          unidad: 'TRASLADO IDA/VUELTA',
          cantidad: 1,
          cantidad_dias: 1,
          cantidad_horas: 0,
          pisoMinimo: 0,
          valorUnitario: valorFlete,
          valor_unitario: valorFlete,
          subtotal: valorFlete,
          is_linea_base: true
        });
      }

      const totalNeto = subtotalEquipo + subtotalTraslado;

      // 5. Ensamblar json_field Canónico (crm_v1 y ejecucion_v1)
      const jsonField = {
        crm_v1: {
          origen: 'PWA_EXPRESS',
          vendedor_nombre: vendedorNombre,
          vendedor_email: vendedorEmail,
          contacto_nombre: cliente.contacto_nombre || '',
          contacto_telefono: cliente.telefono || '',
          contacto_email: cliente.email || '',
          contacto_correo: cliente.email || '',
          obra_nombre: cliente.obra_nombre || '',
          obra_ciudad: cliente.obra_comuna || '',
          lineas_servicio: lineasServicio,
          moneda: condiciones.moneda || 'CLP',
          validez_dias: condiciones.validez_dias || VALIDEZ_DIAS_ESTANDAR,
          condicion_servicio: condiciones.condicion_servicio || 'programado',
          cliente_pone_combustible: Boolean(condiciones.cliente_pone_combustible),
          cotizaciones_historicas: [],
          pensiones: {
            alojamiento_costeado: 'CLIENTE',
            desayuno_costeado: 'CLIENTE',
            almuerzo_costeado: 'CLIENTE',
            cena_costeado: 'CLIENTE',
            traslado_costeado: 'CLIENTE'
          }
        },
        ejecucion_v1: {
          subtab_activa: 'comercial'
        }
      };

      const ubicacionLimpia = [cliente.obra_nombre, cliente.obra_comuna]
        .map(s => String(s || '').trim())
        .filter(Boolean)
        .join(', ') || 'faena';

      const nombreProyectoFinal = cliente.obra_nombre 
        ? `${nombreClienteLimpio} - ${ubicacionLimpia}` 
        : `${nombreClienteLimpio} (${subcategoriaCanonica} ${capacidadTexto})`;

      const fechaIni = servicio.fecha_estimada_inicio || new Date().toISOString().split('T')[0];

      // 6. Insertar en tpry_proyecto con id_proyecto_estado = 2 (Cotización Enviada)
      const insPry = await client.query(`
        INSERT INTO tpry_proyecto (
          id_empresa,
          nombre_proyecto,
          codi_proyecto,
          id_empresa_cliente,
          id_proyecto_tipo,
          id_proyecto_estado,
          fecha_plan_ini,
          duracion_plan,
          objetivo_proyecto,
          observacion_proyecto,
          id_usuario_creacion,
          fecha_creacion,
          json_field
        ) VALUES (
          $1, $2, $3, $4, 1, 2, $5, $6, $7, $8, $9, NOW(), $10
        ) RETURNING *;
      `, [
        id_empresa_emisora,
        nombreProyectoFinal,
        codiGenerado,
        resolvedIdCliente,
        fechaIni,
        dias,
        `Cotización Express emitida desde APP Móvil: ${subcategoriaCanonica} ${capacidadTexto} por ${dias} día(s).`,
        `Cotización Express PWA - Contacto: ${cliente.contacto_nombre || ''} (${cliente.telefono || ''})`,
        userId,
        jsonField
      ]);

      const proyectoCreado = insPry.rows[0];
      await client.query('COMMIT');

      // 7. Compilar PDF Oficial mediante generarCotizacionVersion
      let cotizRes = null;
      try {
        cotizRes = await proyecto.generarCotizacionVersion(proyectoCreado.id_proyecto, totalNeto);
      } catch (pdfErr) {
        console.error('[CotizadorExpress] Error al generar PDF oficial:', pdfErr);
      }

      const pdfUrl = cotizRes?.cotizacion?.url || null;
      const baseUrl = process.env.APP_BASE_URL || 'https://servidor.leanglobal.cl';
      const envPrefix = (process.env.APP_ENV === 'prod') ? '/lg-gsp-prod' : '/lg-gsp-dev';
      const pdfFullUrl = pdfUrl 
        ? (pdfUrl.startsWith('http') ? pdfUrl : `${baseUrl}${pdfUrl.startsWith('/lg-gsp') ? '' : envPrefix}${pdfUrl}`)
        : '';

      // 8. Construir Enlace Directo de WhatsApp
      const rawPhone = String(cliente.telefono || '').replace(/\D/g, '');
      const phoneFinal = rawPhone.startsWith('56') ? rawPhone : `56${rawPhone}`;

      const textoWsp = 
`Estimado/a ${cliente.contacto_nombre || cliente.nombre},

Junto con saludar, le compartimos la Cotización Formal *${codiGenerado}* de *Grúas San Pablo* para el servicio de *${subcategoriaCanonica} ${capacidadTexto}* en *${ubicacionLimpia}*.

📄 *Descarga del Presupuesto Oficial (PDF):*
${pdfFullUrl}

• *Duración planificada:* ${dias} día(s) (${horasMin} hrs/día mínimas)
• *Total Neto:* ${formatCLP(totalNeto)} + IVA
• *Validez de la oferta:* ${condiciones.validez_dias || VALIDEZ_DIAS_ESTANDAR} días hábiles.

Quedamos a su entera disposición para coordinar los aspectos operativos.

Atentamente,
*Grúas San Pablo*`;

      const whatsappShareLink = `https://wa.me/${phoneFinal}?text=${encodeURIComponent(textoWsp)}`;

      return res.status(201).json({
        success: true,
        message: 'Cotización express emitida exitosamente',
        id_proyecto: proyectoCreado.id_proyecto,
        codi_proyecto: codiGenerado,
        pdf_url: pdfUrl,
        pdf_full_url: pdfFullUrl,
        whatsapp_share_link: whatsappShareLink,
        total_neto: totalNeto,
        total_iva: Math.round(totalNeto * 0.19),
        total_general: Math.round(totalNeto * 1.19),
        cotizacion: cotizRes?.cotizacion || null
      });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[CotizadorExpress] Error fatal en cotizarExpress:', err);
      return res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
};
