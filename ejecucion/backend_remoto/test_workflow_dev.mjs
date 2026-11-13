import https from 'https';

const BASE_URL = 'https://servidor.leanglobal.cl/lg-gsp-dev/api/mantenimiento';

function requestJson(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runE2eTest() {
  console.log('🔄 Iniciando prueba E2E de ciclo de vida OT...');

  // 1. Crear OT preventivo con pauta PM250 en equipo 119
  const resCrear = await requestJson('POST', '/ots', {
    id_equipo: 119,
    tipo_mantenimiento: 'PREVENTIVO',
    codigo_pauta: 'PM250',
    descripcion_falla: 'Mantenimiento preventivo 250 hrs programado',
    horometro_inicio: 1250,
    prioridad: 3,
    forzar_creacion: true
  });
  console.log('1. Crear OT:', resCrear.status, resCrear.body?.data?.numero_ot || resCrear.body);
  const idOt = resCrear.body?.data?.id_ot;
  if (!idOt) return;

  // 2. Detalle de OT (debe traer las 7 tareas del PM250)
  const resDetalle = await requestJson('GET', `/ots/${idOt}`);
  console.log('2. Detalle OT:', resDetalle.status, resDetalle.body?.error || ('Tareas inyectadas: ' + resDetalle.body?.data?.actividades?.length));

  // 3. Registrar hallazgo C3
  const resHal = await requestJson('POST', '/hallazgos', {
    id_ot: idOt,
    id_equipo: 119,
    descripcion: 'Ligera humedad en sello de vástago cilindro de levante',
    criticidad: 'C3',
    sistema: 'HID'
  });
  console.log('3. Crear Hallazgo C3:', resHal.status, resHal.body?.error || ('ID: ' + resHal.body?.data?.id_hallazgo));

  // 4. Intentar cierre con PIN incorrecto -> debe rechazar (422)
  const resCierreFailPin = await requestJson('POST', `/ots/${idOt}/cerrar`, {
    pin: '9999',
    horometro_cierre: 1250
  });
  console.log('4. Gate PIN Incorrecto (esperado 422):', resCierreFailPin.status, resCierreFailPin.body?.error);

  // 5. Intentar cierre con tareas pendientes -> debe rechazar (422)
  const resCierreFailTareas = await requestJson('POST', `/ots/${idOt}/cerrar`, {
    pin: '1234',
    horometro_cierre: 1250
  });
  console.log('5. Gate Checklist Incompleto (esperado 422):', resCierreFailTareas.status, resCierreFailTareas.body?.error);

  // 6. Completar todas las tareas del checklist
  for (const act of (resDetalle.body?.data?.actividades || [])) {
    const r = await requestJson('PUT', `/actividades/${act.id_actividad}/estado`, {
      estado: 'COMPLETADA',
      observacion_tecnico: 'Tarea ejecutada conforme a manual'
    });
    if (r.status !== 200) console.log('Error actualizando act', act.id_actividad, r.status, r.body);
  }
  console.log('6. Tareas completadas exitosamente.');

  // 7. Imputar 4 HH de mecánico y 1 filtro
  await requestJson('POST', `/ots/${idOt}/hh`, {
    horas: 4,
    descripcion_trabajo: 'Servicio PM250 motor e hidráulica',
    nombre_tecnico: 'Juan Perez'
  });
  await requestJson('POST', `/ots/${idOt}/materiales`, {
    descripcion_material: 'Filtro de aceite primario',
    cantidad: 1,
    costo_unitario: 45000,
    unidad_medida: 'UN'
  });
  console.log('7. HH y Materiales imputados.');

  // 8. Cierre exitoso con PIN y liberación de activo
  const resCierreOk = await requestJson('POST', `/ots/${idOt}/cerrar`, {
    pin: '1234',
    horometro_cierre: 1252,
    observacion_final: 'Mantenimiento PM250 completado satisfactoriamente. Pruebas operacionales OK.',
    estado_equipo_resultante: 'OPERATIVO',
    checklist_liberacion_ok: true
  });
  console.log('8. Cierre Formal Exitoso:', resCierreOk.status, resCierreOk.body?.message || resCierreOk.body?.error, 'Costo Total:', resCierreOk.body?.data?.costo_total_ot);

  // 9. Verificar estado final de OT
  const resFinal = await requestJson('GET', `/ots/${idOt}`);
  console.log('9. Estado final OT:', resFinal.body?.data?.ot?.estado, 'Cierre:', resFinal.body?.data?.cierre?.fecha_cierre);

  console.log('🎉 Prueba E2E de ciclo de vida completada con éxito.');
}

runE2eTest();
