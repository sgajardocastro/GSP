export function getMockSurveys() {
  const today = new Date().toISOString().split('T')[0]
  const nextMonth = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const nextYear = new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const expiredDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const lastMonth = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return [
    {
      id_survey: 9001,
      id_tipo_srv: 1,
      id_template: 13,
      id_user: 1,
      name_empresa_cliente: "CODELCO CHUQUICAMATA",
      id_proyecto: 101,
      nombre_proyecto: "CONTRATO MARCO INTEGRAL CHUQUI",
      name_tipo_srv: "Revision Extintores Calama",
      codi_tipo_srv: "REC",
      codi_template_srv: "FOR-SEG-006",
      name_template_srv: "FOR-SEG-006 REVISION EXTINTORES CALAMA",
      desc_template_srv: "REVISION ANUAL DE EXTINTORES - AREA CALAMA",
      name_area: "Área Calama",
      estado_srv: "Verificado",
      fecha_real_fin: today + "T14:30:00Z",
      fecha_real_ini: today + "T14:00:00Z",
      fecha_plan_ini: today,
      fecha_plan_fin: today,
      fecha_ejec_fin: today + "T14:30:00Z",
      body_exec: {
        segmentos: [
          {
            label: "FOR-SEG-006 REVISION EXTINTORES CALAMA",
            attributes: [
              {
                type: "checkListTransmacExtintoresCalama",
                observacionesGenerales: "Taller Principal",
                body: [
                  {
                    nroSello: "EXT-CAL-101",
                    capacidadNominal: "6",
                    claseExtintor: "PQS",
                    ubicacion: "Taller Principal - Entrada",
                    fechaVencimiento: nextYear,
                    checks: { c_0: "C", c_1: "C", c_2: "C", c_3: "C", c_4: "C", c_5: "C", c_6: "C", c_7: "C", c_8: "C", c_9: "C", c_10: "C", c_11: "C", c_12: "C" }
                  },
                  {
                    nroSello: "EXT-CAL-102",
                    capacidadNominal: "10",
                    claseExtintor: "CO2",
                    ubicacion: "Taller Principal - Eléctrico",
                    fechaVencimiento: nextYear,
                    checks: { c_0: "C", c_1: "C", c_2: "NC", c_3: "C", c_4: "C", c_5: "C", c_6: "C", c_7: "C", c_8: "C", c_9: "C", c_10: "C", c_11: "C", c_12: "C" }
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      id_survey: 9002,
      id_tipo_srv: 4,
      id_template: 28,
      id_user: 1,
      name_empresa_cliente: "CODELCO CHUQUICAMATA",
      id_proyecto: 101,
      nombre_proyecto: "CONTRATO MARCO INTEGRAL CHUQUI",
      name_tipo_srv: "Arnes de Seguridad DMH",
      codi_tipo_srv: "ASD",
      codi_template_srv: "FOR-SGI-CDMH-01-SST-010",
      name_template_srv: "FOR-SGI-CDMH-01-SST-010 CHECK LIST ARNÉS DE SEGURIDAD",
      desc_template_srv: "CHECK LIST ARNÉS DE SEGURIDAD CHUQUI",
      name_area: "Área Calama",
      estado_srv: "Verificado",
      fecha_real_fin: today + "T15:00:00Z",
      fecha_real_ini: today + "T14:45:00Z",
      fecha_plan_ini: today,
      fecha_plan_fin: today,
      fecha_ejec_fin: today + "T15:00:00Z",
      body_exec: {
        segmentos: [
          {
            label: "FOR-SGI-CDMH-01-SST-010 CHECK LIST ARNÉS DE SEGURIDAD",
            attributes: [
              {
                type: "checkListArnesSeguridadDmh",
                datos: {
                  area: "Taller Principal - Altura",
                  faenaContrato: "Chuquicamata",
                  codigoCertArnes: "ARN-SH-501",
                  codigoCertColas: "COL-SH-501"
                }
              }
            ]
          }
        ]
      }
    },
    {
      id_survey: 9003,
      id_tipo_srv: 2,
      id_template: 18,
      id_user: 1,
      name_empresa_cliente: "CODELCO CHUQUICAMATA",
      id_proyecto: 101,
      nombre_proyecto: "CONTRATO MARCO INTEGRAL CHUQUI",
      name_tipo_srv: "Eslingas de Amarre",
      codi_tipo_srv: "ESA",
      codi_template_srv: "FOR-SEG-018",
      name_template_srv: "CHECK LIST ESLINGAS DE AMARRE",
      desc_template_srv: "INSPECCION TRIMESTRAL DE ELEMENTOS DE IZAJE",
      name_area: "Área Calama",
      estado_srv: "Verificado",
      fecha_real_fin: today + "T15:15:00Z",
      fecha_real_ini: today + "T15:00:00Z",
      fecha_plan_ini: today,
      fecha_plan_fin: today,
      fecha_ejec_fin: today + "T15:15:00Z",
      body_exec: {
        segmentos: [
          {
            label: "CHECK LIST ESLINGAS DE AMARRE",
            attributes: [
              {
                type: "checkListEslingasTubularesCdch",
                label: "Eslingas de Izaje",
                descripcion: { largo: "3 Metros", factorSeguridad: "5:1" },
                condiciones: [
                  { label: "Costuras intactas", days: { lunes: "si" } },
                  { label: "Sin cortes ni raspaduras", days: { lunes: "si" } }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      id_survey: 9004,
      id_tipo_srv: 4,
      id_template: 6,
      id_user: 1,
      name_empresa_cliente: "CODELCO MINISTRO HALES",
      id_proyecto: 102,
      nombre_proyecto: "SERVICIO WMS LITE DMH",
      name_tipo_srv: "Revision Extintores",
      codi_tipo_srv: "REE",
      codi_template_srv: "FOR-SEG-004",
      name_template_srv: "CHECK LIST EXTINTOR",
      desc_template_srv: "CHECK LIST EXTINTOR DMH",
      name_area: "Mina Ministro Hales",
      estado_srv: "Ejecución",
      fecha_real_fin: today + "T10:00:00Z",
      fecha_real_ini: today + "T09:30:00Z",
      fecha_plan_ini: today,
      fecha_plan_fin: today,
      fecha_ejec_fin: today + "T10:00:00Z",
      body_exec: {
        segmentos: [
          {
            label: "CHECK LIST EXTINTOR",
            attributes: [
              {
                type: "checkListExtintorCdch",
                identificacion: { lugar: "Área Mina - Comedor Bodega", fechaTermino: nextMonth },
                descripcionEquipo: { numeroInterno: "EXT-MIN-404", capacidadKg: "6" },
                componentes: [
                  { label: "Manómetro marca verde", days: { lunes: "si" } },
                  { label: "Pasador intacto", days: { lunes: "si" } }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      id_survey: 9005,
      id_tipo_srv: 1,
      id_template: 14,
      id_user: 1,
      name_empresa_cliente: "BHP BILLITON ESCONDIDA",
      id_proyecto: 103,
      nombre_proyecto: "MANTENIMIENTO SPOT MEL",
      name_tipo_srv: "Revision Extintores Los Andes",
      codi_tipo_srv: "REA",
      codi_template_srv: "FOR-SEG-014",
      name_template_srv: "FOR-SEG-006 REVISION EXTINTORES LOS ANDES",
      desc_template_srv: "REVISION MENSUAL DE EXTINTORES - AREA LOS ANDES",
      name_area: "Bodega Escondida",
      estado_srv: "Verificado",
      fecha_real_fin: today + "T09:00:00Z",
      fecha_real_ini: today + "T08:30:00Z",
      fecha_plan_ini: today,
      fecha_plan_fin: today,
      fecha_ejec_fin: today + "T09:00:00Z",
      body_exec: {
        segmentos: [
          {
            label: "FOR-SEG-006 REVISION EXTINTORES LOS ANDES",
            attributes: [
              {
                type: "checkListTransmacExtintoresLosAndes",
                observacionesGenerales: "Bodega de Reactivos",
                body: [
                  {
                    nroSello: "EXT-LA-909",
                    capacidadNominal: "6",
                    claseExtintor: "PQS",
                    ubicacion: "Bodega Sector A",
                    fechaVencimiento: expiredDate,
                    checks: { c_0: "C", c_1: "C", c_2: "C", c_3: "C", c_4: "C", c_5: "C", c_6: "C", c_7: "C", c_8: "C", c_9: "C", c_10: "C", c_11: "C", c_12: "C" }
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      id_survey: 9006,
      id_tipo_srv: 4,
      id_template: 4,
      id_user: 1,
      name_empresa_cliente: "BHP BILLITON ESCONDIDA",
      id_proyecto: 103,
      nombre_proyecto: "MANTENIMIENTO SPOT MEL",
      name_tipo_srv: "Comunicacion Radial",
      codi_tipo_srv: "COR",
      codi_template_srv: "FOR-SEG-004-RAD",
      name_template_srv: "CHECK LIST COMUNICACIÓN RADIAL",
      desc_template_srv: "INSPECCION DE EQUIPOS DE COMUNICACION RADIAL",
      name_area: "Bodega Escondida",
      estado_srv: "Verificado",
      fecha_real_fin: lastMonth + "T11:00:00Z",
      fecha_real_ini: lastMonth + "T10:30:00Z",
      fecha_plan_ini: lastMonth,
      fecha_plan_fin: lastMonth,
      fecha_ejec_fin: lastMonth + "T11:00:00Z",
      body_exec: {
        segmentos: [
          {
            label: "CHECK LIST COMUNICACIÓN RADIAL",
            attributes: [
              {
                type: "checkListComunicacionRadial",
                datos: { marcaModelo: "Motorola PRO5150", tipoRadio: "Portátil", especialidad: "Bodega Central Radio" },
                body: [
                  { label: "Batería cargada", days: { d1: "si", d2: "si" } },
                  { label: "Antena en buen estado", days: { d1: "si", d2: "si" } }
                ]
              }
            ]
          }
        ]
      }
    }
  ]
}
