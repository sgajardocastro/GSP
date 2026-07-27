import { ref, computed, watch, onMounted } from 'vue';
import { apiAxios, sstAxios } from '@/services/api';
export function useGestionDocumentos() {
  
  // Filters
  const estadoAdminAll = ref(true);
  const estadoAdminAprobado = ref(true);
  const estadoAdminCreado = ref(true);
  const estadoAdminVerificacion = ref(true);
  const estadoAdminPendiente = ref(true);
  const estadoAdminRechazado = ref(true);

  const today = new Date();
  const fifteenDaysAgo = new Date(today);
  fifteenDaysAgo.setFullYear(fifteenDaysAgo.getFullYear() - 3);
  const fifteenDaysLater = new Date(today);
  fifteenDaysLater.setFullYear(fifteenDaysLater.getFullYear() + 1);

  const isoFifteenDaysAgo = fifteenDaysAgo.toISOString().split('T')[0];
  const isoFifteenDaysLater = fifteenDaysLater.toISOString().split('T')[0];

  const fechaDesde = ref(isoFifteenDaysAgo);
  const fechaDesdeSeleccionada = ref(isoFifteenDaysAgo);
  const fechaHasta = ref(isoFifteenDaysLater);
  const fechaHastaSeleccionada = ref(isoFifteenDaysLater);

  const clientes = ref([]);
  const cliente = ref(null);
  const clienteSeleccionado = ref(null);
  const proyectos = ref([]);
  const proyecto = ref(null);
  const proyectoSeleccionado = ref(null);
  const flujos = ref([]);
  const flujosDocumentos = ref([]);
  const areas = ref([]);
  const notificaciones = ref([]);

  const loading = ref(false);
  const error = ref(null);

  // Dialogs and Modals
  const dialogConfirmarTerminar = ref(false);
  const dialogSurvey = ref(false);
  const surveyModalUrl = ref('');
  const pdfUrl = ref('');
  const detalleCrearFirma = ref(null);
  const roles = ref([]);
  const motivosRechazo = ref([]);

  // Toggling expanded tree nodes
  const expandedNodes = ref(new Set());

  function toggleNode(id) {
    if (expandedNodes.value.has(id)) {
      expandedNodes.value.delete(id);
    } else {
      expandedNodes.value.add(id);
    }
  }

  const normalizeEstado = (value) =>
    String(value ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toUpperCase()
      .trim();

  const flujosAdminFiltrados = computed(() => {
    const base = Array.isArray(flujos.value) ? flujos.value : [];
    return base.filter((f) => {
      const estado = normalizeEstado(f?.estado_srv);
      if (clienteSeleccionado.value && String(clienteSeleccionado.value) !== String(f.id_empresa_cliente)) return false;
      if (proyectoSeleccionado.value && String(proyectoSeleccionado.value) !== String(f.id_proyecto)) return false;

      const est = String(f.estado_srv || '').toUpperCase().trim();
      if (estadoAdminAll.value) return true;
        
      let estMatch = false;
      if (estadoAdminAprobado.value && est === 'APROBADO') estMatch = true;
      if (estadoAdminCreado.value && est === 'CREADO') estMatch = true;
      if (estadoAdminVerificacion.value && est === 'VERIFICACION') estMatch = true;
      if (estadoAdminPendiente.value && est === 'PENDIENTE') estMatch = true;
      if (estadoAdminRechazado.value && est === 'RECHAZADO') estMatch = true;

      // Default valid para otros sources no mapeados
      if (f._source !== 'SURVEY' && est === 'APROBADO' && estadoAdminAprobado.value) return true;
        
      return estMatch;
    });
  });

  // Build the hierarchical structure
  const treeRows = computed(() => {
    const rows = [];
    const baseFlujos = Array.isArray(flujosAdminFiltrados.value) ? flujosAdminFiltrados.value : [];
      
    const clientProjects = {};
      
    // Agrupación unificada
    baseFlujos.forEach(flow => {
      const clientName = flow.name_empresa_cliente || 'Sin Cliente';
      const projName = flow.nombre_proyecto || 'Sin Proyecto';
        
      if (!clientProjects[clientName]) clientProjects[clientName] = {};
      if (!clientProjects[clientName][projName]) clientProjects[clientName][projName] = {};
        
      const areaKey = flow.tematica_funcional || 'Sin Área';
      const famName = flow.documento || 'Sin Familia';
        
      if (!clientProjects[clientName][projName][areaKey]) {
        clientProjects[clientName][projName][areaKey] = {};
      }
      if (!clientProjects[clientName][projName][areaKey][famName]) {
        clientProjects[clientName][projName][areaKey][famName] = [];
      }
        
      clientProjects[clientName][projName][areaKey][famName].push(flow);
    });

    const sortedClients = Object.keys(clientProjects).sort((a, b) => a.localeCompare(b, 'es'));
    sortedClients.forEach(clientName => {
      const clientNodeId = `client-${clientName.replace(/\s+/g, '_')}`;
      const isClientExpanded = expandedNodes.value.has(clientNodeId);
        
      rows.push({
        id: clientNodeId,
        nombre: clientName,
        type: 'client',
        level: 0,
        expanded: isClientExpanded,
        hasChildren: true
      });

      if (isClientExpanded) {
        const projsObj = clientProjects[clientName];
        const sortedProjs = Object.keys(projsObj).sort((a, b) => a.localeCompare(b, 'es'));

        sortedProjs.forEach(projName => {
          const projNodeId = `${clientNodeId}-proj-${projName.replace(/\s+/g, '_')}`;
          const isProjExpanded = expandedNodes.value.has(projNodeId);
            
          rows.push({
            id: projNodeId,
            nombre: projName,
            type: 'proyecto',
            level: 1,
            expanded: isProjExpanded,
            hasChildren: true
          });

          if (isProjExpanded) {
            const areasObj = projsObj[projName];
            const sortedAreas = Object.keys(areasObj).sort((a, b) => a.localeCompare(b, 'es'));

            sortedAreas.forEach(areaName => {
              const areaNodeId = `${projNodeId}-area-${areaName.replace(/\s+/g, '_')}`;
              const isAreaExpanded = expandedNodes.value.has(areaNodeId);

              rows.push({
                id: areaNodeId,
                nombre: areaName,
                type: 'area',
                level: 2,
                expanded: isAreaExpanded,
                hasChildren: true
              });

              if (isAreaExpanded) {
                const famsObj = areasObj[areaName];
                const sortedFams = Object.keys(famsObj).sort((a, b) => a.localeCompare(b, 'es'));

                sortedFams.forEach(famName => {
                  const famNodeId = `${areaNodeId}-fam-${famName.replace(/\s+/g, '_')}`;
                  const isFamExpanded = expandedNodes.value.has(famNodeId);

                  rows.push({
                    id: famNodeId,
                    nombre: famName,
                    type: 'family',
                    level: 3,
                    expanded: isFamExpanded,
                    hasChildren: true
                  });

                  if (isFamExpanded) {
                    const theFlows = famsObj[famName];
                    theFlows.forEach(fl => {
                      rows.push({
                        id: `${famNodeId}-file-${fl.id_survey || Math.random()}`,
                        nombre: `Ref #${fl.id_survey} - ${fl.documento}`,
                        type: 'file',
                        level: 4,
                        data: {
                          ...fl,
                          fecha_plan_fin: fl.fecha_display,
                          nombre_user: fl.id_user || 'Sistema'
                        }
                      });
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
    
    return rows;
  });

  const obtenerClientes = async () => {
    loading.value = true;
    try {
      const response = await apiAxios.get('/servicio/leanglobal/obtenerEmpresas');
      clientes.value = response.data;
    } catch (err) {
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  const obtenerAreas = async () => {
    loading.value = true;
    try {
      const response = await apiAxios.get('/servicio/leanglobal/obtenerAreas?id_empresa=2');
      areas.value = response.data || [];
    } catch (err) {
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  const obtenerProyectos = async (id_cliente) => {
    loading.value = true;
    try {
      const response = await apiAxios.get('/servicio/leanglobal/obtenerProyectos?id_empresa_cliente=' + (id_cliente || ''));
      proyectos.value = response.data;
    } catch (err) {
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  const obtenerRoles = async () => {
    loading.value = true;
    try {
      const response = await apiAxios.get('/servicio/leanglobal/obtenerRoles');
      roles.value = response.data;
    } catch (err) {
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  const obtenerMotivosRechazo = async () => {
    try {
      const response = await apiAxios.get('/servicio/leanglobal/obtnerMotivosRechazo');
      motivosRechazo.value = response.data;
    } catch (err) {
      console.error(err);
    }
  };

  function resolverRelacionBD(flujoOriginal) {
    let idProyecto = flujoOriginal.id_proyecto || flujoOriginal.idProyecto;
    let idEmpresa = flujoOriginal.id_empresa_cliente || flujoOriginal.idEmpresaCliente;
    let nombreProyectoStr = flujoOriginal.nombre_proyecto || flujoOriginal.projectName || '';
    let nombreEmpresaStr = flujoOriginal.name_empresa_cliente || flujoOriginal.companyName || flujoOriginal.codi_proyecto || '';

    const proyectosBD = proyectos.value || [];
    const empresasBD = clientes.value || [];

    let proyectoEncontrado = null;
    let empresaEncontrada = null;

    // 1. Buscar por ID de Proyecto
    if (idProyecto) {
      proyectoEncontrado = proyectosBD.find(p => String(p.id_proyecto) === String(idProyecto));
    }

    // 2. Buscar por texto (nombre_proyecto o codi_proyecto)
    if (!proyectoEncontrado && nombreProyectoStr) {
      const term = nombreProyectoStr.toLowerCase().trim();
      proyectoEncontrado = proyectosBD.find(p => 
        String(p.nombre_proyecto || '').toLowerCase().trim() === term ||
        String(p.codi_proyecto || '').toLowerCase().trim() === term
      );
    }

    // 3. Buscar usando el nombreEmpresaStr (por ejemplo, si "MLP" viene en el campo empresa)
    if (!proyectoEncontrado && nombreEmpresaStr) {
      const term = nombreEmpresaStr.toLowerCase().trim();
      proyectoEncontrado = proyectosBD.find(p => 
        String(p.nombre_proyecto || '').toLowerCase().trim() === term ||
        String(p.codi_proyecto || '').toLowerCase().trim() === term
      );
    }

    // 4. Si encontramos el proyecto en la BD, resolvemos sus datos y su empresa
    if (proyectoEncontrado) {
      idProyecto = proyectoEncontrado.id_proyecto;
      nombreProyectoStr = proyectoEncontrado.nombre_proyecto;
      idEmpresa = proyectoEncontrado.id_empresa_cliente;
      
      if (idEmpresa) {
        empresaEncontrada = empresasBD.find(e => String(e.id_empresa) === String(idEmpresa));
      }
    } else if (idEmpresa) {
      empresaEncontrada = empresasBD.find(e => String(e.id_empresa) === String(idEmpresa));
    }

    // 5. Si no hay empresa encontrada aún, intentar buscar por texto
    if (!empresaEncontrada && nombreEmpresaStr) {
      const term = nombreEmpresaStr.toLowerCase().trim();
      empresaEncontrada = empresasBD.find(e => 
        String(e.name_empresa || '').toLowerCase().trim() === term
      );
    }

    if (empresaEncontrada) {
      nombreEmpresaStr = empresaEncontrada.name_empresa;
      idEmpresa = empresaEncontrada.id_empresa;
    }

    // 6. Si es un registro propio de Transmac (SST) sin empresa mapeada
    if (!proyectoEncontrado && !empresaEncontrada) {
      const termEmp = nombreEmpresaStr.toLowerCase();
      const termProj = nombreProyectoStr.toLowerCase();
      if (termEmp.includes('sst') || termEmp.includes('transmac') || termProj.includes('sst')) {
        const transmacCompany = empresasBD.find(e => String(e.name_empresa || '').toLowerCase().includes('transmac'));
        if (transmacCompany) {
          nombreEmpresaStr = transmacCompany.name_empresa;
          idEmpresa = transmacCompany.id_empresa;
          // Asignar el proyecto SST por defecto
          const sstProj = proyectosBD.find(p => String(p.id_empresa_cliente) === String(idEmpresa));
          if (sstProj) {
            idProyecto = sstProj.id_proyecto;
            nombreProyectoStr = sstProj.nombre_proyecto;
          }
        }
      }
    }

    return {
      id_proyecto: idProyecto || flujoOriginal.id_proyecto || null,
      id_empresa_cliente: idEmpresa || flujoOriginal.id_empresa_cliente || null,
      nombre_proyecto: nombreProyectoStr || 'Sin Proyecto',
      name_empresa_cliente: nombreEmpresaStr || 'Empresa Sin Asignar'
    };
  }

  const obtenerFlujos = async () => {
    loading.value = true;
    try {
      const responseFlujos = await apiAxios.get('/servicio/leanglobal/procesosSurveyV3', {
        params: {
          fecha_desde: fechaDesde.value,
          fecha_hasta: fechaHasta.value,
          'ts.id_empresa_cliente': cliente.value || '',
          'ts.id_proyecto': proyecto.value || ''
        }
      }).catch(() => ({ data: { datos: [] } }));

      // Fetch SST records
      const sstRegistrosReq = sstAxios.get('/sst/registros').catch(() => ({ data: [] }));
      const sstRessoReq = sstAxios.get('/audits?type=RESSO').catch(() => ({ data: [] }));
      const sstRecssReq = sstAxios.get('/audits?type=RECSS').catch(() => ({ data: [] }));
      const sstMinsalReq = sstAxios.get('/audits?type=MINSAL').catch(() => ({ data: [] }));

      const [sstRegistrosRes, sstRessoRes, sstRecssRes, sstMinsalRes] = await Promise.all([
        sstRegistrosReq, sstRessoReq, sstRecssReq, sstMinsalReq
      ]);

      const responseDetalles = await apiAxios.get(`/servicio/leanglobal/flujosAprobacionSteps`).catch(() => ({ data: [] }));
      const responseUsuariosRoles = await apiAxios.get(`/servicio/leanglobal/obtenerUsuariosRoles`).catch(() => ({ data: [] }));
      
      let unifiedData = [];

      // 1. Mapear Surveys (Listados de Verificación)
      const encuestasData = responseFlujos.data.datos || [];
      unifiedData.push(...encuestasData.map(s => {
        const norm = resolverRelacionBD({
          id_proyecto: s.id_proyecto,
          id_empresa_cliente: s.id_empresa_cliente,
          nombre_proyecto: s.nombre_proyecto,
          name_empresa_cliente: s.name_empresa_cliente
        });
        return {
          ...s,
          _source: 'SURVEY',
          id_proyecto: norm.id_proyecto,
          id_empresa_cliente: norm.id_empresa_cliente,
          nombre_proyecto: norm.nombre_proyecto,
          name_empresa_cliente: norm.name_empresa_cliente,
          tematica_funcional: s.name_area || 'Listados de Verificación',
          documento: s.name_template_srv || 'Encuesta Genérica',
          fecha_display: s.fecha_plan_ini || '',
          estado_srv: s.estado_srv || 'APROBADO'
        };
      }));

      // 2. Mapear Inspecciones de Equipos (sst/registros)
      const registrosData = sstRegistrosRes.data || [];
      unifiedData.push(...registrosData.map(r => {
        const norm = resolverRelacionBD({
          nombre_proyecto: r.nombre_proyecto,
          name_empresa_cliente: r.codi_proyecto
        });
        return {
          id_survey: `reg-${r.id_registro}`,
          id_flow: `reg-${r.id_registro}`,
          _source: 'REGISTROS',
          id_proyecto: norm.id_proyecto,
          id_empresa_cliente: norm.id_empresa_cliente,
          nombre_proyecto: norm.nombre_proyecto,
          name_empresa_cliente: norm.name_empresa_cliente,
          tematica_funcional: 'Inspecciones de Equipos',
          documento: 'Registro SST Mensual',
          fecha_display: r.created_at ? r.created_at.split('T')[0] : '',
          estado_srv: 'APROBADO',
          data: r
        };
      }));

      // 3. Mapear Reporte Conductual SST (RECSS)
      const recssData = sstRecssRes.data || [];
      unifiedData.push(...recssData.map(r => {
        const norm = resolverRelacionBD({
          nombre_proyecto: r.projectName,
          name_empresa_cliente: r.companyName
        });
        return {
          id_survey: `recss-${r.id}`,
          id_flow: `recss-${r.id}`,
          _source: 'RECSS',
          id_proyecto: norm.id_proyecto,
          id_empresa_cliente: norm.id_empresa_cliente,
          nombre_proyecto: norm.nombre_proyecto,
          name_empresa_cliente: norm.name_empresa_cliente,
          tematica_funcional: 'Reporte Conductual SST',
          documento: r.auditName || 'Observación RECSS',
          fecha_display: r.date ? r.date.split('T')[0] : '',
          estado_srv: r.status || 'APROBADO',
          data: r
        };
      }));

      // 4. Mapear RESSO
      const ressoData = sstRessoRes.data || [];
      unifiedData.push(...ressoData.map(r => {
        const norm = resolverRelacionBD({
          nombre_proyecto: r.projectName,
          name_empresa_cliente: r.companyName
        });
        return {
          id_survey: `resso-${r.id}`,
          id_flow: `resso-${r.id}`,
          _source: 'RESSO',
          id_proyecto: norm.id_proyecto,
          id_empresa_cliente: norm.id_empresa_cliente,
          nombre_proyecto: norm.nombre_proyecto,
          name_empresa_cliente: norm.name_empresa_cliente,
          tematica_funcional: 'Auditoría RESSO',
          documento: r.auditName || 'Informe RESSO',
          fecha_display: r.date ? r.date.split('T')[0] : '',
          estado_srv: r.status || 'APROBADO',
          data: r
        };
      }));

      // 5. Mapear MINSAL
      const minsalData = sstMinsalRes.data || [];
      unifiedData.push(...minsalData.map(r => {
        const norm = resolverRelacionBD({
          nombre_proyecto: r.projectName,
          name_empresa_cliente: r.companyName
        });
        return {
          id_survey: `minsal-${r.id}`,
          id_flow: `minsal-${r.id}`,
          _source: 'MINSAL',
          id_proyecto: norm.id_proyecto,
          id_empresa_cliente: norm.id_empresa_cliente,
          nombre_proyecto: norm.nombre_proyecto,
          name_empresa_cliente: norm.name_empresa_cliente,
          tematica_funcional: 'Auditoría MINSAL',
          documento: r.auditName || 'Informe MINSAL',
          fecha_display: r.date ? r.date.split('T')[0] : '',
          estado_srv: r.status || 'APROBADO',
          data: r
        };
      }));

      const detallesData = responseDetalles.data || [];
      
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = Number(storedUser.id_user);
      const rolesUsuario = responseUsuariosRoles.data
        .filter(ur => String(ur.id_user) === String(currentUserId))
        .map(ur => Number(ur.id_rol))
        .filter(Number.isFinite);

      const flujosConDetalles = unifiedData.map(flujo => {
        if (flujo._source === 'SURVEY') {
          return {
            ...flujo,
            detalles: detallesData.filter(det => det.id_flow === flujo.id_flow)
          };
        }
        return { ...flujo, detalles: [] };
      });

      flujosConDetalles.sort((a, b) => Number(b.id_survey) - Number(a.id_survey));
      flujos.value = flujosConDetalles;

      const isStepForCurrentUser = (det) => {
        if (det?.flag_equipo === true) return true;
        if (det?.id_user == null || det?.id_user === '') return true;
        return Number(det.id_user) === currentUserId;
      };

      const canCurrentUserSign = (det) => {
        const byEstado = det.estado === 'PENDIENTE';
        const idRol = Number(det?.id_rol);
        const byRol = rolesUsuario.includes(idRol) || idRol === 0;
        const byUsuario = isStepForCurrentUser(det);
        return byEstado && byRol && byUsuario;
      };

      const esUltimoFirmanteUsuario = (flujo) => {
        const estado = String(flujo?.estado_srv ?? '').toUpperCase().trim();
        return estado === 'APROBADO' || estado === 'RECHAZADO';
      };

      const primerPasoPendiente = (flujo) => {
        const pasos = Array.isArray(flujo?.detalles) ? [...flujo.detalles] : [];
        pasos.sort((a, b) => Number(a?.flow_tmpl_step_orden || 99) - Number(b?.flow_tmpl_step_orden || 99));
        return pasos.find(det => String(det?.estado ?? '').toUpperCase().trim() === 'PENDIENTE') || null;
      };

      flujosDocumentos.value = flujosConDetalles
        .map(flujo => {
          const detallesFlujo = Array.isArray(flujo?.detalles) ? [...flujo.detalles].sort((a, b) => Number(a?.flow_tmpl_step_orden || 99) - Number(b?.flow_tmpl_step_orden || 99)) : [];
          const primerPendiente = primerPasoPendiente({ ...flujo, detalles: detallesFlujo });
          return { flujo, primerPendiente, detallesFlujo };
        })
        .filter(x => !esUltimoFirmanteUsuario(x.flujo))
        .filter(x => !!x.primerPendiente && canCurrentUserSign(x.primerPendiente))
        .map(x => ({
          ...x.flujo,
          detalles_flujo: x.detallesFlujo,
          detalles: [x.primerPendiente]
        }));
        
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  };

  const filtrar = () => {
    fechaDesde.value = fechaDesdeSeleccionada.value;
    fechaHasta.value = fechaHastaSeleccionada.value;
    cliente.value = clienteSeleccionado.value;
    proyecto.value = proyectoSeleccionado.value;
    obtenerFlujos();
  };

  function fmtFecha(iso) {
    if (!iso) return '';
    try {
      const parts = String(iso).split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return iso;
    } catch {
      return iso;
    }
  }

  function getEstadoFlujoColor(estado) {
    const e = normalizeEstado(estado);
    if (e === 'APROBADO') return 'bg-green-600';
    if (e === 'CREADO') return 'bg-indigo-600';
    if (e.includes('VERIFICACION')) return 'bg-amber-500';
    if (e === 'RECHAZADO') return 'bg-red-600';
    return 'bg-gray-500';
  }

  watch(clienteSeleccionado, (nuevoCliente) => {
    if (nuevoCliente) {
      obtenerProyectos(nuevoCliente);
    } else {
      proyectoSeleccionado.value = null;
    }
  });

  onMounted(async () => {
    await obtenerClientes();
    await obtenerProyectos();
    await obtenerAreas();
    await obtenerFlujos();
    obtenerRoles();
    obtenerMotivosRechazo();
  });

  return {
    estadoAdminAll, estadoAdminAprobado, estadoAdminCreado, estadoAdminVerificacion, estadoAdminPendiente, estadoAdminRechazado,
    fechaDesdeSeleccionada, fechaHastaSeleccionada, clienteSeleccionado, proyectoSeleccionado,
    clientes, proyectos, flujosDocumentos, treeRows, expandedNodes, flujos,
    dialogConfirmarTerminar, dialogSurvey, surveyModalUrl, pdfUrl, detalleCrearFirma, roles, motivosRechazo,
    loading, error,
    toggleNode, filtrar, fmtFecha, getEstadoFlujoColor
  };
}
