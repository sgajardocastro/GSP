export const amsaChecklistConfigs = {
  transmacExtintoresCalama: transmacExtintores(
    'FOR-SEG-006 INSPECCION MENSUAL DE EXTINTORES SUCURSAL CALAMA',
    [
      'Entrada oficinas', 'Sala de reuniones', 'Estacion de emergencia taller', 'Taller mecanico',
      'Taller mecanico pozo', 'Oficinas segundo piso taller', 'Sector comedor',
      'Habitaciones segundo piso', 'Otro'
    ]
  ),
  transmacExtintoresLosAndes: transmacExtintores(
    'FOR-SEG-006 INSPECCION MENSUAL DE EXTINTORES CASA MATRIZ LOS ANDES',
    [
      'Recepcion Transmac', 'Pasillo de transito oficinas', 'Sector estacionamientos',
      'Sector caseta de guardias', 'Bodega de insumos', 'Bodega de sustancias peligrosas',
      'Estacion de emergencia taller', 'Taller de soldadura', 'Bodega trasera', 'Taller general'
    ]
  ),
  transmacFatigaSomnolencia: {
    title: 'FOR-SEG-011 REGISTRO DE CHEQUEO FATIGA CONDUCTORES/OPERADORES',
    headerFields: [
      field('destinoAreaTransito', 'Destino / area de transito'),
      field('nombre', 'Nombre conductor / operador'),
      field('fecha', 'Fecha', 'date')
    ],
    groups: [
      group('chequeoFatiga', 'Chequeo previo a conduccion', 'sino', [
        'Ha dormido bien durante la noche y/o dia',
        'Ha ingerido medicamentos que induzcan al sueno durante el dia y/o noche',
        'Ha ingerido alcohol o drogas en las ultimas horas',
        'Se siente enfermo o fatigado',
        'Se encuentra en condiciones para conducir vehiculos livianos y/o equipos pesados'
      ])
    ],
    footerFields: auditFields()
  },
  transmacFatigaSomnolenciaSpa: {
    title: 'FOR-SEG-011 REGISTRO DE CHEQUEO FATIGA CONDUCTORES/OPERADORES SPA',
    headerFields: [
      field('destinoAreaTransito', 'Destino / area de transito'),
      field('nombre', 'Nombre conductor / operador'),
      field('fecha', 'Fecha', 'date')
    ],
    groups: [
      group('chequeoFatiga', 'Chequeo previo a conduccion', 'sino', [
        'Ha dormido bien durante la noche y/o dia',
        'Ha ingerido medicamentos que induzcan al sueno durante el dia y/o noche',
        'Ha ingerido alcohol o drogas en las ultimas horas',
        'Se siente enfermo o fatigado',
        'Se encuentra en condiciones para conducir vehiculos livianos y/o equipos pesados'
      ])
    ],
    footerFields: auditFields()
  },
  transmacHerramientasNeumaticas: simpleTransmacChecklist('CL-95 CHECK LIST HERRAMIENTAS NEUMATICAS', [
    'Martillos perforadores', 'Apisonadoras', 'Martillos cinceladores',
    'Herramientas de golpe, angulo y trinquete (llaves de tuerca)', 'Herramientas de enroscar',
    'Sierras accionadas por aire', 'Herramientas neumaticas fijadoras', 'Herramientas abrasivas',
    'Sistema de suministro de aire comprimido', 'Lineas o mangueras de suministro de aire',
    'Acoples chicago', 'Acoples rapidos', 'Piolas o cadenas de seguridad', 'Manometros', 'Otros'
  ]),
  transmacMiniCargador: equipmentTransmacChecklist('CL-93 CHECK LIST MINI CARGADOR', [
    'Estructura general cargador', 'Neumaticos traseros', 'Neumaticos delanteros', 'Cilindros de levante',
    'Cilindros de articulacion', 'Pala de carga', 'Comandos', 'Pasadores de cilindros',
    'Relojes de temperatura, aceite, petroleo', 'Flexibles', 'Canerias', 'Freno de estacionamiento',
    'Sistema de frenos', 'Enfriador de aceite', 'Vidrios', 'Espejos', 'Cabina',
    'Bocina y alarma de retroceso', 'Seguro del cilindro de levante de pala',
    'Bloqueador del sistema hidraulico', 'Motor', 'Radiador', 'Correas', 'Sistema electrico',
    'Cinturon de seguridad', 'Luces', 'Proteccion contra volcamiento', 'Horometro', 'Extintor',
    'Tapa motor', 'Otros'
  ]),
  transmacCamionAljibe: equipmentTransmacChecklist('CL-92 CHECK LIST CAMION ALJIBE', [
    'Extintor', 'Llave de rueda', 'Gata', 'Triangulos', 'Botiquin', 'Baliza',
    'Bocina y alarma de retroceso', 'Bateria', 'Neumatico de repuesto', 'Horometro',
    'Cuenta kilometros', 'Luces', 'Intermitentes', 'Espejos', 'Chapa de contacto y llaves',
    'Correas', 'Instrumentacion de tablero', 'Radiador y tapa enfriamiento / aceite',
    'Tapa combustible', 'Motor de arranque', 'Escala de acceso a estanque', 'Puertas y chapas',
    'Sistema electrico', 'Parabrisas y limpiaparabrisas', 'Sistema de frenos', 'Amortiguadores',
    'Paquete de resortes', 'Seguro de cardan', 'Crucetas', 'Parachoques', 'Sistema de direccion',
    'Servicio de frenos', 'Freno de mano o parqueo', 'Palanca de cambios', 'Escotilla',
    'Asientos', 'Calefaccion', 'Toma fuerza', 'Estanque de combustible', 'Reflectantes traseros',
    'Caja de herramientas', 'Motor', 'Mangueras', 'Radio', 'Estado general estanque',
    'Cinturon de seguridad', 'Estanque hidraulico', 'Rociadores', 'Mangueras y piton',
    'Estado de bomba de agua rociadores', 'Escotillas de agua', 'Caja toma fuerza',
    'Llave de paso bola', 'Manguera sistema neumatico rociadores', 'Caja control de rociadores',
    'Aseo del equipo'
  ]),
  transmacCamionPluma: equipmentTransmacChecklist('CL-91 CHECK LIST CAMION PLUMA', [
    'Extintor', 'Llave de rueda', 'Gata', 'Triangulos', 'Botiquin', 'Baliza',
    'Bocina y alarma de retroceso', 'Bateria', 'Neumatico de repuesto', 'Horometro',
    'Cuenta kilometros', 'Luces', 'Intermitentes', 'Espejos', 'Chapa de contacto y llaves',
    'Correas', 'Instrumentacion de tablero', 'Radiador y tapa enfriamiento / aceite',
    'Tapa combustible', 'Motor de arranque', 'Escala de acceso', 'Puertas y chapas',
    'Sistema electrico', 'Parabrisas y limpiaparabrisas', 'Sistema de frenos', 'Amortiguadores',
    'Paquete de resortes', 'Seguro de cardan', 'Crucetas', 'Parachoques', 'Sistema de direccion',
    'Servicio de frenos', 'Freno de mano o parqueo', 'Palanca de cambios', 'Escotilla',
    'Asientos', 'Calefaccion', 'Toma fuerza', 'Estanque de combustible', 'Reflectantes traseros',
    'Caja de herramientas', 'Motor', 'Mangueras', 'Radio', 'Cinturon de seguridad',
    'Cilindros, flexibles, pasadores y estanque hidraulico', 'Aseo del equipo',
    'Estabilizador', 'Accionador hidraulico', 'Cuerpo pluma', 'Gatos', 'Flexibles hidraulicos',
    'Conexiones hidraulicas', 'Comandos', 'Extension pluma', 'Gancho', 'Senaletica',
    'Sistema contra caidas', 'Sistema de bloqueo corta corriente', 'Almohadillas'
  ]),
  transmacCargadorFrontal: equipmentTransmacChecklist('CL-90 CHECK LIST CARGADOR FRONTAL', [
    'Estructura general cargador', 'Neumaticos traseros', 'Neumaticos delanteros', 'Cilindros de levante',
    'Cilindros de articulacion', 'Pala de carga', 'Comandos', 'Pasadores de cilindros',
    'Relojes de temperatura, aceite, petroleo', 'Flexibles', 'Canerias', 'Freno de estacionamiento',
    'Sistema de frenos', 'Enfriador de aceite', 'Vidrios', 'Espejos', 'Cabina',
    'Bocina y alarma de retroceso', 'Motor', 'Radiador', 'Correas', 'Sistema electrico',
    'Cinturon de seguridad', 'Escala de acceso', 'Luces', 'Proteccion contra volcamiento',
    'Horometro', 'Extintor', 'Radio VDF', 'Pertiga'
  ]),
  transmacCamionTolva: equipmentTransmacChecklist('CL-88 CHECK LIST CAMION TOLVA', [
    'Permiso de circulacion', 'Revision tecnica', 'Extintor', 'Llave de rueda', 'Gata',
    'Triangulos', 'Botiquin', 'Baliza', 'Bocina y alarma de retroceso', 'Bateria',
    'Neumatico de repuesto', 'Horometro', 'Cuenta kilometros', 'Luces', 'Intermitentes',
    'Espejos', 'Chapa de contacto y llaves', 'Correas', 'Instrumentacion de tablero',
    'Radiador y tapa enfriamiento / aceite', 'Tapa combustible', 'Motor de arranque',
    'Escala de acceso', 'Puertas y chapas', 'Sistema electrico', 'Parabrisas y limpiaparabrisas',
    'Sistema de frenos', 'Amortiguadores', 'Paquete de resortes', 'Seguro de cardan',
    'Crucetas', 'Parachoques', 'Sistema de direccion', 'Servicio de frenos',
    'Freno de mano o parqueo', 'Palanca de cambios', 'Escotilla', 'Asientos', 'Calefaccion',
    'Toma fuerza', 'Estanque de combustible', 'Reflectantes traseros', 'Caja de herramientas',
    'Motor', 'Mangueras', 'Radio', 'Estado general tolva', 'Cinturon de seguridad',
    'Cilindros, flexibles, pasadores y estanque hidraulico', 'Aseo del equipo'
  ]),
  transmacBulldozer: equipmentTransmacChecklist('CL-87 CHECK LIST BULLDOZER', [
    'Orugas o zapatas', 'Cilindros de levante', 'Cilindros de articulacion', 'Pala de carga',
    'Estructura de desgarrador', 'Mandos finales', 'Pasadores de cilindros',
    'Relojes de temperatura, aceite, petroleo', 'Flexibles', 'Freno de estacionamiento o parqueo',
    'Sistema frenos de servicio', 'Enfriador de aceite', 'Vidrios', 'Espejo de cabina',
    'Proteccion contra volcamiento', 'Cabina', 'Bocina', 'Alarma de retroceso',
    'Seguro del cilindro de levante de pala', 'Correas de ventilador', 'Sistema electrico',
    'Cinturon de seguridad', 'Escala de acceso', 'Luces', 'Extintor', 'Aseo del equipo'
  ]),
  transmacExcavadora: equipmentTransmacChecklist('CL-86 CHECK LIST EXCAVADORA', [
    'Estructura general excavadora', 'Orugas (desgaste y otros)', 'Cilindros de levante',
    'Cilindros de articulacion', 'Pala de carga', 'Estructura aguilon (desgaste, fisuras)',
    'Comandos', 'Pasadores de cilindros en general', 'Marcadores de temperatura, aceite, petroleo',
    'Flexibles (cortes, desgastes)', 'Canerias', 'Freno de estacionamiento (parqueo)',
    'Servicio de frenos', 'Enfriadores', 'Vidrios, espejos', 'Cabina',
    'Bocina y alarma de retroceso', 'Seguro del cilindro de levante de pala',
    'Bloqueador del sistema hidraulico', 'Motor (fugas y funcionamiento)', 'Radiador (fugas)',
    'Mangueras', 'Sistema electrico', 'Cinturon de seguridad (estado)', 'Escala de acceso',
    'Luces en general', 'Proteccion contra volcamiento', 'Horometro', 'Extintor',
    'Martillo picador (estado y cuna)', 'Unas balde', 'Funcionamiento tornamesa'
  ]),
  transmacLlaveImpactoNeumatica: simpleTransmacChecklist('CL-41 CHECK LIST LLAVE DE IMPACTO NEUMATICA', [
    'Manillar', 'Gatillo', 'Conexion Chicago', 'Cuadrante', 'Carcaza', 'Manguera',
    'Seguros goma', 'Seguros de Chicagos', 'Pato lubricador'
  ]),
  transmacSoldadora: simpleTransmacChecklist('CL-01 CHECK LIST SOLDADORA', [
    'Carcaza de maquina', 'Manilla de transporte', 'Topes de apoyo base', 'Limpieza',
    'Cable conductores 380-220 V', 'Cable conexion a tierra', 'Enchufe', 'Cable de porta electrodo',
    'Regulador de amperaje', 'Interruptor encendido', 'Luz piloto de encendido',
    'Funcionamiento de ventilador', 'Selector cambio de funcion', 'Portaelectrodo', 'Pinza a tierra'
  ]),
  transmacEsmerilAngular: simpleTransmacChecklist('CL-03 CHECK LIST ESMERIL ANGULAR', [
    'Carcasa', 'Apoyo', 'Boton traba disco', 'Interruptor', 'Cable de alimentacion',
    'Mango de apoyo', 'Mango auxiliar', 'Orificio para mango auxiliar', 'Tapa inspeccion de carbones',
    'Protector de disco', 'Disco de corte / desbaste', 'Enchufe macho para conexion a red',
    'Proteccion a tierra', 'Estado enchufe y conexion interna', 'Gatillo de accionamiento'
  ]),
  transmacElevadorPlataforma: simpleTransmacChecklist('CL-16 CHECK LIST ELEVADOR DE PLATAFORMA', [
    'Torre metalica apilomada y arriostrada', 'Tramos en buen estado', 'Cable de acero en buen estado',
    'Enrrollamiento correcto en el tambor', 'Poleas en buen estado', 'Freno manual operativo',
    'Freno auxiliar operativo', 'Protecciones y barandas perimetrales', 'Senalizacion de carga maxima',
    'Plataforma de carga afianzada', 'Conexion a tierra', 'Partidor protegido en caja con llave',
    'Operador con EPP', 'Registro de mantencion periodica', 'Existencia de bitacora del equipo'
  ]),
  transmacGanchosGrilletes: simpleTransmacChecklist('CL-09 CHECK LIST GANCHOS Y GRILLETES', [
    'Numero de registro', 'Indicacion de carga maxima', 'Seguro de cierre',
    'Abertura de cuello (maximo 15%)', 'Trizaduras y torceduras', 'Hilos en mal estado',
    'Pasador doblado', 'Distorsion del gancho', 'Estado de poleas', 'Almacenamiento',
    'Desgaste por roce de ganchos, grilletes y poleas', 'Persona responsable'
  ]),
  transmacCadenasAmarre: transmacAmarreChecklist('CL-10 CHECK LIST CADENAS DE AMARRE', [
    'Sello cadena', 'Placa / capacidad visible', 'Eslabones deformados',
    'Ganchos / terminales', 'Tensor / trinquete', 'Apto para uso'
  ]),
  transmacEslingasAmarre: transmacAmarreChecklist('CL-11 CHECK LIST ESLINGAS DE AMARRE', [
    'Sello eslinga', 'Etiqueta de capacidad', 'Cortes y desgastes', 'Ganchos', 'Ratchet', 'Apto para uso'
  ]),
  transmacElementosIzaje: simpleTransmacChecklist('CL-14 CHECK LIST ELEMENTOS DE IZAJE', [
    'Cables de acero / eslingas / estrobos: alambres cortados', 'Alambres desgastados',
    'Medicion del diametro del cable', 'Cocas o distorsion de alambres y torones',
    'Estiramiento o alargamiento cable', 'Corrosion', 'Falta de lubricacion',
    'Fatiga o picadura de alambre', 'Torcimiento', 'Abuso mecanico',
    'Aflojamiento de torones jaula de pajaros', 'Fajas desgastadas',
    'Estiramiento o alargamiento de faja', 'Etiqueta o sello de certificacion',
    'Grilletes desgastados', 'Pasador', 'Etiqueta o sello de certificacion'
  ]),
  transmacEvaluacionTerrenoIzaje: {
    title: 'CL-96 CHECK LIST EVALUACION PREVIA Y ENTREGA DE TERRENO PARA IZAJES CRITICOS',
    headerFields: [field('descripcionTrabajo', 'Descripcion de trabajo'), field('lugarIzaje', 'Lugar del izaje'), field('supervisor', 'Supervisor o capataz'), field('fecha', 'Fecha', 'date')],
    groups: [
      group('trayecto', 'Trayecto del camino al punto de trabajo', 'sinona', [
        'Camino con ancho suficiente, libre de obstrucciones y carpeta en buenas condiciones',
        'Curvas y pendientes pueden ser abordadas por la grua movil',
        'Lineas electricas que cruzan el camino permiten el paso de la grua movil'
      ]),
      group('areaTrabajo', 'Area de trabajo', 'sinona', [
        'Iluminacion adecuada', 'Riesgos controlados de caida de rocas, ductos, atmosfera explosiva u otros',
        'No existen lineas electricas energizadas o cables que dificulten el izaje',
        'Terreno compactado, nivelado y libre de obstaculos', 'Espacio suficiente para segregar el area',
        'Se requiere coordinar corte de camino o restringir transito vehicular',
        'Existen otros trabajos que pudieran interferir', 'El trabajo califica como izaje critico'
      ]),
      group('estrobado', 'Condiciones de seguridad para estrobado', 'sinona', [
        'Existe interferencia de material para realizar el izaje', 'Forma y posicion permiten correcto estrobado',
        'Superficie de trabajo adecuada para estrobado', 'Si se trabaja sobre 1,3 m cuenta con punto de anclaje o linea de vida',
        'Se requiere apoyo de equipo de levante para estrobar'
      ])
    ],
    footerFields: auditFields()
  },
  transmacEquiposTransporteSpa: {
    title: 'CL-SGI-OP-SPA-001 INSPECCION POR SERVICIO DE CAMION / SEMIREMOLQUE',
    headerFields: [
      field('nombreConductor', 'Nombre conductor'), field('fecha', 'Fecha', 'date'), field('hora', 'Hora'),
      field('patenteCamion', 'Patente camion'), field('marca', 'Marca'), field('revisionTecnicaCamion', 'Rev. tecnica camion'),
      field('odometro', 'Odometro'), field('patenteSemi', 'Patente semi'), field('tipoSemi', 'Tipo semi'),
      field('revisionTecnicaSemi', 'Rev. tecnica semi'), field('sucursal', 'Sucursal')
    ],
    groups: [
      group('combustible', 'Combustible', 'fuel', ['Nivel de combustible']),
      group('camion', 'Inspeccion general del camion', 'bmnasi', [
        'Llave de contacto', 'Neumaticos direccionales', 'Barras de direccion', 'Neumaticos traccionales',
        'Estado paquetes de resortes', 'Proteccion de cardan', 'Tuercas de neumaticos',
        'Carroceria en general', 'Corta corriente', 'Estado baterias', 'Conexiones electricas',
        'Tapa de combustible', 'Fugas aceites en general', 'Engrase general del camion',
        'Aceite sistema hidraulico', 'Aceite diferencial', 'Nivel aceite de motor',
        'Nivel y estado agua del radiador', 'Tapa del radiador', 'Correas', 'Pasamanos',
        'Escalas acceso', 'Manillas de sujecion', 'Puertas', 'Asientos', 'Cinturones de seguridad',
        'Cabina en general', 'Parabrisas y vidrios en general', 'Alza vidrios',
        'Plumillas limpia parabrisas', 'Parada de emergencias', 'Alarma partida', 'Motor de partida',
        'Nivel de combustible', 'Operacion de manometros/relojes', 'Operacion de interruptores',
        'Luces en general', 'Espejos en general', 'Bocinas', 'Sistema de direccion',
        'Freno de estacionamiento', 'Freno de servicio', 'Caja de cambios', 'Alarma retroceso',
        'Aire acondicionado', 'Calefaccion de cabina', 'Estado general quinta rueda'
      ]),
      group('semiremolque', 'Inspeccion semiremolque', 'bmnasi', [
        'Estado general de la plataforma', 'Tablones', 'Pin de conexion', 'Neumaticos',
        'Linea de aire', 'Conexiones electricas', 'Luces en general', 'Neumaticos de repuesto',
        'Sistema de suspension', 'Barandas y pilares', 'Parachoques', 'Sistema de frenos',
        'Patas de apoyo', 'Pinas para contenedores'
      ]),
      group('accesoriosDocumentos', 'Accesorios y documentos', 'bmnasi', [
        'Extintor', 'Foco faenero', 'Kit antiderrame', 'Marca de identificacion o N interno',
        'Baliza', 'Pertiga', 'Conos de seguridad', 'Gata', 'Llave de ruedas', 'Triangulos',
        'Cunas', 'Caja de herramientas', 'Neumatico de repuesto', 'Botiquin', 'Paleta de seguridad',
        'Cadenas para nieve', 'Arnes de seguridad', 'Placas patentes', 'Radio de comunicaciones',
        'Elementos de amarre/estiba', 'Manual del operador en espanol', 'Revision tecnica',
        'Seguro obligatorio', 'Permiso de circulacion', 'Certificado de gases', 'Certificado de frenado',
        'Padron del vehiculo'
      ])
    ],
    footerFields: auditFields()
  },
  gruaHorquillaAmsa: {
    title: 'CHECK LIST GRUA HORQUILLA',
    headerFields: commonEquipmentFields(),
    itemDetailFields: true,
    generalObservationLabel: 'Observaciones',
    groups: [
      group('partesComponentes', 'Partes y componentes a inspeccionar', 'bm', [
        'Estructura general', 'Neumaticos traseros y delanteros', 'Sistema de frenos', 'Freno de mano',
        'Trasmision', 'Direccion', 'Bocina', 'Mastil', 'Cilindros de mastil', 'Horquilla (unas)',
        'Canerias', 'Flexibles', 'Asiento', 'Volante de direccion', 'Motor', 'Reloj marcador de aceite',
        'Reloj marcador de temperatura', 'Reloj marcador de combustible', 'Estanque de combustible',
        'Estanque hidraulico', 'Horometro', 'Reflectantes', 'Comandos', 'Baliza', 'Cinturon de seguridad',
        'Mangueras', 'Chasis', 'Chapa de contacto', 'Pluma', 'Cilindro de extension', 'Cilindro de levante',
        'Cilindro de volteo', 'Alarma de retroceso', 'Limitadores', 'Espejos', 'Extintor', 'Botiquin', 'Otros'
      ])
    ],
    footerFields: auditFields()
  },
  gruaHorquillaPostUsoAmsa: {
    title: 'CHECK LIST POST USO GRUA HORQUILLA',
    headerFields: commonEquipmentFields(),
    groups: [
      group('neumaticos', 'Neumaticos', 'bmnasi', [
        'Presion de neumaticos', 'Condiciones por desgaste', 'Estado de tuercas y senalizadores de torque',
        'Instalacion de 2 cunas (equipo estacionado)'
      ]),
      group('luces', 'Luces', 'bmnasi', ['Focos delanteros', 'Focos traseros', 'Baliza', 'Luces apagadas']),
      group('carroceria', 'Carroceria', 'bmnasi', [
        'Sin danos', 'Sin oxido', 'Sin desgaste anormal', 'Estado de los reflectantes', 'Estado de espejos',
        'Horquillas a piso', 'Segregacion de equipo estacionado'
      ]),
      group('combustible', 'Nivel de combustible', 'fuel', ['Nivel de combustible'])
    ],
    footerFields: auditFields()
  },
  gruaMovilAmsa: {
    title: 'CHEQUEO DE GRUAS MOVILES',
    headerFields: [
      field('realizadoPor', 'Chequeo realizado por'), field('supervisor', 'Nombre del supervisor'),
      field('grua', 'Grua'), field('horometro', 'Horometro'), field('fecha', 'Fecha', 'date')
    ],
    groups: [
      group('estructura', 'Estructura', 'bm', ['Vigas', 'Platos de apoyo', 'Chasis', 'Jib', 'Cabina', 'Vidrios', 'Espejos', 'Neumaticos', 'Bocina', 'Escaleras de acceso', 'Pisaderas', 'Polea']),
      group('sistemaHidraulico', 'Sistema hidraulico', 'bm', ['Cilindro direccion', 'Cilindro nivelacion', 'Cilindro extension pluma', 'Cilindro levante pluma', 'Winches', 'Transmision', 'Flexibles', 'Frenos de pedal (giro)', 'Freno parqueo', 'Freno motor', 'Freno aire/hidraulico', 'Pasador bloqueo de giro pivote']),
      group('sistemaElectrico', 'Sistema electrico', 'bm', ['Luces de trabajo', 'Luces de traslado', 'Intermitentes', 'Reversa', 'Trocha', 'Baliza', 'Instrumentos', 'Computador (LMI)', 'Cables senal', 'Limitadores', 'Switch winches', 'Switch nivelacion', 'Switch doble traccion', 'Correas (estado y tension)']),
      group('operacionSeguridad', 'Sistema de operacion y seguridad', 'bm', ['Joystick / bastones', 'Tabla de carga', 'Extintor', 'Conos', 'Botiquin', 'Cables', 'Gancho principal', 'Gancho auxiliar', 'Seguros del pasador', 'Niveles', 'Aseo en general', 'Almohadillas', 'Alarma de giro', 'Alarma de retroceso']),
      group('condicionOperar', 'Equipo en condiciones para operar', 'sino', ['Equipo en condiciones para operar']),
      group('cabina', 'Verificacion estado y posicion de la cabina', 'sino', ['Cabina superestructura alineada dando continuidad a escalera de acceso', 'Dispone plataforma adicional de apoyo a la escalera de acceso', 'Escalera firme y en buenas condiciones para el acceso', 'Operador conoce y aplica los 3 puntos de apoyo', 'Ropa y EPP del operador ajustados y no dificultan el ascenso']),
      group('traslado', 'Llenar solo para traslado de grua', 'sino', ['Platos de apoyo guardados y asegurados', 'Freno de giro mecanico de tornamesa puesto', 'Ganchos asegurados a estructura del equipo', 'Verifico tension del amarre de ganchos visualmente y en computador']),
      group('jib', 'Llenar solo para utilizacion de JIB', 'sino', ['Soportes del JIB en buen estado', 'Todos los pasadores del JIB instalados', 'Seguros de pasadores en buenas condiciones y donde corresponde']),
      group('documentos', 'Revision de documentos', 'date', ['Permiso de circulacion', 'Revision tecnica', 'Certificacion equipo', 'Seguro obligatorio', 'Extintor 1', 'Extintor 2'])
    ]
  },
  cancamosAmsa: {
    ...multiElement('REGISTRO DE INSPECCION CANCAMOS', [
      'Presenta desgaste, fisuras, corrosion, grietas o muescas',
      'Certificacion esta vigente y en su sitio',
      'Componente doblado, retorcido, distorsionado o elongado',
      'Presenta salpicaduras con soldadura, dano termico o evidencia de soldadura',
      'Estado de los hilos es bueno',
      'Nombre del fabricante es legible en el cancamo',
      'Puede ser usado para trabajos de izaje',
      'Esta rotulado con la coloracion del mes'
    ], ['diametro', 'cargaLimiteTrabajo', 'factorSeguridad']),
    footerFields: [],
    referenceImages: [
      { src: 'checklist-assets/cancamos-spot/cancamo.jpg', alt: 'Cancamo' }
    ],
    referenceImagesPosition: 'end',
    deviationsTable: true
  },
  eslingaCadenasAmsa: {
    ...simpleIzaje('REGISTRO DE INSPECCION ESLINGA DE CADENAS', [
      'Etiqueta faltante o ilegible', 'Desgaste, abrasion, muescas, hendiduras, fisuras o roturas',
      'Eslabones rotan libremente con el eslabon siguiente o componentes', 'Largo de cadena o eslinga sobrepasa el 5%',
      'Ramales tienen longitudes desiguales', 'Eslabones o componentes doblados, torcidos o deformados',
      'Presencia de corrosion u hoyos', 'Salpicaduras de soldadura o dano termico', 'Reparacion por soldadura',
      'Eslabon maestro en buen estado', 'Eslabon de acoplamiento en buen estado',
      'Accesorios son adecuados a la eslinga', 'Abertura de garganta del gancho excede 15%',
      'Ojal del gancho torcido mas de 10 grados', 'Ojal del gancho doblado mas de 10 grados',
      'Gancho torcido mas de 10 grados', 'Punta del gancho doblada mas de 10 grados',
      'Seguros de ganchos muestran distorsion u otro dano', 'Eslabones con rebabas o grietas en soldadura',
      'Cuenta con certificacion', 'Inspeccion mensual color del mes'
    ], ['largo', 'grado', 'diametro', 'factorSeguridad', 'numeroRamales']),
    footerFields: [],
    referenceImages: [
      { src: 'checklist-assets/eslinga-cadenas/clases-eslingas.jpeg', alt: 'Clases de eslingas' },
      { src: 'checklist-assets/eslinga-cadenas/ramales-eslinga.jpeg', alt: 'Ramales de eslinga de cadena' },
      { src: 'checklist-assets/eslinga-cadenas/criterio-descarte.jpeg', alt: 'Criterio de descarte' }
    ],
    referenceImagesPosition: 'end',
    deviationsTable: true
  },
  eslingasPoliesterAmsa: {
    ...multiElement('REGISTRO DE INSPECCION ESLINGAS DE POLIESTER PLANA', [
      'Etiqueta faltante o ilegible', 'Certificacion esta vigente y en su sitio',
      'Danos por temperatura, quemadura, acido o soda caustica',
      'Cortes, rasgaduras, hilos rotos, danos en ojo, hoyos, deshilachada, nudos, picaduras, corrosion, desgaste o abrasion',
      'Evidencia de derrames de quimicos', 'Derretida o chamuscada',
      'Decolorada o quebradiza por dano solar o quimico',
      'Costuras rotas o gastadas en empalmes que sostienen carga',
      'Otro dano visible que cause duda de la fortaleza de la eslinga',
      'La eslinga puede ser usada en maniobras de izaje'
    ], ['cargaSeguraTrabajo', 'largo', 'ancho', 'numeroCapas', 'factorSeguridad'], ['Eslinga N1', 'Eslinga N2', 'Eslinga N3', 'Eslinga N4']),
    footerFields: [],
    referenceImages: [
      { src: 'checklist-assets/eslinga-poliester/criterio-descarte.jpeg', alt: 'Criterio de descarte eslinga de poliester' }
    ],
    referenceImagesPosition: 'end',
    deviationsTable: true
  },
  eslingasTubularesAmsa: {
    ...simpleIzaje('REGISTRO DE INSPECCION ESLINGAS TUBULARES', [
      'Existen cortes en la funda de la eslinga tubular u otro dano similar',
      'Existen abrasiones concretas causadas por bordes agudos o vivos',
      'Existe frotamiento interno intensificado de fibras superficiales bajo la funda',
      'Existen nudos en cualquier parte de la eslinga',
      'Existen agujeros, roturas, particulas incrustadas, deshilachada o cortes en la funda',
      'Existen cortes en cruz, longitudinales o danos por rozadura en bordes',
      'Existe presencia de quemaduras acidas o alcalinas',
      'Etiqueta de identificacion perdida o ilegible',
      'Ganchos o conectores demasiado grandes causan danos',
      'Calor o friccion marcada en la funda con tono esmaltado',
      'Dano por calor, derretimiento o chispa de soldadura',
      'Decolorada, quebradiza o zonas tiesas',
      'Inspeccion mensual color del mes'
    ], ['largo', 'factorSeguridad', 'cargaSeguraTrabajo']),
    footerFields: [],
    referenceImages: [
      { src: 'checklist-assets/eslingas-tubulares-spot/colores.jpeg', alt: 'Colores de eslingas tubulares' },
      { src: 'checklist-assets/eslingas-tubulares-spot/wll-5000-naranja-unica.jpeg', alt: 'Eslinga tubular WLL 5000 kg' },
      { src: 'checklist-assets/eslingas-tubulares-spot/danos-1-12-unica.jpeg', alt: 'Danos en eslingas tubulares' }
    ],
    referenceImagesPosition: 'end',
    deviationsTable: true
  },
  estrobosAceroAmsa: {
    ...multiElement('REGISTRO DE INSPECCION ESTROBOS DE ACERO', [
      'Cuenta con placa identificatoria y esta es legible', 'Alambres cortados o desgastados',
      'Estiramientos o alargamiento del cable', 'Existe corrosion notoria del cable o accesorios',
      'Falta de lubricacion', 'Hay presencia de cocas', 'Aflojamiento de torones jaula de pajaros',
      'Presenta abrasion, dobleces, torceduras, aplastamiento o deformaciones de torones',
      'Estrobos presentan la coloracion del mes',
      'El o los estrobos inspeccionados pueden ser usados para trabajos de izaje'
    ], ['largo', 'capacidadMaximaTrabajo', 'diametro']),
    footerFields: [],
    referenceImages: [
      { src: 'checklist-assets/estrobos-acero-spot/criterio-descarte-estrobos.jpeg', alt: 'Criterio de descarte estrobos de acero' },
      { src: 'checklist-assets/estrobos-acero-spot/partes-cable-acero.jpeg', alt: 'Partes de cable de acero' }
    ],
    referenceImagesPosition: 'end',
    deviationsTable: true
  },
  fajasAmarreAmsa: {
    title: 'LISTA DE CHEQUEO FAJAS DE AMARRE Y/O CINTAS',
    headerFields: [field('trabajadorInspecciona', 'Trabajador que inspecciona'), field('numeroRegistro', 'N de registro'), field('fecha', 'Fecha', 'date')],
    groups: [
      group('elementos', 'Elementos a inspeccionar', 'sinona', ['Existe deshilachamiento en la cinta', 'Existen hebras de hilos sueltos en costuras de cinta', 'La cinta cuenta con certificacion', 'Existe presencia de contaminantes derivados de hidrocarburos', 'Los ganchos o herraje presentan deformaciones', 'La cinta tiene tejido de hilo continuo', 'Existen reparaciones en la cinta']),
      group('tensorTrinquete', 'Tensor trinquete', 'sinona', ['Gancho o herraje presenta deformaciones', 'Gancho o herraje delta presenta deformaciones', 'Gancho o herraje presenta rebabas y/o bordes filosos', 'Rueda dentada presenta deformaciones o falta de dientes', 'Gatillo o seguro traba dientes cumple objetivo', 'Asadera en buenas condiciones', 'Destrabador de rueda dentada en buenas condiciones', 'Seguros y chavetas en buenas condiciones'])
    ],
    referenceImages: [
      { src: 'checklist-assets/fajas-amarre-spot/tensor-trinquete.jpg', title: 'Tensor trinquete', alt: 'Tensor trinquete' },
      { src: 'checklist-assets/fajas-amarre-spot/rueda-dentada-gatillo.gif', title: 'Rueda dentada y gatillo traba rueda', alt: 'Rueda dentada y gatillo traba rueda' },
      { src: 'checklist-assets/fajas-amarre-spot/manilla-asadera-trinquete.jpg', title: 'Manilla o asadera de trinquete de amarre', alt: 'Manilla o asadera de trinquete de amarre' },
      { src: 'checklist-assets/fajas-amarre-spot/criterio-descarte-fajas.jpg', title: 'Criterio de descarte', alt: 'Criterio de descarte fajas de amarre' }
    ],
    referenceImagesPosition: 'end',
    footerFields: [],
    showGeneralObservation: false,
    deviationsTable: true,
    deviationFields: ['accionCorrectiva', 'responsable', 'fechaEjecucion']
  },
  grilletesAmsa: {
    title: 'REGISTRO DE INSPECCION GRILLETES',
    headerFields: [
      field('realizadaPor', 'Realizada por'),
      field('fecha', 'Fecha', 'date'),
      field('firma', 'Firma'),
      field('factorSeguridad', 'Factor seguridad'),
      field('diametro', 'Diametro'),
      field('cargaLimiteTrabajo', 'Carga limite trabajo'),
      field('numeroInternoCodigo', 'Numero interno codigo')
    ],
    groups: [{
      id: 'condiciones',
      title: 'Condicion a inspeccionar',
      stateType: 'multi-sino',
      columns: ['Grillete N1', 'Grillete N2', 'Grillete N3', 'Grillete N4'],
      items: [
        'El pasador es el original',
        'El pasador esta doblado, gastado, torcido o descentrado',
        'El grillete presenta fisuras, desgaste, grietas, deformaciones o aberturas',
        'Corona o cuerpo del grillete estan danados',
        'Carga limite de trabajo es legible',
        'Hilos estan en mal estado',
        'Grillete o pasador ha sido soldado, calentado o modificado',
        'Pasador se puede atornillar completamente en el grillete',
        'Grillete inspeccionado se puede utilizar en maniobras de izaje'
      ].map((label, index) => ({ id: `item-${index + 1}`, label })).concat([
        {
          id: 'item-10',
          label: 'Carga lineal',
          options: [{ value: '0', label: '0°' }, { value: '45', label: '45°' }, { value: '90', label: '90°' }]
        },
        {
          id: 'item-11',
          label: 'Limite de carga ajustado',
          options: [{ value: '100', label: '100%' }, { value: '70', label: '70%' }, { value: '50', label: '50%' }]
        }
      ])
    }],
    referenceImages: [
      { src: 'checklist-assets/grilletes-spot/chequeo-grillete-fondo-blanco.png', alt: 'Chequeo de grillete' }
    ],
    referenceImagesPosition: 'end',
    footerFields: [],
    showGeneralObservation: false,
    deviationsTable: true
  },
  arnesSeguridadAmsa: {
    title: 'LISTA DE CHEQUEO ARNES DE SEGURIDAD',
    headerFields: [field('trabajadorInspecciona', 'Trabajador que inspecciona'), field('especialidad', 'Especialidad'), field('fecha', 'Fecha', 'date'), field('codigo', 'Codigo')],
    groups: [
      group('partesArnes', 'Partes del arnes a inspeccionar', 'bm', ['Anillo de espalda en D', 'Trama del material (cintas)', 'Hebillas de ajustes (2)', 'Dispositivo de sujecion de caderas (2)', 'Hebilla de la correa de los muslos (2)', 'Puntadas (costuras)', 'Etiquetas', 'Correa de torax']),
      group('condiciones', 'Condiciones', 'sino', ['Arnes presenta quemaduras en sus cintas', 'Arnes presenta restos de sustancias peligrosas', 'Arnes ha sido sometido a esfuerzo producto de una caida']),
      group('partesEstrobo', 'Partes del estrobo a inspeccionar', 'bm', ['Gancho, seguro principal, seguro secundario', 'Gancho tipo escala, seguro principal, seguro secundario', 'Guarda cabo de ojo', 'Remate manual', 'Tejido nylon sin restos de sustancias peligrosas', 'Etiqueta'])
    ],
    referenceImages: [
      { src: 'checklist-assets/arnes-seguridad-spot/partes-arnes.gif', alt: 'Partes del arnes de seguridad' },
      { src: 'checklist-assets/arnes-seguridad-spot/partes-estrobo.gif', alt: 'Partes del estrobo de seguridad' }
    ],
    referenceImagesPosition: 'end',
    showGeneralObservation: false,
    deviationsTable: true,
    deviationFields: ['accionCorrectiva', 'responsable', 'fechaEjecucion']
  },
  cajaInviernoAmsa: {
    title: 'LISTA DE CHEQUEO CAJA DE INVIERNO',
    headerFields: [field('obraContrato', 'Obra o contrato'), field('vehiculoEquipo', 'Vehiculo / equipo'), field('patente', 'Patente'), field('trabajador', 'Nombre del trabajador'), field('fecha', 'Fecha', 'date')],
    groups: [group('elementos', 'Elementos caja de invierno', 'dispestado', ['Caja con candado para elementos de operacion invierno', 'Pala especial para uso en nieve', 'Cadenas para nieve con rompehielos o similar', 'Saco tipo papero', 'Estrobo de acero con ganchos o grilletes', 'Desatornillador de cruz', 'Desatornillador de paleta', 'Alicate universal grande', 'Linterna con pilas', 'Frazada tela', 'Frazada termica'])]
  },
  escalasPortatilesAmsa: {
    title: 'LISTA DE CHEQUEO ESCALAS PORTATILES',
    headerFields: [field('inspeccionadoPor', 'Inspeccionado por'), field('cargo', 'Cargo'), field('identificacionPropia', 'Identificacion propia'), field('fecha', 'Fecha', 'date')],
    groups: [
      group('chequeoGeneral', 'Del chequeo general', 'sino', ['Cuenta con identificacion propia para registro, mantencion e inspeccion', 'Cuenta con sistema de aseguramiento para evitar deslizamiento', 'Cuenta con zapatas para evitar deslizamiento', 'Sobrepasa en 1 metro la superficie de acceso', 'Escala metalica se utiliza en trabajos electricos', 'Peldaños se encuentran en buenas condiciones', 'Largueros se encuentran en buenas condiciones', 'Se instala en razon 1 es a 4', 'Inspeccion mensual color del mes']),
      group('extensibles', 'De las escalas extensibles', 'sino', ['Seguros de traba en buenas condiciones', 'Roldana en buenas condiciones', 'Cuerda para anclaje en buenas condiciones', 'Canales guias en buenas condiciones', 'Escalas utilizadas en domo amarradas a estructura'])
    ],
    deviationsTable: true,
    deviationFields: ['accionCorrectiva', 'responsable', 'fechaEjecucion']
  },
  inspeccionEppAmsa: {
    title: 'INSPECCION DE ELEMENTOS DE PROTECCION PERSONAL',
    headerFields: [field('areaTrabajo', 'Area de trabajo'), field('realizadoPor', 'Realizado por'), field('cargo', 'Cargo'), field('fecha', 'Fecha', 'date'), field('firma', 'Firma'), field('contrato', 'Contrato')],
    groups: [group('epp', 'Equipo proteccion personal', 'eppu-personas', ['Casco', 'Zapatos', 'Protector auditivo', 'Overol', 'Guantes de seguridad', 'Barbiquejo', 'Chaqueta geologo', 'Gorro legionario', 'Bloqueador solar', 'Buzo termico', 'Protector respiratorio', 'Protector facial', 'Pijama termico', 'Traje completo soldador', 'Lentes de seguridad', 'Otro'])],
    showGeneralObservation: false
  },
  extintoresAmsa: {
    title: 'INSPECCION EXTINTORES',
    headerFields: [field('realizadoPor', 'Realizado por'), field('nombre', 'Nombre'), field('cargo', 'Cargo'), field('fecha', 'Fecha', 'date')],
    groups: [{
      ...group('revisionExtintores', 'Revision extintores', 'ubicacion-items', ['Revision mensual', 'Botella en buen estado', 'Etiquetas en buen estado', 'Manguera en buen estado', 'Boquilla en buen estado', 'Peso corresponde', 'Manometro area verde', 'Seguro buen estado', 'Ubicado sobre soporte', 'Extintor limpio', 'Ubicado area despejada', 'Senalizado', 'Trabajos llama abierta: hay extintor en el punto']),
      repeatStateType: 'sinona'
    }],
    showGeneralObservation: false
  },
  controlLicenciasAmsa: {
    title: 'REGISTRO CONTROL DE LICENCIAS DE CONDUCIR',
    headerFields: [field('contrato', 'Contrato')],
    groups: [{
      id: 'licencias',
      title: 'Control de licencias',
      stateType: 'repeat-fields',
      items: [],
      titleField: 'nombreApellidos',
      fields: [
        field('fecha', 'Fecha', 'date'),
        field('nombreApellidos', 'Nombre y apellidos'),
        field('rut', 'RUT'),
        field('vigenciaLicenciaMunicipal', 'Vigencia Licencia Municipal', 'date'),
        field('vigenciaAic', 'Vigencia AIC', 'date'),
        field('qrEquipoOpera', 'QR de acuerdo al equipo que opera?', 'sino'),
        field('portaLicencias', 'Porta Licencias?', 'sino'),
        field('firmaConductor', 'Firma Conductor', 'sino')
      ]
    }],
    showGeneralObservation: false
  },
  cancamosPdfAmsa: {
    title: 'CHECK LIST CANCAMOS',
    headerFields: [],
    groups: [group('aspectosAnalizados', 'Aspectos analizados', 'sino', [
      'Esta identificada de forma legible la carga',
      'Marcado de cancamo',
      '1.- Simbolo fabricante',
      '2.- Tamano nominal (diametro de rosca)',
      'Sin fisuras y/o deformaciones en cuerpo del cancamo',
      'En los cancamos roscados el estado de la rosca y del pasador',
      '1.- Ojal no deformado',
      '2.- Espiga no doblada',
      '3.- Espiga sin fisuras',
      '4.- Espiga sin corrosion',
      'En cancamos soldados, estado correcto de la soldadura',
      'Ausencia de corrosion, oxidacion en el cuerpo del cancamo',
      'Verificacion de la rotacion y ausencia de suciedad en mecanismos giratorios',
      'Se ha efectuado alguna reparacion en el cancamo desde la ultima revision.',
      'Se han efectuado ensayos no destructivos de acuerdo con las recomendaciones del fabricante.'
    ])],
    referenceImages: [
      { src: 'checklist-assets/cancamos-pdf/cancamo-roscado.png', alt: 'Cancamo roscado' },
      { src: 'checklist-assets/cancamos-pdf/cancamo-giratorio.png', alt: 'Cancamo giratorio' }
    ],
    referenceImagesPosition: 'end',
    considerationNote: 'Debe seleccionarse el cancamo mas adecuado en funcion del angulo de trabajo. Un cancamo con forma hexagonal u octogonal es el que tiene menores limitaciones segun el angulo de elevacion',
    showGeneralObservation: false
  },
  escalaTipoAvionAmsa: {
    title: 'CHECK LIST DE PRE USO ESCALA TIPO AVION',
    headerFields: [field('contrato', 'Contrato'), field('numeroInterno', 'N interno'), field('fecha', 'Fecha', 'date'), field('inspecciona', 'Nombre de quien inspecciona'), field('cargo', 'Cargo')],
    groups: [
      group('preUso', 'Pre uso escala tipo avion', 'semanal', ['Pasamanos en buen estado', 'Peldanos antideslizantes, no torcidos y en buen estado', 'Union de peldanos y pasamanos', 'Zapatas antideslizantes', 'Piezas de ajuste', 'Aseo de escala libre de sustancias', 'Ruedas de traslado', 'Frenos de ruedas de traslado', 'Barandas en buen estado', 'Segregacion del area de almacenamiento', 'Area de trabajo uniforme, nivelada y libre de obstaculos']),
      group('conclusion', 'Conclusion', 'sino', ['Escala apta para ser usada'])
    ],
    referenceImages: [
      { src: 'checklist-assets/escala-tipo-avion/partes-escala.png', alt: 'Partes escala tipo avion' }
    ],
    referenceImagesPosition: 'end'
  },
  spotEslingaCadenasCodelco: {
    ...simpleIzaje('FOR-OP-DN-002 CHECK LIST ESLINGA DE CADENAS', [
      'Etiqueta faltante o ilegible', 'Desgaste, abrasion, muescas, hendiduras, fisuras o roturas',
      'Eslabones rotan libremente con el eslabon siguiente o componentes', 'Largo de cadena o eslinga sobrepasa el 5%',
      'Ramales tienen longitudes desiguales', 'Eslabones o componentes doblados, torcidos o deformados',
      'Presencia de corrosion u hoyos', 'Salpicaduras de soldadura o dano termico', 'Reparacion por soldadura',
      'Eslabon maestro en buen estado', 'Eslabon de acoplamiento en buen estado',
      'Accesorios son adecuados a la eslinga', 'Abertura de garganta del gancho excede 15%',
      'Ojal del gancho torcido mas de 10 grados', 'Ojal del gancho doblado mas de 10 grados',
      'Gancho torcido mas de 10 grados', 'Punta del gancho doblada mas de 10 grados',
      'Seguros de ganchos muestran distorsion u otro dano', 'Eslabones con rebabas o grietas en soldadura',
      'Cuenta con certificacion', 'Inspeccion mensual color del mes'
    ], ['largo', 'grado', 'diametro', 'factorSeguridad', 'numeroRamales']),
    referenceImages: [
      { src: 'checklist-assets/eslinga-cadenas/clases-eslingas.jpeg', alt: 'Clases de eslingas' },
      { src: 'checklist-assets/eslinga-cadenas/ramales-eslinga.jpeg', alt: 'Ramales de eslinga de cadena' },
      { src: 'checklist-assets/eslinga-cadenas/criterio-descarte.jpeg', alt: 'Criterio de descarte' }
    ],
    footerFields: [],
    showGeneralObservation: false,
    deviationsTable: true
  },
  spotEslingasPoliesterCodelco: {
    ...multiElement('FOR-OP-DN-003 ESLINGAS DE POLIESTER PLANA', [
      'Etiqueta faltante o ilegible', 'Certificacion esta vigente y en su sitio',
      'Danos por temperatura, quemadura, acido o soda caustica',
      'Cortes, rasgaduras, hilos rotos, danos en ojo, hoyos, deshilachada, nudos, picaduras, corrosion, desgaste o abrasion',
      'Evidencia de derrames de quimicos', 'Derretida o chamuscada',
      'Decolorada o quebradiza por dano solar o quimico',
      'Costuras rotas o gastadas en empalmes que sostienen carga',
      'Otro dano visible que cause duda de la fortaleza de la eslinga',
      'La eslinga puede ser usada en maniobras de izaje'
    ], ['cargaSeguraTrabajo', 'largo', 'ancho', 'numeroCapas', 'factorSeguridad'], ['Eslinga N1', 'Eslinga N2', 'Eslinga N3', 'Eslinga N4']),
    referenceImages: [
      { src: 'checklist-assets/eslinga-poliester/criterio-descarte.jpeg', alt: 'Criterio de descarte eslinga de poliester' }
    ],
    referenceImagesPosition: 'end',
    footerFields: [],
    showGeneralObservation: false,
    deviationsTable: true
  },
  spotEslingasTubularesCodelco: {
    ...simpleIzaje('FOR-OP-DN-004 ESLINGAS TUBULARES', [
      'Existen cortes en la funda de la eslinga tubular u otro dano similar',
      'Existen abrasiones concretas causadas por bordes agudos o vivos',
      'Existe frotamiento interno intensificado de fibras superficiales bajo la funda',
      'Existen nudos en cualquier parte de la eslinga',
      'Existen agujeros, roturas, particulas incrustadas, deshilachada o cortes en la funda',
      'Existen cortes en cruz, longitudinales o danos por rozadura en bordes',
      'Existe presencia de quemaduras acidas o alcalinas',
      'Etiqueta de identificacion perdida o ilegible',
      'Ganchos o conectores demasiado grandes causan danos',
      'Calor o friccion marcada en la funda con tono esmaltado',
      'Dano por calor, derretimiento o chispa de soldadura',
      'Decolorada, quebradiza o zonas tiesas',
      'Inspeccion mensual color del mes'
    ], ['largo', 'factorSeguridad', 'cargaSeguraTrabajo']),
    referenceImages: [
      { src: 'checklist-assets/eslingas-tubulares-spot/colores.jpeg', alt: 'Colores de eslingas tubulares' },
      { src: 'checklist-assets/eslingas-tubulares-spot/wll-5000-naranja-unica.jpeg', alt: 'Eslinga tubular WLL 5000 kg' },
      { src: 'checklist-assets/eslingas-tubulares-spot/danos-1-12-unica.jpeg', alt: 'Danos en eslingas tubulares' }
    ],
    referenceImagesPosition: 'end',
    footerFields: [],
    showGeneralObservation: false,
    deviationsTable: true
  },
  spotEstrobosAceroCodelco: {
    ...multiElement('FOR-OP-DN-005 ESTROBOS DE ACERO', [
      'Cuenta con placa identificatoria y esta es legible', 'Alambres cortados o desgastados',
      'Estiramientos o alargamiento del cable', 'Existe corrosion notoria del cable o accesorios',
      'Falta de lubricacion', 'Hay presencia de cocas', 'Aflojamiento de torones jaula de pajaros',
      'Presenta abrasion, dobleces, torceduras, aplastamiento o deformaciones de torones',
      'Estrobos presentan la coloracion del mes',
      'El o los estrobos inspeccionados pueden ser usados para trabajos de izaje'
    ], ['largo', 'capacidadMaximaTrabajo', 'diametro']),
    referenceImages: [
      { src: 'checklist-assets/estrobos-acero-spot/criterio-descarte-estrobos.jpeg', alt: 'Criterio de descarte estrobos de acero' },
      { src: 'checklist-assets/estrobos-acero-spot/partes-cable-acero.jpeg', alt: 'Partes de cable de acero' }
    ],
    referenceImagesPosition: 'end',
    footerFields: [],
    showGeneralObservation: false,
    deviationsTable: true
  },
  spotGrilletesCodelco: {
    title: 'FOR-OP-DN-006 GRILLETES',
    headerFields: [
      field('realizadaPor', 'Realizada por'),
      field('fecha', 'Fecha', 'date'),
      field('firma', 'Firma'),
      field('factorSeguridad', 'Factor seguridad'),
      field('diametro', 'Diametro'),
      field('cargaLimiteTrabajo', 'Carga limite trabajo'),
      field('numeroInternoCodigo', 'Numero interno codigo')
    ],
    groups: [{
      id: 'condiciones',
      title: 'Condicion a inspeccionar',
      stateType: 'multi-sino',
      columns: ['Grillete N1', 'Grillete N2', 'Grillete N3', 'Grillete N4'],
      items: [
        'El pasador es el original',
        'El pasador esta doblado, gastado, torcido o descentrado',
        'El grillete presenta fisuras, desgaste, grietas, deformaciones o aberturas',
        'Corona o cuerpo del grillete estan danados',
        'Carga limite de trabajo es legible',
        'Hilos estan en mal estado',
        'Grillete o pasador ha sido soldado, calentado o modificado',
        'Pasador se puede atornillar completamente en el grillete',
        'Grillete inspeccionado se puede utilizar en maniobras de izaje'
      ].map((label, index) => ({ id: `item-${index + 1}`, label })).concat([
        {
          id: 'item-10',
          label: 'Angulo de carga lateral de linea vertical del grillete',
          options: [{ value: '0', label: '0°' }, { value: '45', label: '45°' }, { value: '90', label: '90°' }]
        },
        {
          id: 'item-11',
          label: 'Limite de carga ajustado',
          options: [{ value: '100', label: '100%' }, { value: '70', label: '70%' }, { value: '50', label: '50%' }]
        }
      ])
    }],
    referenceImages: [
      { src: 'checklist-assets/grilletes-spot/chequeo-grillete-fondo-blanco.png', alt: 'Chequeo de grillete' }
    ],
    referenceImagesPosition: 'end',
    footerFields: [],
    showGeneralObservation: false,
    deviationsTable: true
  },
  spotFajasAmarreCodelco: {
    title: 'FOR-OP-DN-008 LISTA DE CHEQUEO FAJAS DE AMARRE',
    headerFields: [field('trabajadorInspecciona', 'Trabajador que inspecciona'), field('numeroRegistro', 'N de registro'), field('fecha', 'Fecha', 'date')],
    groups: [
      group('elementos', 'Elementos a inspeccionar', 'sinona', ['Existe deshilachamiento en la cinta', 'Existen hebras de hilos sueltos en costuras de cinta', 'La cinta cuenta con certificacion', 'Existe presencia de contaminantes derivados de hidrocarburos', 'Los ganchos o herraje presentan deformaciones', 'La cinta tiene tejido de hilo continuo', 'Existen reparaciones en la cinta']),
      group('tensorTrinquete', 'Tensor trinquete', 'sinona', ['Gancho o herraje presenta deformaciones', 'Gancho o herraje delta presenta deformaciones', 'Gancho o herraje presenta rebabas y/o bordes filosos', 'Rueda dentada presenta deformaciones o falta de dientes', 'Gatillo o seguro traba dientes cumple objetivo', 'Asadera en buenas condiciones', 'Destrabador de rueda dentada en buenas condiciones', 'Seguros y chavetas en buenas condiciones'])
    ],
    referenceImages: [
      { src: 'checklist-assets/fajas-amarre-spot/tensor-trinquete.jpg', title: 'Tensor trinquete', alt: 'Tensor trinquete' },
      { src: 'checklist-assets/fajas-amarre-spot/rueda-dentada-gatillo.gif', title: 'Rueda dentada y gatillo traba rueda', alt: 'Rueda dentada y gatillo traba rueda' },
      { src: 'checklist-assets/fajas-amarre-spot/manilla-asadera-trinquete.jpg', title: 'Manilla o asadera de trinquete de amarre', alt: 'Manilla o asadera de trinquete de amarre' },
      { src: 'checklist-assets/fajas-amarre-spot/criterio-descarte-fajas.jpg', title: 'Criterio de descarte', alt: 'Criterio de descarte fajas de amarre' }
    ],
    referenceImagesPosition: 'end',
    showGeneralObservation: false,
    deviationsTable: true
  },
  spotArnesSeguridadCodelco: {
    title: 'FOR-OP-DN-009 LISTA DE CHEQUEO ARNES DE SEGURIDAD',
    headerFields: [field('trabajadorInspecciona', 'Trabajador que inspecciona'), field('especialidad', 'Especialidad'), field('fecha', 'Fecha', 'date'), field('codigo', 'Codigo')],
    groups: [
      group('partesArnes', 'Partes del arnes a inspeccionar', 'bm', ['Anillo de espalda en D', 'Trama del material (cintas)', 'Hebillas de ajustes (2)', 'Dispositivo de sujecion de caderas (2)', 'Hebilla de la correa de los muslos (2)', 'Puntadas (costuras)', 'Etiquetas', 'Correa de torax']),
      group('condiciones', 'Condiciones', 'sino', ['Arnes presenta quemaduras en sus cintas', 'Arnes presenta restos de sustancias peligrosas', 'Arnes ha sido sometido a esfuerzo producto de una caida']),
      group('partesEstrobo', 'Partes del estrobo a inspeccionar', 'bm', ['Gancho, seguro principal, seguro secundario', 'Gancho tipo escala, seguro principal, seguro secundario', 'Guarda cabo de ojo', 'Remate manual', 'Tejido nylon sin restos de sustancias peligrosas', 'Etiqueta'])
    ],
    referenceImages: [
      { src: 'checklist-assets/arnes-seguridad-spot/partes-arnes.gif', alt: 'Partes del arnes de seguridad' },
      { src: 'checklist-assets/arnes-seguridad-spot/partes-estrobo.gif', alt: 'Partes del estrobo de seguridad' }
    ],
    referenceImagesPosition: 'end',
    deviationsTable: true,
    deviationFields: ['accionCorrectiva', 'responsable', 'fechaEjecucion']
  },
  spotEscalasPortatilesCodelco: {
    title: 'FOR-OP-DN-010 LISTA DE CHEQUEO ESCALAS PORTATILES',
    headerFields: [field('inspeccionadoPor', 'Inspeccionado por'), field('cargo', 'Cargo'), field('identificacionPropia', 'Identificacion propia'), field('fecha', 'Fecha', 'date')],
    groups: [
      group('chequeoGeneral', 'Del chequeo general', 'sino', ['Cuenta con identificacion propia para registro, mantencion e inspeccion', 'Cuenta con sistema de aseguramiento para evitar deslizamiento', 'Cuenta con zapatas para evitar deslizamiento', 'Sobrepasa en 1 metro la superficie de acceso', 'Escala metalica se utiliza en trabajos electricos', 'Peldanos se encuentran en buenas condiciones', 'Largueros se encuentran en buenas condiciones', 'Se instala en razon 1 es a 4', 'Inspeccion mensual color del mes']),
      group('extensibles', 'De las escalas extensibles', 'sino', ['Seguros de traba en buenas condiciones', 'Roldana en buenas condiciones', 'Cuerda para anclaje en buenas condiciones', 'Canales guias en buenas condiciones', 'Escalas utilizadas en domo amarradas a estructura'])
    ],
    deviationsTable: true,
    deviationFields: ['accionCorrectiva', 'responsable', 'fechaEjecucion']
  },
  spotCancamosCodelco: {
    ...multiElement('FOR-OP-DN-011 CHEQUEO CANCAMOS', [
      'Presenta desgaste, fisuras, corrosion, grietas o muescas',
      'Certificacion esta vigente y en su sitio',
      'Componente doblado, retorcido, distorsionado o elongado',
      'Presenta salpicaduras con soldadura, dano termico o evidencia de soldadura',
      'Estado de los hilos es bueno',
      'Nombre del fabricante es legible en el cancamo',
      'Puede ser usado para trabajos de izaje',
      'Esta rotulado con la coloracion del mes'
    ], ['diametro', 'cargaLimiteTrabajo', 'factorSeguridad']),
    referenceImages: [
      { src: 'checklist-assets/cancamos-spot/cancamo.jpg', alt: 'Cancamo' }
    ],
    referenceImagesPosition: 'end',
    footerFields: [],
    showGeneralObservation: false,
    deviationsTable: true
  },
  spotGruaCodelco: {
    title: 'FOR-OP-DN-014 CHECK LIST GRUA',
    headerFields: [
      field('realizadoPor', 'Chequeo realizado por'), field('supervisor', 'Nombre del supervisor'),
      field('grua', 'Grua'), field('horometro', 'Horometro'), field('fecha', 'Fecha', 'date')
    ],
    groups: [
      group('estructura', 'Estructura', 'bm', ['Vigas', 'Platos de apoyo', 'Chasis', 'Jib', 'Cabina', 'Vidrios', 'Espejos', 'Neumaticos', 'Bocina', 'Escaleras de acceso', 'Pisaderas', 'Polea']),
      group('sistemaHidraulico', 'Sistema hidraulico', 'bm', ['Cilindro direccion', 'Cilindro nivelacion', 'Cilindro extension pluma', 'Cilindro levante pluma', 'Winches', 'Transmision', 'Flexibles', 'Frenos de pedal', 'Freno parqueo', 'Freno motor', 'Pasador bloqueo de giro pivote']),
      group('sistemaElectrico', 'Sistema electrico', 'bm', ['Luces de trabajo', 'Luces de traslado', 'Intermitentes', 'Reversa', 'Baliza', 'Instrumentos', 'Computador LMI', 'Limitadores', 'Switch winches', 'Correas estado y tension']),
      group('operacionSeguridad', 'Sistema de operacion y seguridad', 'bm', ['Joystick o bastones', 'Tabla de carga', 'Extintor', 'Conos', 'Botiquin', 'Cables', 'Gancho principal', 'Gancho auxiliar', 'Seguros del pasador', 'Niveles', 'Aseo en general', 'Alarma de giro', 'Alarma de retroceso']),
      group('condicionOperar', 'Equipo en condiciones para operar', 'sino', ['Equipo en condiciones para operar']),
      group('traslado', 'Llenar solo para traslado de grua', 'sino', ['Los platos de apoyo estan guardados y asegurados', 'Esta puesto el freno de giro mecanico de la tornamesa', 'Los ganchos estan asegurados a la estructura del equipo', 'Verifico visualmente y en el computador del equipo la tension del amarre de los ganchos']),
      group('jib', 'Llenar solo para utilizacion de JIB', 'sino', ['Los soportes del JIB se encuentran en buen estado, sin corrosion, abolladura u oxido', 'Se encuentran todos los pasadores del JIB instalados', 'Se encuentran todos los seguros de los pasadores en buenas condiciones y donde corresponde']),
      group('documentos', 'Revision de documentos', 'date', ['Permiso de circulacion', 'Revision tecnica', 'Certificacion equipo', 'Seguro obligatorio', 'Extintor 1', 'Extintor 2'])
    ],
    generalObservationLabel: 'Observaciones del operador'
  },
  cdchGrua: {
    title: 'CL-SGI-CDCH-02-SST-009 CHECK LIST GRUA',
    headerFields: [
      field('realizadoPor', 'Chequeo realizado por'), field('supervisor', 'Nombre del supervisor'),
      field('grua', 'Grua'), field('horometro', 'Horometro'), field('fecha', 'Fecha', 'date')
    ],
    groups: [
      group('estructura', 'Estructura', 'bm', ['Vigas', 'Platos de apoyo', 'Chasis', 'Jib', 'Cabina', 'Vidrios', 'Espejos', 'Neumaticos', 'Bocina', 'Escaleras de acceso', 'Pisaderas', 'Polea']),
      group('sistemaHidraulico', 'Sistema hidraulico', 'bm', ['Cilindro direccion', 'Cilindro nivelacion', 'Cilindro extension pluma', 'Cilindro levante pluma', 'Winches', 'Transmision', 'Flexibles', 'Frenos de pedal', 'Freno parqueo', 'Freno motor', 'Pasador bloqueo de giro pivote']),
      group('sistemaElectrico', 'Sistema electrico', 'bm', ['Luces de trabajo', 'Luces de traslado', 'Intermitentes', 'Reversa', 'Baliza', 'Instrumentos', 'Computador LMI', 'Limitadores', 'Switch winches', 'Correas estado y tension']),
      group('operacionSeguridad', 'Sistema de operacion y seguridad', 'bm', ['Joystick o bastones', 'Tabla de carga', 'Extintor', 'Conos', 'Botiquin', 'Cables', 'Gancho principal', 'Gancho auxiliar', 'Seguros del pasador', 'Niveles', 'Aseo en general', 'Alarma de giro', 'Alarma de retroceso']),
      group('condicionOperar', 'Equipo en condiciones para operar', 'sino', ['Equipo en condiciones para operar']),
      group('traslado', 'Llenar solo para traslado de grua', 'sino', ['Los platos de apoyo estan guardados y asegurados', 'Esta puesto el freno de giro mecanico de la tornamesa', 'Los ganchos estan asegurados a la estructura del equipo', 'Verifico visualmente y en el computador del equipo la tension del amarre de los ganchos']),
      group('jib', 'Llenar solo para utilizacion de JIB', 'sino', ['Los soportes del JIB se encuentran en buen estado, sin corrosion, abolladura u oxido', 'Se encuentran todos los pasadores del JIB instalados', 'Se encuentran todos los seguros de los pasadores en buenas condiciones y donde corresponde']),
      group('documentos', 'Revision de documentos', 'date', ['Permiso de circulacion', 'Revision tecnica', 'Certificacion equipo', 'Seguro obligatorio', 'Extintor 1', 'Extintor 2'])
    ],
    generalObservationLabel: 'Observaciones del operador'
  },
  spotAccesoriosAmarreCodelco: {
    title: 'FOR-OP-DN-015 CHECK LIST ACCESORIOS DE AMARRE',
    headerFields: [field('area', 'Area'), field('equipo', 'Equipo'), field('fecha', 'Fecha', 'date'), field('inspector', 'Inspector')],
    groups: [
      withImage(matrixGroup('dobleGancho', 'Doble gancho', 'N°', ['Deformacion de ganchos', 'Corte, mella o soldadura', 'Bordes abrasivos en union a cinta', 'Fisuras visibles']), 'checklist-assets/accesorios-amarre-spot/doble-gancho.jpeg'),
      withImage(matrixGroup('cintaPoliester', 'Cinta de poliester', 'COD.', ['Desgaste o abrasion', 'Quemadura temperatura o quimica', 'Corte o roturas', 'Tejido gastado o partes descocidas']), 'checklist-assets/accesorios-amarre-spot/cinta-amarre.jpeg'),
      withImage(matrixGroup('trinqueteCinta', 'Trinquete', 'COD.', ['Mal funcion de seguro retractil', 'Pernos y pasadores danados', 'Asa de sujecion manual palanca danada', 'Rueda dentada y gatillo danados']), 'checklist-assets/accesorios-amarre-spot/tensor-trinquete-cinta.jpeg'),
      withImage(matrixGroup('cadenaAmarre', 'Cadena para amarre de carga', 'COD.', ['Eslabon dilatado o deformado', 'Eslabon cortado', 'Desgaste o abrasion', 'Eslabon con mella o estria']), 'checklist-assets/accesorios-amarre-spot/cadena-amarre.png'),
      withImage(matrixGroup('ganchoCadena', 'Gancho amarre para cadena', 'COD.', ['Apertura de garganta', 'Fisura, mella o corte', 'Deformacion lateral', 'Soldadura']), 'checklist-assets/accesorios-amarre-spot/gancho-cadena.png'),
      withImage(matrixGroup('trinqueteCadena', 'Trinquete cadena', 'COD.', ['Ganchos externos danados', 'Tornillo e hilo danados', 'Asa de sujecion manual palanca danada', 'Rueda dentada, seguro y gatillo danados']), 'checklist-assets/accesorios-amarre-spot/trinquete-cadena.png')
    ],
    generalObservationLabel: 'Observaciones'
  },
  spotAlzaHombreCodelco: {
    title: 'FOR-OP-DN-016 CHECK LIST MAN-LIFT - ALZAHOMBRE',
    headerFields: [
      field('cc', 'CC'),
      field('equipo', 'Equipo'),
      field('obra', 'Obra'),
      field('modelo', 'Modelo'),
      field('fecha', 'Fecha', 'date'),
      field('anioEquipo', 'Ano equipo'),
      field('numeroInterno', 'N interno'),
      field('horometro', 'Horometro'),
      field('patente', 'Patente')
    ],
    groups: [
      group('estado', 'Estado', 'bmnasi', [
        'Pluma',
        'JIB',
        'Tornamesa',
        'Controles',
        'Sistema de giro',
        'CAS',
        'Motores hidraulicos',
        'Motor diesel',
        'Filtracion de petroleo',
        'Filtracion de motor',
        'Canastillo y/o barandas',
        'Parada de emergencia',
        'Sistema de traslacion',
        'Extintor',
        'Alarma de movimiento',
        'Alarma de retroceso',
        'Estado electrico',
        'Luces',
        'Motor arranque',
        'Alternador',
        'Bateria',
        'Baliza',
        'Cilindros hidraulicos',
        'Sensores de seguridad',
        'Punto de anclaje',
        'Pertiga',
        'Tubo de escape'
      ]),
      group('inspeccionEquipo', 'Inspeccion de equipo', 'bmnasi', [
        'Caja de bloqueo',
        'Botiquin',
        'Bocina',
        'Cunas',
        'Ruedas'
      ])
    ],
    generalObservationLabel: 'Observaciones'
  },
  spotComunicacionRadialCodelco: {
    title: 'FOR-OP-DN-019 CHECK LIST DE COMUNICACION RADIAL',
    headerFields: [
      field('trabajadorInspecciona', 'Trabajador que inspecciona'),
      field('especialidad', 'Especialidad'),
      field('firmaTrabajador', 'Firma trabajador'),
      field('inspeccionDesde', 'Inspeccion desde', 'date'),
      field('inspeccionHasta', 'Inspeccion hasta', 'date')
    ],
    groups: [
      group('inspeccionSemanal', 'Inspeccion para 7 dias', 'semanal-sinona', [
        'Radio transmisor se encuentra con bateria cargada',
        'Se verifico que el canal de comunicacion este libre de interferencias e intervenciones',
        'La prueba de comunicacion entre emisor y receptor con radio transmisor es efectiva',
        'Se encuentran en buen estado botones y perillas de la radio',
        'La antena se encuentra en buen estado',
        'Radio transmisor se encuentra codificado segun codigo de color',
        'Radio transmisor cuenta con accesorio para poder portarla (pinza de sujecion)',
        'El emisor y receptor conoce el canal de radio para ejecutar las maniobras',
        'Otros'
      ])
    ],
    monthlyColorTable: [
      { key: 'amarillo', color: 'Amarillo', months: ['Enero', 'Febrero', 'Marzo'] },
      { key: 'rojo', color: 'Rojo', months: ['Abril', 'Mayo', 'Junio'] },
      { key: 'azul', color: 'Azul', months: ['Julio', 'Agosto', 'Septiembre'] },
      { key: 'verde', color: 'Verde', months: ['Octubre', 'Noviembre', 'Diciembre'] }
    ],
    showGeneralObservation: false
  },
  transmacSpaCadenasAmarre: {
    title: 'CL-10 CHECK LIST CADENAS DE AMARRE',
    headerFields: [field('area', 'Area'), field('fechaRevision', 'Fecha revision', 'date'), field('equipo', 'Equipo'), field('realizo', 'Realizo'), field('reviso', 'Reviso')],
    groups: [
      group('condiciones', 'Marca SI si esta en buen estado o NO si detecta el problema', 'sino', [
        'Sello cadena',
        'Placa / capacidad visible',
        'Eslabones deformados',
        'Ganchos / terminales',
        'Tensor / trinquete'
      ]),
      group('estado', 'Estado', 'sino', ['Apto para uso'])
    ],
    generalObservationLabel: 'Observaciones generales'
  },
  transmacSpaEslingasAmarre: {
    title: 'CL-11 CHECK LIST ESLINGAS DE AMARRE',
    headerFields: [field('area', 'Area'), field('fechaRevision', 'Fecha revision', 'date'), field('equipo', 'Equipo'), field('realizo', 'Realizo'), field('reviso', 'Reviso')],
    groups: [
      group('condiciones', 'Marca SI si esta en buen estado o NO si detecta el problema', 'sino', [
        'Sello eslinga',
        'Etiqueta de capacidad',
        'Cortes y desgastes',
        'Ganchos',
        'Ratchet'
      ]),
      group('estado', 'Estado', 'sino', ['Apto para uso'])
    ],
    generalObservationLabel: 'Observaciones generales'
  },
  transmacSpaEquiposTransporte: {
    title: 'CL-SGI-OP-SPA-001 INSPECCION POR SERVICIO DE CAMION / SEMIREMOLQUE',
    headerFields: [
      field('nombreConductor', 'Nombre conductor'),
      field('fecha', 'Fecha', 'date'),
      field('hora', 'Hora', 'time'),
      field('patenteCamion', 'Patente camion'),
      field('marca', 'Marca'),
      field('revisionTecnicaCamion', 'Rev. tecnica camion'),
      field('odometro', 'Odometro'),
      field('patenteSemi', 'Patente semi'),
      field('tipoSemi', 'Tipo semi'),
      field('revisionTecnicaSemi', 'Rev. tecnica semi'),
      field('sucursal', 'Sucursal')
    ],
    groups: [
      group('combustible', 'Combustible', 'fuel', ['Nivel de combustible']),
      group('camion', 'Inspeccion general del camion', 'bmnasi', [
        'Llave de contacto',
        'Neumaticos direccionales',
        'Barras de direccion',
        'Neumaticos traccionales',
        'Estado paquetes de resortes',
        'Proteccion de cardan',
        'Tuercas de neumaticos',
        'Carroceria en general',
        'Corta corriente',
        'Estado baterias',
        'Parachoques',
        'Tapa de combustible',
        'Fugas aceites en general',
        'Engrase general del camion',
        'Aceite sistema hidraulico',
        'Aceite diferencial',
        'Nivel aceite de motor',
        'Nivel y estado agua del radiador',
        'Tapa del radiador',
        'Correas',
        'Pasamanos',
        'Escalas acceso',
        'Manillas de sujecion',
        'Puertas',
        'Asientos',
        'Cinturones de seguridad',
        'Cabina en general',
        'Parabrisas y vidrios en general',
        'Alza vidrios',
        'Plumillas limpia parabrisas',
        'Parada de emergencias',
        'Alarma partida',
        'Motor de partida',
        'Operacion de manometros/relojes',
        'Operacion de interruptores',
        'Manual del operador en espanol',
        'Espejos en general',
        'Bocinas',
        'Sistema de direccion',
        'Freno de estacionamiento',
        'Freno de servicio',
        'Caja de cambios',
        'Alarma retroceso',
        'Aire acondicionado',
        'Calefaccion de cabina'
      ]),
      group('semiremolque', 'Inspeccion semiremolque', 'bmnasi', [
        'Estado general de la plataforma',
        'Tablones',
        'Pin de coneccion',
        'Neumaticos',
        'Linea de aire',
        'Conexiones electricas',
        'Luces en general',
        'Neumaticos de repuesto',
        'Sistema de suspension',
        'Barandas y pilares (si corresponde)',
        'Sistema de frenos',
        'Patas de apoyo',
        'Pinas para contenedores (si corresponde)',
        'Estado general quinta rueda'
      ]),
      group('accesorios', 'Accesorios', 'bmnasi', [
        'Extintor',
        'Foco faenero (si corresponde)',
        'Kit antiderrame (si corresponde)',
        'Marca de identificacion o N interno',
        'Baliza',
        'Pertiga',
        'Conos de seguridad',
        'Gata',
        'Llave de ruedas',
        'Triangulos',
        'Cunas',
        'Caja de herramientas',
        'Neumatico de repuesto',
        'Botiquin',
        'Paleta de seguridad',
        'Cadenas para nieve',
        'Arnes de seguridad',
        'Placas patentes',
        'Radio de comunicaciones (si corresponde)',
        'Elementos de amarre/estiba'
      ]),
      group('documentos', 'Documentos', 'bmnasi', [
        'Revision tecnica',
        'Seguro obligatorio',
        'Permiso de circulacion',
        'Certificado de gases (si corresponde)',
        'Certificado de frenado',
        'Padron del vehiculo'
      ])
    ],
    generalObservationLabel: 'Observaciones'
  }
}

function field(key, label, type = 'text') {
  return { key, label, type }
}

function group(id, title, stateType, labels) {
  return { id, title, stateType, items: labels.map((label, index) => ({ id: `item-${index + 1}`, label })) }
}

function simpleTransmacChecklist(title, items) {
  return {
    title,
    headerFields: [
      field('faena', 'Faena'), field('area', 'Area'), field('equipo', 'Equipo'),
      field('modelo', 'Modelo'), field('fechaRevision', 'Fecha revision', 'date')
    ],
    groups: [group('elementos', 'Partes y componentes a inspeccionar', 'bm', items)],
    groupDeviationsTable: true,
    footerFields: auditFields()
  }
}

function equipmentTransmacChecklist(title, items) {
  return {
    title,
    headerFields: [
      field('obra', 'Obra'), field('area', 'Area'), field('equipo', 'Equipo'), field('modelo', 'Modelo'),
      field('ubicacion', 'Ubicacion'), field('codigo', 'Codigo'), field('marca', 'Marca'),
      field('anio', 'Ano'), field('patente', 'Patente'), field('licenciaOperador', 'Licencia operador'),
      field('vencimientoLicencia', 'Fecha vencimiento licencia', 'date'),
      field('revisionTecnica', 'Vencimiento revision tecnica', 'date'),
      field('horometro', 'Horometro'), field('kilometraje', 'Kilometraje')
    ],
    groups: [group('elementos', 'Elementos a inspeccionar', 'bm', items)],
    groupDeviationsTable: true,
    footerFields: auditFields()
  }
}

function transmacExtintores(title, locations) {
  const criteria = [
    'Fecha proxima recarga vigente', 'Estado manometro', 'Nivel de carga adecuado',
    'Etiquetas legibles', 'Estado de cilindro', 'Estado pintura de cilindro',
    'Estado conjunto manguera y acople', 'Boquilla limpia sin obstruccion', 'Estado gatillo',
    'Soporte / anclaje en buen estado', 'Extintor limpio', 'Ubicado en area despejada',
    'Senaletica visible y en buen estado', 'Tiene pasador y sello de seguridad', 'Aprobado'
  ]

  return {
    title,
    headerFields: [field('revisadoPor', 'Revisado por'), field('fecha', 'Fecha', 'date')],
    groups: [
      {
        ...group('ubicaciones', 'Ubicaciones base del formato', 'bmnasi', locations),
        items: locations.map((label, index) => ({
          id: `extintor-${index + 1}`,
          label,
          options: [{ value: 'bueno', label: 'B' }, { value: 'malo', label: 'M' }, { value: 'na', label: 'N/A' }]
        }))
      },
      matrixGroup('detalleExtintores', 'Detalle por extintor adicional', 'Extintor', criteria)
    ],
    footerFields: auditFields()
  }
}

function transmacAmarreChecklist(title, criteria) {
  return {
    title,
    headerFields: [field('area', 'Area'), field('fechaRevision', 'Fecha revision', 'date'), field('equipo', 'Equipo')],
    groups: [matrixGroup('elementosAmarre', 'Elementos de amarre inspeccionados', 'Elemento', criteria)],
    footerFields: auditFields()
  }
}

function withImage(groupConfig, src) {
  return { ...groupConfig, image: { src, alt: groupConfig.title } }
}

function matrixGroup(id, title, rowLabel, criteria) {
  return {
    id,
    title,
    rowLabel,
    stateType: 'matrix-sino',
    items: [],
    criteria: criteria.map((label, index) => ({ id: `criterio-${index + 1}`, label }))
  }
}

function commonEquipmentFields() {
  return [field('faena', 'Faena'), field('fechaRevision', 'Fecha revision', 'date'), field('area', 'Area'), field('equipo', 'Equipo'), field('modelo', 'Modelo')]
}

function auditFields() {
  return []
}

function simpleIzaje(title, items, extraFields = []) {
  return {
    title,
    headerFields: [field('realizadaPor', 'Realizada por'), field('fecha', 'Fecha', 'date'), field('firma', 'Firma'), ...extraFields.map((key) => field(key, labelize(key)))],
    groups: [group('condiciones', 'Condicion a inspeccionar', 'sino', items)],
    footerFields: [field('responsableInspeccion', 'Responsable de la inspeccion'), field('fechaCierre', 'Fecha', 'date'), field('firmaCierre', 'Firma')]
  }
}

function multiElement(title, items, extraFields = [], columns = ['N1', 'N2', 'N3', 'N4']) {
  return {
    title,
    headerFields: [field('realizadaPor', 'Realizada por'), field('fecha', 'Fecha', 'date'), field('firma', 'Firma'), ...extraFields.map((key) => field(key, labelize(key)))],
    groups: [{ ...group('condiciones', 'Condicion a inspeccionar', 'multi-sino', items), columns }],
    footerFields: [field('responsableInspeccion', 'Responsable de la inspeccion'), field('fechaCierre', 'Fecha', 'date'), field('firmaCierre', 'Firma')]
  }
}

function labelize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase())
}
