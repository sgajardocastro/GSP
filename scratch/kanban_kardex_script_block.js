// =========================================================================
// LÓGICA COMPARTIDA PARA VISTA 2 (KANBAN + FILTROS) Y VISTA 3 (CARDEX 3D)
// =========================================================================
const tipoFechaKanbanPro = ref('EJECUCION') // 'EJECUCION' | 'VENTA'
const presetFechaKanbanPro = ref('TODOS') // 'TODOS' | 'HOY' | 'MANANA' | 'SEMANA' | 'MES' | 'CUSTOM'
const fechaDesdeKanbanPro = ref('')
const fechaHastaKanbanPro = ref('')
const fechaPuntualKardex = ref('')
const filtroOperadorKanbanPro = ref('')
const filtroRiggerKanbanPro = ref('')
const filtroEquipoKanbanPro = ref('')
const filtroClienteKanbanPro = ref('')
const filtroVendedorKanbanPro = ref('')
const densidadKanbanPro = ref('expandida') // 'expandida' | 'compacta'

// Estado exclusivo de interacción 3D en Cardex
const hoveredKardexId = ref(null)
const kardexSoloLevantadas = ref(false)
const kardexLevantarTodas = ref(false)
const kardexPinesManuales = ref(new Set())

const toggleTarjetaKardexManual = (idProyecto) => {
  const next = new Set(kardexPinesManuales.value)
  if (next.has(idProyecto)) {
    next.delete(idProyecto)
  } else {
    next.add(idProyecto)
  }
  kardexPinesManuales.value = next
}

const toLocalIsoDate = (val) => {
  if (!val) return ''
  const str = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const formatIsoToDdMmYyyy = (iso) => {
  if (!iso || iso.length < 10) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

const formatIsoToDdMm = (iso) => {
  if (!iso || iso.length < 10) return '—'
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}`
}

const getFichaOperativa = (p) => {
  if (!p) {
    return {
      esSoloRigger: false,
      fechaVentaIso: '',
      fechaEjecIniIso: '',
      fechaEjecFinIso: '',
      fechaVentaLabel: '—',
      fechaEjecIniLabel: '—',
      fechaEjecFinLabel: '—',
      fechaVentaCorto: '—',
      fechaEjecIniCorto: '—',
      equipoNombre: '',
      equipoLabel: 'Sin Equipo',
      operadorNombre: '',
      operadorLabel: '⚠️ Sin Operador',
      sinOperador: true,
      riggerNombre: '',
      riggerLabel: 'No requerido',
      faltaRigger: false,
      requiereRigger: false
    }
  }

  const crm = p.json_field?.crm_v1 || {}
  const ej = p.json_field?.ejecucion_v1 || {}
  const lineas = Array.isArray(crm.lineas_servicio) ? crm.lineas_servicio : []
  const repList = getReportsProyecto(p.id_proyecto)

  // 1. Detectar si es Servicio Solo Rigger / Solo Personal Certificado
  const esSoloRigger = Boolean(
    crm.modalidad_tarifa === 'SOLO_RIGGER' ||
    crm.requiere_maquinaria === false ||
    (lineas.length > 0 && lineas.every(l => {
      const t = String(l.tipo || l.categoria || '').toUpperCase().trim()
      const s = String(l.subcategoria || '').toUpperCase().trim()
      if (t !== '' && !t.includes('PERSONAL')) return false
      return t.includes('PERSONAL') || s === 'RIGGER' || s === 'PREVENCIONISTA'
    }))
  )

  // 2. Resolver Fecha de Venta y Ventana de Ejecución (Inicio -> Fin)
  const histCot = Array.isArray(crm.cotizaciones_historicas) ? crm.cotizaciones_historicas : []
  const rawVenta = histCot.at(-1)?.fecha || p.fecha_creacion || p.fecha_plan_ini
  const rawEjecIni = ej.fecha_salida_plan || crm.fecha_hora_inicio || lineas[0]?.fecha_plan_ini || p.fecha_plan_ini || p.fecha_creacion
  const rawEjecFin = ej.fecha_fin_plan || crm.fecha_hora_termino || lineas[0]?.fecha_plan_fin || p.fecha_plan_fin || rawEjecIni

  const fechaVentaIso = toLocalIsoDate(rawVenta)
  const fechaEjecIniIso = toLocalIsoDate(rawEjecIni)
  const fechaEjecFinIso = toLocalIsoDate(rawEjecFin) || fechaEjecIniIso

  // 3. Resolver Equipo / Patente (principal + auxiliares/fletes)
  const extraEq = Array.isArray(ej.equipos_extra) ? ej.equipos_extra.find(ex => ex && typeof ex === 'object' && ex.id_equipo) : null
  const detEq = Array.isArray(ej.equipos_detalle) ? ej.equipos_detalle.find(ed => ed && typeof ed === 'object' && ed.id_equipo) : null
  const allEqIds = new Set()
  if (ej.equipo_id) allEqIds.add(Number(ej.equipo_id))
  lineas.forEach(l => { if (l.equipo_asignado_id) allEqIds.add(Number(l.equipo_asignado_id)); if (l.id_equipo) allEqIds.add(Number(l.id_equipo)) })
  if (Array.isArray(ej.equipos_ids)) ej.equipos_ids.forEach(id => { if (id) allEqIds.add(Number(id)) })
  if (Array.isArray(ej.flota_traslado_ids)) ej.flota_traslado_ids.forEach(id => { if (id) allEqIds.add(Number(id)) })
  if (Array.isArray(ej.equipos_detalle)) ej.equipos_detalle.forEach(ed => { if (ed?.id_equipo) allEqIds.add(Number(ed.id_equipo)) })
  if (Array.isArray(ej.equipos_extra)) ej.equipos_extra.forEach(ex => { if (ex?.id_equipo) allEqIds.add(Number(ex.id_equipo)) })
  if (Array.isArray(ej.recursos_asignados?.equipos)) ej.recursos_asignados.equipos.forEach(re => { if (re?.id_equipo || re?.id) allEqIds.add(Number(re.id_equipo || re.id)) })

  const equiposNombres = []
  if (flotaEquiposMaster.value.length > 0) {
    allEqIds.forEach(id => {
      const eqObj = flotaEquiposMaster.value.find(e => Number(e.id_equipo) === Number(id))
      if (eqObj) {
        const lbl = `[${eqObj.patente}] ${eqObj.nombre_equipo || eqObj.modelo || ''}`.trim()
        if (lbl && !equiposNombres.includes(lbl)) equiposNombres.push(lbl)
      }
    })
  }

  let equipoNombre = ''
  if (esSoloRigger) {
    equipoNombre = 'Solo Rigger (Sin Máquina)'
  } else {
    const idEq = ej.equipo_id ||
      lineas.find(l => l.equipo_asignado_id)?.equipo_asignado_id ||
      detEq?.id_equipo ||
      extraEq?.id_equipo ||
      (Array.isArray(ej.equipos_ids) ? ej.equipos_ids[0] : null) ||
      (Array.isArray(ej.flota_traslado_ids) ? ej.flota_traslado_ids[0] : null) ||
      ej.recursos_asignados?.equipos?.[0]?.id_equipo ||
      ej.recursos_asignados?.equipos?.[0]?.id
    if (idEq && flotaEquiposMaster.value.length > 0) {
      const eqObj = flotaEquiposMaster.value.find(e => Number(e.id_equipo) === Number(idEq))
      if (eqObj) {
        equipoNombre = `[${eqObj.patente}] ${eqObj.nombre_equipo || eqObj.modelo || ''}`.trim()
      }
    }
    if (!equipoNombre && equiposNombres.length > 0) {
      equipoNombre = equiposNombres[0]
    }
    if (!equipoNombre) {
      const pat = repList[0]?.equipo_patente || ej.patente_grua || lineas.find(l => l.patente)?.patente || detEq?.patente
      if (pat) equipoNombre = `[${pat}]`
    }
    if (equipoNombre && !equiposNombres.includes(equipoNombre)) {
      equiposNombres.unshift(equipoNombre)
    }
  }
  const lineaEquipoComercial = lineas.find(l => {
    const t = String(l.tipo || l.categoria || '').toUpperCase().trim()
    return t !== '' && !t.includes('PERSONAL') && !t.includes('TRASLADO') && !t.includes('FLETE')
  })
  const reqEquipoComercial = lineaEquipoComercial?.subcategoria || lineaEquipoComercial?.tipo || lineaEquipoComercial?.descripcion || crm.familia_servicio
  const equipoLabel = equipoNombre || (reqEquipoComercial ? `Req: ${reqEquipoComercial}` : '⚠️ Sin Equipo')

  // 4. Resolver Operador
  let operadorNombre = ''
  if (!esSoloRigger) {
    const idOp = ej.operador_id ||
      lineas.find(l => l.operador_asignado_id)?.operador_asignado_id ||
      extraEq?.chofer_id ||
      ej.chofer_id ||
      ej.tripulacion_asignada?.find(t => /operador|chofer|conductor/i.test(t.rol || t.cargo || ''))?.id_user
    if (idOp && mapaUsuarios.value.has(Number(idOp))) {
      operadorNombre = mapaUsuarios.value.get(Number(idOp))
    } else {
      operadorNombre = repList[0]?.operador_nombre || ej.operador_nombre || ''
    }
  }
  const sinOperador = !esSoloRigger && !operadorNombre
  const operadorLabel = esSoloRigger
    ? 'No aplica (Solo Rigger)'
    : (operadorNombre || '⚠️ Sin Operador')

  // 5. Resolver Rigger
  let riggerNombre = ''
  const espRigger = Array.isArray(ej.especialistas_terreno)
    ? ej.especialistas_terreno.find(e => /rigger/i.test(e.cargo || e.rol || ''))
    : null
  const tripRigger = Array.isArray(ej.tripulacion_asignada)
    ? ej.tripulacion_asignada.find(t => /rigger/i.test(t.rol || t.cargo || ''))
    : null
  const idRg = ej.rigger_id ||
    lineas.find(l => l.rigger_asignado_id)?.rigger_asignado_id ||
    espRigger?.id_user ||
    tripRigger?.id_user
  if (idRg && mapaUsuarios.value.has(Number(idRg))) {
    riggerNombre = mapaUsuarios.value.get(Number(idRg))
  } else {
    riggerNombre = espRigger?.nombre_completo || espRigger?.nombre || tripRigger?.nombre_completo || tripRigger?.nombre || ''
  }

  const requiereRigger = Boolean(
    esSoloRigger ||
    crm.requiere_rigger === true ||
    lineas.some(l => l.requiere_rigger === true) ||
    riggerNombre
  )
  const faltaRigger = requiereRigger && !riggerNombre
  const riggerLabel = riggerNombre
    ? riggerNombre
    : (requiereRigger ? '⚠️ Falta Rigger' : 'No requerido')

  return {
    esSoloRigger,
    fechaVentaIso,
    fechaEjecIniIso,
    fechaEjecFinIso,
    fechaVentaLabel: formatIsoToDdMmYyyy(fechaVentaIso),
    fechaEjecIniLabel: formatIsoToDdMmYyyy(fechaEjecIniIso),
    fechaEjecFinLabel: formatIsoToDdMmYyyy(fechaEjecFinIso),
    fechaVentaCorto: formatIsoToDdMm(fechaVentaIso),
    fechaEjecIniCorto: formatIsoToDdMm(fechaEjecIniIso),
    equipoNombre,
    equiposNombres,
    equipoLabel,
    operadorNombre,
    operadorLabel,
    sinOperador,
    riggerNombre,
    riggerLabel,
    faltaRigger,
    requiereRigger
  }
}

const seleccionarPresetFechaPro = (presetId) => {
  presetFechaKanbanPro.value = presetId
  fechaPuntualKardex.value = ''
  const hoy = new Date()
  const toIso = (d) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  if (presetId === 'TODOS') {
    fechaDesdeKanbanPro.value = ''
    fechaHastaKanbanPro.value = ''
  } else if (presetId === 'HOY') {
    const h = toIso(hoy)
    fechaDesdeKanbanPro.value = h
    fechaHastaKanbanPro.value = h
  } else if (presetId === 'MANANA') {
    const m = new Date(hoy)
    m.setDate(m.getDate() + 1)
    const isoM = toIso(m)
    fechaDesdeKanbanPro.value = isoM
    fechaHastaKanbanPro.value = isoM
  } else if (presetId === 'SEMANA') {
    const d1 = new Date(hoy)
    const day = d1.getDay() || 7
    d1.setDate(d1.getDate() - day + 1)
    const d2 = new Date(d1)
    d2.setDate(d2.getDate() + 6)
    fechaDesdeKanbanPro.value = toIso(d1)
    fechaHastaKanbanPro.value = toIso(d2)
  } else if (presetId === 'MES') {
    const d1 = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const d2 = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    fechaDesdeKanbanPro.value = toIso(d1)
    fechaHastaKanbanPro.value = toIso(d2)
  }
}

const seleccionarFechaPuntualKardex = (iso) => {
  if (fechaPuntualKardex.value === iso) {
    fechaPuntualKardex.value = ''
    presetFechaKanbanPro.value = 'TODOS'
    fechaDesdeKanbanPro.value = ''
    fechaHastaKanbanPro.value = ''
  } else {
    fechaPuntualKardex.value = iso
    presetFechaKanbanPro.value = 'CUSTOM'
    fechaDesdeKanbanPro.value = iso
    fechaHastaKanbanPro.value = iso
  }
}

const limpiarFiltrosKanbanPro = () => {
  presetFechaKanbanPro.value = 'TODOS'
  fechaDesdeKanbanPro.value = ''
  fechaHastaKanbanPro.value = ''
  fechaPuntualKardex.value = ''
  filtroOperadorKanbanPro.value = ''
  filtroRiggerKanbanPro.value = ''
  filtroEquipoKanbanPro.value = ''
  filtroClienteKanbanPro.value = ''
  filtroVendedorKanbanPro.value = ''
  busquedaKanban.value = ''
  kardexLevantarTodas.value = false
  kardexPinesManuales.value = new Set()
}

const todosProyectosTableroList = computed(() => [
  ...preventa.value,
  ...verificacion.value,
  ...asignados.value,
  ...desplazamiento.value,
  ...maniobra.value,
  ...completados.value
])

const totalProyectosTablero = computed(() => todosProyectosTableroList.value.length)

const opcionesOperadoresKanban = computed(() => {
  const s = new Set()
  todosProyectosTableroList.value.forEach(p => {
    const op = getFichaOperativa(p).operadorNombre
    if (op) s.add(op)
  })
  return Array.from(s).sort()
})

const opcionesRiggersKanban = computed(() => {
  const s = new Set()
  todosProyectosTableroList.value.forEach(p => {
    const rg = getFichaOperativa(p).riggerNombre
    if (rg) s.add(rg)
  })
  return Array.from(s).sort()
})

const opcionesEquiposKanban = computed(() => {
  const s = new Set()
  todosProyectosTableroList.value.forEach(p => {
    const f = getFichaOperativa(p)
    if (f.equipoNombre) s.add(f.equipoNombre)
    if (Array.isArray(f.equiposNombres)) {
      f.equiposNombres.forEach(n => { if (n) s.add(n) })
    }
  })
  return Array.from(s).sort()
})

const opcionesClientesKanban = computed(() => {
  const s = new Set()
  todosProyectosTableroList.value.forEach(p => {
    if (p.nombre_cliente) s.add(p.nombre_cliente)
  })
  return Array.from(s).sort()
})

const opcionesVendedoresKanban = computed(() => {
  const s = new Set()
  todosProyectosTableroList.value.forEach(p => {
    const v = getNombreVendedor(p)
    if (v) s.add(v)
  })
  return Array.from(s).sort()
})

const fechasDisponiblesKardex = computed(() => {
  const counts = new Map()
  todosProyectosTableroList.value.forEach(p => {
    const f = getFichaOperativa(p)
    const iso = tipoFechaKanbanPro.value === 'EJECUCION' ? f.fechaEjecIniIso : f.fechaVentaIso
    if (iso) {
      counts.set(iso, (counts.get(iso) || 0) + 1)
    }
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12)
    .map(([iso, count]) => ({
      iso,
      label: formatIsoToDdMm(iso),
      count
    }))
})

const tieneFiltrosActivosKanbanPro = computed(() => {
  return Boolean(
    presetFechaKanbanPro.value !== 'TODOS' ||
    fechaDesdeKanbanPro.value ||
    fechaHastaKanbanPro.value ||
    filtroOperadorKanbanPro.value ||
    filtroRiggerKanbanPro.value ||
    filtroEquipoKanbanPro.value ||
    filtroClienteKanbanPro.value ||
    filtroVendedorKanbanPro.value ||
    busquedaKanban.value.trim()
  )
})

const tieneCriterioActivoKardex = computed(() => {
  return Boolean(
    tieneFiltrosActivosKanbanPro.value ||
    fechaPuntualKardex.value ||
    kardexLevantarTodas.value ||
    kardexPinesManuales.value.size > 0
  )
})

const coincideFiltrosKanbanPro = (p) => {
  if (!p) return false
  if (filtroTipoProyecto.value === 'INTERNOS' && !esProyectoInterno(p)) return false
  if (filtroTipoProyecto.value === 'COMERCIALES' && esProyectoInterno(p)) return false

  const ficha = getFichaOperativa(p)

  // 1. Búsqueda de texto enriquecida (incluye Operador, Rigger, Equipo principal y auxiliares, Folio, Cliente, Obra)
  if (busquedaKanban.value.trim()) {
    const q = busquedaKanban.value.trim().toLowerCase()
    const hayMatchTexto =
      coincideBusqueda(p, q) ||
      ficha.operadorLabel.toLowerCase().includes(q) ||
      ficha.riggerLabel.toLowerCase().includes(q) ||
      ficha.equipoLabel.toLowerCase().includes(q) ||
      (Array.isArray(ficha.equiposNombres) && ficha.equiposNombres.some(n => n.toLowerCase().includes(q)))
    if (!hayMatchTexto) return false
  }

  // 2. Filtro por Fecha (Ejecución o Venta)
  if (fechaDesdeKanbanPro.value || fechaHastaKanbanPro.value) {
    const desde = fechaDesdeKanbanPro.value || '0000-01-01'
    const hasta = fechaHastaKanbanPro.value || '9999-12-31'
    if (tipoFechaKanbanPro.value === 'VENTA') {
      if (!ficha.fechaVentaIso) return false
      if (ficha.fechaVentaIso < desde || ficha.fechaVentaIso > hasta) return false
    } else {
      const ini = ficha.fechaEjecIniIso
      const fin = ficha.fechaEjecFinIso || ini
      if (!ini) return false
      // Traslape de rangos: [ini, fin] se solapa con [desde, hasta]
      if (fin < desde || ini > hasta) return false
    }
  }

  // 3. Filtro por Operador
  if (filtroOperadorKanbanPro.value) {
    if (filtroOperadorKanbanPro.value === '__SIN_OPERADOR__') {
      if (!ficha.sinOperador) return false
    } else if (ficha.operadorNombre !== filtroOperadorKanbanPro.value) {
      return false
    }
  }

  // 4. Filtro por Rigger
  if (filtroRiggerKanbanPro.value) {
    if (filtroRiggerKanbanPro.value === '__SOLO_RIGGER__') {
      if (!ficha.esSoloRigger) return false
    } else if (filtroRiggerKanbanPro.value === '__FALTA_RIGGER__') {
      if (!ficha.faltaRigger) return false
    } else if (ficha.riggerNombre !== filtroRiggerKanbanPro.value) {
      return false
    }
  }

  // 5. Filtro por Equipo / Patente (principal o auxiliar/flete)
  if (filtroEquipoKanbanPro.value) {
    const matchEq = ficha.equipoNombre === filtroEquipoKanbanPro.value ||
      (Array.isArray(ficha.equiposNombres) && ficha.equiposNombres.includes(filtroEquipoKanbanPro.value))
    if (!matchEq) return false
  }

  // 6. Filtro por Cliente
  if (filtroClienteKanbanPro.value && p.nombre_cliente !== filtroClienteKanbanPro.value) {
    return false
  }

  // 7. Filtro por Ejecutivo Comercial
  if (filtroVendedorKanbanPro.value && getNombreVendedor(p) !== filtroVendedorKanbanPro.value) {
    return false
  }

  return true
}

const columnasKanbanPro = computed(() => {
  const defs = [
    {
      id: 'preventa',
      titulo: 'Requerimiento Registrado',
      subtab: 'comercial',
      esOperativa: false,
      borderTopClass: 'border-[#6366f1]',
      dotClass: 'bg-[#6366f1]',
      badgeCountClass: 'text-[#818cf8] border-[#6366f1]/30',
      codeTextClass: 'text-[#818cf8]',
      etiquetaPie: 'Preventa',
      source: preventa.value
    },
    {
      id: 'verificacion',
      titulo: 'En Verificación Operaciones',
      subtab: 'validacion',
      esOperativa: false,
      borderTopClass: 'border-amber-500',
      dotClass: 'bg-amber-500',
      badgeCountClass: 'text-amber-400 border-amber-500/30',
      codeTextClass: 'text-amber-400',
      etiquetaPie: 'Validación',
      source: verificacion.value
    },
    {
      id: 'asignacion',
      titulo: 'En Asignación Recursos',
      subtab: 'asignacion',
      esOperativa: true,
      borderTopClass: 'border-blue-500',
      dotClass: 'bg-blue-500',
      badgeCountClass: 'text-blue-400 border-blue-500/30',
      codeTextClass: 'text-blue-400',
      etiquetaPie: 'Asignando OT',
      source: asignados.value
    },
    {
      id: 'preparacion',
      titulo: 'En Preparación Operaciones',
      subtab: 'preparacion_salida',
      esOperativa: true,
      borderTopClass: 'border-cyan-500',
      dotClass: 'bg-cyan-400',
      badgeCountClass: 'text-cyan-400 border-cyan-500/30',
      codeTextClass: 'text-cyan-400',
      etiquetaPie: 'Patio / Salida',
      source: desplazamiento.value
    },
    {
      id: 'ejecucion',
      titulo: 'En Ejecución / Faena',
      subtab: 'reports',
      esOperativa: true,
      borderTopClass: 'border-purple-400',
      dotClass: 'bg-purple-400',
      badgeCountClass: 'text-purple-300 border-purple-500/30',
      codeTextClass: 'text-purple-300',
      etiquetaPie: 'Izaje / Faena',
      source: maniobra.value
    },
    {
      id: 'finalizado',
      titulo: 'Finalizado / Contabilidad',
      subtab: 'liquidacion',
      esOperativa: true,
      borderTopClass: 'border-emerald-500',
      dotClass: 'bg-emerald-400',
      badgeCountClass: 'text-emerald-300 border-emerald-500/30',
      codeTextClass: 'text-emerald-400',
      etiquetaPie: 'Liquidación & EDP',
      source: completados.value
    }
  ]

  return defs.map(col => ({
    ...col,
    totalSinFiltro: col.source.length,
    items: col.source.filter(p => coincideFiltrosKanbanPro(p))
  }))
})

const totalCoincidenciasKanbanPro = computed(() => {
  return columnasKanbanPro.value.reduce((acc, col) => acc + col.items.length, 0)
})

// Lógica de elevación 3D en Cardex:
// Una tarjeta se levanta si hay algún filtro/criterio activo y la tarjeta coincide con él,
// o si el usuario hizo clic/hover sobre ella, o si activó "Levantar todas".
const esTarjetaCoincidenteCriterio = (p) => {
  if (!tieneFiltrosActivosKanbanPro.value) return false
  return coincideFiltrosKanbanPro(p)
}

const esTarjetaLevantadaKardex = (p) => {
  if (!p) return false
  if (kardexLevantarTodas.value) return true
  if (hoveredKardexId.value === p.id_proyecto) return true
  if (kardexPinesManuales.value.has(p.id_proyecto)) return true
  if (tieneFiltrosActivosKanbanPro.value && coincideFiltrosKanbanPro(p)) return true
  return false
}

const columnasKardex3D = computed(() => {
  return columnasKanbanPro.value.map(col => {
    const baseList = col.source.filter(p => {
      if (filtroTipoProyecto.value === 'INTERNOS' && !esProyectoInterno(p)) return false
      if (filtroTipoProyecto.value === 'COMERCIALES' && esProyectoInterno(p)) return false
      return true
    })
    const itemsVisibles = kardexSoloLevantadas.value
      ? baseList.filter(p => esTarjetaLevantadaKardex(p))
      : baseList
    const levantadasCount = baseList.filter(p => esTarjetaLevantadaKardex(p)).length
    return {
      ...col,
      items: itemsVisibles,
      levantadasCount
    }
  })
})

const totalLevantadasKardex = computed(() => {
  return columnasKardex3D.value.reduce((acc, col) => acc + col.levantadasCount, 0)
})
