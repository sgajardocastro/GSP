/*if (!segmentos.some(s => s.label === 'Bloque 6')) {
      segmentos.push({
        posicion: 6,
        label: "Bloque 6",
        collapsible: false,
        touch: true,
        attributes: [
          {
            "type": "decimal",
            "label": "Densidad",
            "default": "",
            "nullable": false,
            "cantiDec": 2
          }
        ]
      })
    }*/

/* Ejemplo Ingreso Zanja
if (!segmentos.some(s => s.label === 'INGRESO ZANJA')) {
  segmentos.push({
    posicion: 31,
    label: 'INGRESO ZANJA',
    touch: false,
    collapsible: false,
    attributes: [
      {
        type: 'ingresoZanja',
        label: 'Registro de ingreso por acceso',
        nullable: false,
        maxAccess: 8,
        body: []
      }
    ]
  })
}
*/

/* Ejemplo Chequeo Extension Electrica
if (!segmentos.some(s => s.label === 'CHEQUEO EXTENSION ELECTRICA')) {
  segmentos.push({
    posicion: 32,
    label: 'CHEQUEO EXTENSION ELECTRICA',
    touch: false,
    collapsible: false,
    attributes: [
      {
        type: 'chequeoExtensionElectrica',
        label: 'Lista chequeo extension electrica',
        nullable: false,
        body: []
      }
    ]
  })
}
*/

/* Ejemplo CHECK LIST TECLES
if (!segmentos.some(s => s.label === 'CHECK LIST TECLES')) {
  segmentos.push({
    posicion: 30,
    label: 'CHECK LIST TECLES',
    touch: false,
    collapsible: false,
    attributes: [
      {
        type: 'checkListTecles',
        label: 'DE CADENA',
        nullable: false,
        options: [
          { id: 'si', label: 'SI' },
          { id: 'no', label: 'NO' },
          { id: 'n/a', label: 'N/A' }
        ],
        checkBoby: [
          {
            id: 1,
            label: 'Existe deterioro visible en su estructura?',
            days: { l: false, ma: false, mi: false, j: false, v: false },
            default: '',
            obs: '',
            nullable: false
          },
          {
            id: 2,
            label: 'Los seguros de los ganchos se encuentran en buen estado y operativo?',
            days: { l: false, ma: false, mi: false, j: false, v: false },
            default: '',
            obs: '',
            nullable: false
          },
          {
            id: 3,
            label: 'La cadena está en buen estado (sin fisuras, eslabones torcidos o corrosión)?',
            days: { l: false, ma: false, mi: false, j: false, v: false },
            default: '',
            obs: '',
            nullable: false
          },
          {
            id: 4,
            label: 'El mecanismo de accionamiento del equipo se encuentra operativo?',
            days: { l: false, ma: false, mi: false, j: false, v: false },
            default: '',
            obs: '',
            nullable: false
          },
          {
            id: 5,
            label: 'Se encuentra impresa la capacidad de carga del equipo?',
            days: { l: false, ma: false, mi: false, j: false, v: false },
            default: '',
            obs: '',
            nullable: false
          },
          {
            id: 6,
            label: 'Las partes moviles se encuentran libres de corrosion, tierra u otros elementos que dificulten su operacion?',
            days: { l: false, ma: false, mi: false, j: false, v: false },
            default: '',
            obs: '',
            nullable: false
          },
          {
            id: 7,
            label: 'El mecanismo de accionamiento se encuentra lubricado para un mejor rendimiento?',
            days: { l: false, ma: false, mi: false, j: false, v: false },
            default: '',
            obs: '',
            nullable: false
          },
          {
            id: 8,
            label: 'Se realiza prueba de levante en vacio antes de usar el equipo?',
            days: { l: false, ma: false, mi: false, j: false, v: false },
            default: '',
            obs: '',
            nullable: false
          }
        ]
      }
    ]
  })
}
*/

/* Ejemplo Check Monofasico/Trifasico
if (!segmentos.some(s => s.label === 'CHECK MONOFASICO TRIFASICO')) {
  segmentos.push({
    posicion: 33,
    label: 'CHECK MONOFASICO TRIFASICO',
    touch: false,
    collapsible: false,
    attributes: [
      {
        type: 'checkMonofasicoTrifasico',
        label: 'Checklist monofasico/trifasico',
        nullable: false,
        body: []
      }
    ]
  })
}
*/

/* Ejemplo Vibropison
if (!segmentos.some(s => s.label === 'VIBROPISON')) {
  segmentos.push({
    posicion: 34,
    label: 'VIBROPISON',
    touch: false,
    collapsible: false,
    attributes: [
      {
        type: 'vibropison',
        label: 'Checklist vibropison',
        nullable: false,
        body: []
      }
    ]
  })
}
*/

/* Ejemplo Chequeo Seguridad Betonera
if (!segmentos.some(s => s.label === 'CHEQUEO SEGURIDAD BETONERA')) {
  segmentos.push({
    posicion: 35,
    label: 'CHEQUEO SEGURIDAD BETONERA',
    touch: false,
    collapsible: false,
    attributes: [
      {
        type: 'chequeoSeguridadBetonera',
        label: 'Checklist seguridad betonera',
        nullable: false,
        body: [],
        estado: ''
      }
    ]
  })
}
*/

/* Ejemplo Checkeo Martillo Demoledor
if (!segmentos.some(s => s.label === 'CHECKEO MARTILLO DEMOLEDOR')) {
  segmentos.push({
    posicion: 36,
    label: 'CHECKEO MARTILLO DEMOLEDOR',
    touch: false,
    collapsible: false,
    attributes: [
      {
        type: 'checkeoMartilloDemoledor',
        label: 'Checklist martillo demoledor',
        nullable: false,
        body: [],
        estado: ''
      }
    ]
  })
}
*/

/* Ejemplo Check Equipos Iluminacion
if (!segmentos.some(s => s.label === 'CHECK EQUIPOS ILUMINACION')) {
  segmentos.push({
    posicion: 37,
    label: 'CHECK EQUIPOS ILUMINACION',
    touch: false,
    collapsible: false,
    attributes: [
      {
        type: 'checkEquiposIluminacion',
        label: 'Checklist equipos iluminacion',
        nullable: false,
        body: []
      }
    ]
  })
}
*/

/* Ejemplo Check Dispensador Agua Potable
if (!segmentos.some(s => s.label === 'CHECK DISPENSADOR AGUA POTABLE')) {
  segmentos.push({
    posicion: 38,
    label: 'CHECK DISPENSADOR AGUA POTABLE',
    touch: false,
    collapsible: false,
    attributes: [
      {
        type: 'checkDispensadorAguaPotable',
        label: 'Checklist dispensador agua potable',
        nullable: false,
        body: [],
        responsable: '',
        fecha: '',
        observacionGeneral: ''
      }
    ]
  })
}
*/

/*if (!segmentos.some(s => s.label === 'Bloque 6')) {
      segmentos.push({
        posicion: 6,
        label: "Bloque 6",
        collapsible: false,
        touch: true,
        cantidad: 3,
        attributes: [
          {
            type: "qr",
            nullable: true,
          }
        ]
      })
    }*/
    /*if (!segmentos.some(s => s.label === 'Bloque 6')) {
      segmentos.push({
        posicion: 6,
        label: "Bloque 6",
        collapsible: false,
        touch: true,
        cantidad: 3,
        attributes: [
          {
            text: "Texto de prueba",
            type: "labelLine",
            nullable: true,
          },
          {
            text: "Texto de prueba H1",
            type: "labelLineH1",
            nullable: true,
          },
          {
            text: "Texto de prueba H2",
            type: "labelLineH2",
            nullable: true,
          },
          {
            text: "Texto de prueba H3",
            type: "labelLineH3",
            nullable: true,
          },
          {
            text: "Texto de prueba H4",
            type: "labelLineH4",
            nullable: true,
          },
          {
            text: "Texto de prueba H5",
            type: "labelLineH5",
            nullable: true,
          }
        ]
      });
    }

    if (!segmentos.some(s => s.label === 'Bloque 7')) {
      segmentos.push({
        posicion: 7,
        label: "Bloque 7",
        collapsible: false,
        touch: true,
        cantidad: 3,
        attributes: [{
          type: 'photoCheck',
          posicion: 1,
          label: 'Uso excavadora nivelaciÃ³n camino',            
          default: '',
          options: [
            { id: 'si', label: 'SÃ­' },
            { id: 'no', label: 'No' },
            { id: 'n/a', label: 'N/A' },
          ],
          nullable: false,
          galeria: [],
          compression: 10,
          obs: ''
        },
        {
          type: 'photoCheck',
          posicion: 1,
          label: 'Uso excavadora nivelaciÃ³n camino',            
          default: '',
          options: [
            { id: 'si', label: 'SÃ­' },
            { id: 'no', label: 'No' },
            { id: 'n/a', label: 'N/A' },
          ],
          nullable: false,
          galeria: [],
          compression: 10,
        },
        {
          type: 'photoCheck',
          posicion: 1,
          label: 'Uso excavadora nivelaciÃ³n camino',            
          default: '',
          options: [
            { id: 'si', label: 'SÃ­' },
            { id: 'no', label: 'No' },
            { id: 'n/a', label: 'N/A' },
          ],
          nullable: false,
        },
        ]
      });
    }*/

    /*if (!segmentos.some(s => s.label === 'Bloque 15')) {
       segmentos.push({
        posicion: 12,
        label: 'Bloque 15',        
        touch: true,
        posicion: '15',
        collapsible: false,
        attributes: [{
          type: 'photo',
          label: 'Layout Planta CarguÃ­o',
          src: '/archivo/adc172bd-fb2a-4f6e-9ca3-1749adb8ebe7.png',
        }]
      });
    }*/
    /*
    if (!segmentos.some(s => s.label === 'Bloque XX')) {
       segmentos.push({
        posicion: 13,
        label: 'Bloque XX',        
        touch: true,
        posicion: '16',
        collapsible: false,
        attributes: [{
          type: 'matriz',
          label: 'Tabla Multi Nivel',
          headers: 
          [
            [ 
              {
                label: 'NÂ°',
                rowspan: 2,
              },
              {
                label: 'PK (Km)',
                rowspan: 2,
              },
              {
                label: 'PROFUNDID.'
              },
              {
                label: 'ANCHO SELLO'
              },
              {
                label: 'ANCHO SUP.'
              },
              {
                label: 'COTA SELLO',
                rowspan: 2,
              },
            ],
            [
              {
                label: 'a'
              },
              {
                label: 'b'
              },
              {
                label: 'c'
              },
            ]
          ],
          body: [
            [
              {
                value: '1'
              },
              {
                value: '2'
              },
              {
                value: '3'
              },
              {
                value: '4'
              },
              {
                value: '5'
              },
              {
                value: '6'
              },
            ],
            [
              {
                value: '1'
              },
              {
                value: '2'
              },
              {
                value: '3'
              },
              {
                value: '4'
              },
              {
                value: '5'
              },
              {
                value: '6'
              },
            ]
          ],
          footer: [
            [
              {
                label: 'PROMEDIOS (m)',
                colspan: 2
              },
              {
                cal: 'prom',
                value:''              
              },
              {               
                cal: 'prom',
                value:''              
              },
              {
                cal: 'prom',
                value:''              
              },
              {
                cal: 'prom',
                value:''              
              }
            ],
            [
              {
                label: 'VOLÃšMEN DE EXCAVACIÃ“N (M3)',
                rowspan: 2,
                colspan: 2,
              },
              {
                value:''              
              }
            ]
          ],
          dialog: [
            {
              title: 'Detalles de la Tabla',
              inputs: [
                {
                  label: 'NÂ°',
                  value: '',
                },
                {
                  label: 'PK (Km)',
                  value: '',
                },
                {
                  label: 'PROFUNDID.',
                  value: '',
                },
                {
                  label: 'ANCHO SELLO',
                  value: '',
                },
                {
                  label: 'ANCHO SUP.',
                  value: '',
                },
                {
                  label: 'COTA SELLO',
                  value: '',
                }
              ]
            }
          ]
        }]
      });
    }

    if (!segmentos.some(s => s.label === 'Bloque XXX')) {
       segmentos.push({
        posicion: 14,
        label: 'Bloque XXX',        
        touch: true,
        posicion: '16',
        collapsible: false,
        attributes: [{
          type: 'matriz',
          label: 'Tabla Multi Nivel',
          headers: 
          [
            [ 
              {
                label: 'NÂ°'                
              },
              {
                label: 'PK'
              },
              {
                label: 'Ancho sup.'
              },
              {
                label: 'Ancho inf.'
              },
              {
                label: 'Profundidad'
              },
              {
                label: 'Profundidad'
              },
              {
                label: 'Largo'
              },
              {
                label: 'Acumulado'
              },
              {
                label: 'Volumen'
              },
            ]
          ],
          body: [
            [
              {
                value: '1'
              },
              {
                value: '2'
              },
              {
                value: '3'
              },
              {
                value: '4'
              },
              {
                value: '5'
              },
              {
                value: '6'
              },
              {
                value: '7'
              },
              {
                value: '8'
              },
              {
                value: '9'
              },
            ]
          ],
          dialog: [
            {
              title: 'Detalles de la Tabla',
              inputs: [
                {
                  label: 'NÂ°',
                  value: '',
                },
                {
                  label: 'PK',
                  value: ''
                },
                {
                  label: 'Ancho sup.',
                  value: ''
                },
                {
                  label: 'Ancho inf.',
                  value: ''
                },
                {
                  label: 'Profundidad',
                  value: ''
                },
                {
                  label: 'Profundidad',
                  value: ''
                },
                {
                  label: 'Largo',
                  value: ''
                },
                {
                  label: 'Acumulado',
                  value: ''
                },
                {
                  label: 'Volumen',
                  value: ''
                },
              ]
            }
          ]
        }]
      });
    }
    if (!segmentos.some(s => s.label === 'Bloque XXXX')) {
       segmentos.push({
        "posicion": 20,
        "label": "Bloque XXXX",
        "touch": true,
        "collapsible": false,
        "attributes": [
          {
            "type": "matriz",
            "label": "Bloque XXXX",
            "headers": [
              [
                { "label": "" },
                { "label": "ELABORA" },
                { "label": "REVISÃ“" },
                { "label": "APROBÃ“" },
                { "label": "APROBÃ“" }
              ]
            ],
            "body": [
              [
                { "value": "NOMBRE" },
                { "value": "" },
                { "value": "GUIDO REYES" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "CARGO" },
                { "value": "" },
                { "value": "JEFE DE TERRENO" },
                { "value": "" },
                { "value": "ITO SONACOL P&A" }
              ],
              [
                { "value": "FIRMA" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "FECHA" },
                { "value": "" },
                { "value": "." },
                { "value": "" },
                { "value": "" }
              ]
            ],
            "dialog": [
              {
                "title": "Firmas y Aprobaciones",
                "inputs": [
                  { "label": "ELABORA - NOMBRE", "value": "" },
                  { "label": "ELABORA - CARGO",  "value": "" },
                  { "label": "ELABORA - FIRMA",  "value": "" },
                  { "label": "ELABORA - FECHA",  "value": "" },

                  { "label": "REVISÃ“ - NOMBRE", "value": "" },
                  { "label": "REVISÃ“ - CARGO",  "value": "" },
                  { "label": "REVISÃ“ - FIRMA",  "value": "" },
                  { "label": "REVISÃ“ - FECHA",  "value": "" },

                  { "label": "APROBÃ“ - NOMBRE", "value": "" },
                  { "label": "APROBÃ“ - CARGO",  "value": "" },
                  { "label": "APROBÃ“ - FIRMA",  "value": "" },
                  { "label": "APROBÃ“ - FECHA",  "value": "" },

                  { "label": "APROBÃ“ (2) - NOMBRE", "value": "" },
                  { "label": "APROBÃ“ (2) - CARGO",  "value": "" },
                  { "label": "APROBÃ“ (2) - FIRMA",  "value": "" },
                  { "label": "APROBÃ“ (2) - FECHA",  "value": "" }
                ]
              }
            ]
          }
        ]
      });
    }

    if (!segmentos.some(s => s.label === 'Bloque XXXXX')) {
       segmentos.push({
        "posicion": 17,
        "label": "Bloque XXXXX",
        "touch": true,
        "collapsible": false,
        "attributes": [
          {
            "type": "matriz",
            "label": "Bloque XXXXX",
            "headers": [
              [
                { "label": "nÂ° de mediciÃ³n/ distancia" },
                { "label": "" },
                { "label": "" },
                { "label": "" },
                { "label": "" },
                { "label": "PROMEDIO" }
              ]
            ],
            "body": [
              [
                { "value": "1" },
                { "value": "2" },
                { "value": "3" },
                { "value": "4" },
                { "value": "5" },
                { "value": "7" }
              ],
              [
                { "value": "2" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "3" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "4" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ]
            ],
            "dialog": [
              {
                "title": "Detalles de la Tabla",
                "inputs": [
                  { "label": "nÂ° de mediciÃ³n/ distancia", "value": "" },
                  { "label": "", "value": "" },
                  { "label": "", "value": "" },
                  { "label": "", "value": "" },
                  { "label": "", "value": "" },
                  { "label": "PROMEDIO", "value": "" }
                ]
              }
            ]
          }
        ]
      });
    }

    if (!segmentos.some(s => s.label === 'Bloque XXXXXX')) {
       segmentos.push({
        "posicion": 18,
        "label": "Bloque XXXXXX",
        "touch": true,
        "collapsible": false,
        "attributes": [
          {
            "type": "matriz",
            "label": "Bloque XXXXXX",
            "headers": [
              [
                { "label": "NÂ°" },
                { "label": "PK (KM)" },
                { "label": "PROFUNDIDAD" },
                { "label": "COTA CLAVE" },
                { "label": "COTA TERRENO" }
              ]
            ],
            "body": [
            ],
            "dialog": [
              {
                "title": "Detalles de la Tabla",
                "inputs": [
                  { "label": "NÂ°", "value": "" },
                  { "label": "PK (KM)", "value": "" },
                  { "label": "PROFUNDIDAD", "value": "" },
                  { "label": "COTA CLAVE", "value": "" },
                  { "label": "COTA TERRENO", "value": "" }
                ]
              }
            ]
          }
        ]
      });
    }

    if (!segmentos.some(s => s.label === 'Bloque XXXXXXX')) {
       segmentos.push({
        "posicion": "8",
        "label": "Bloque XXXXXXX",
        "touch": true,
        "collapsible": false,
        "attributes": [
          {
            "type": "matriz",
            "label": "Bloque XXXXXXX",
            "headers": [
              [
                { "label": "" },
                { "label": "ELABORA" },
                { "label": "REVISÃ“" },
                { "label": "VALIDA" },
                { "label": "APROBÃ“" }
              ]
            ],
            "body": [
              [
                { "value": "NOMBRE" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "CARGO" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "FIRMA" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "FECHA" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ]
            ],
            "dialog": [
              {
                "title": "Firmas y Aprobaciones",
                "inputs": [
                  { "label": "ELABORA - NOMBRE", "value": "" },
                  { "label": "ELABORA - CARGO",  "value": "" },
                  { "label": "ELABORA - FIRMA",  "value": "" },
                  { "label": "ELABORA - FECHA",  "value": "" },

                  { "label": "REVISÃ“ - NOMBRE", "value": "" },
                  { "label": "REVISÃ“ - CARGO",  "value": "" },
                  { "label": "REVISÃ“ - FIRMA",  "value": "" },
                  { "label": "REVISÃ“ - FECHA",  "value": "" },

                  { "label": "VALIDA - NOMBRE", "value": "" },
                  { "label": "VALIDA - CARGO",  "value": "" },
                  { "label": "VALIDA - FIRMA",  "value": "" },
                  { "label": "VALIDA - FECHA",  "value": "" },

                  { "label": "APROBÃ“ (2) - NOMBRE", "value": "" },
                  { "label": "APROBÃ“ (2) - CARGO",  "value": "" },
                  { "label": "APROBÃ“ (2) - FIRMA",  "value": "" },
                  { "label": "APROBÃ“ (2) - FECHA",  "value": "" }
                ]
              }
            ]
          }
        ]
      });
    }

    if (!segmentos.some(s => s.label === 'Bloque XXXXXXXX')) {
       segmentos.push({
        "posicion": 19,
        "label": "Bloque XXXXXXXX",
        "touch": true,
        "collapsible": false,
        "attributes": [
          {
            "type": "matriz",
            "label": "Bloque XXXXXXXX",
            "headers": [
              [
                { "label": " " },
                { "label": "SOLDADOR" },
                { "label": "TIPO DE ELECTRODO" },
                { "label": "TIPO DE PROCESO" },
                { "label": "AVANCE" }
              ]
            ],
            "body": [
              [
                { "value": "RAIZ" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "CORDÃ“N NÂ°2" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "CORDÃ“N NÂ°3" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "CORDÃ“N DE REMATE" },
                { "value": "" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ]
            ],
            "dialog": [
              {
                "title": "Detalles de RAIZ",
                "inputs": [
                  { "label": "RAIZ - SOLDADOR", "value": "" },
                  { "label": "RAIZ - TIPO DE ELECTRODO", "value": "" },
                  { "label": "RAIZ - TIPO DE PROCESO", "value": "" },
                  { "label": "RAIZ - AVANCE", "value": "" },
                
                  { "label": "CORDÃ“N NÂ°2 - SOLDADOR", "value": "" },
                  { "label": "CORDÃ“N NÂ°2 - TIPO DE ELECTRODO", "value": "" },
                  { "label": "CORDÃ“N NÂ°2 - TIPO DE PROCESO", "value": "" },
                  { "label": "CORDÃ“N NÂ°2 - AVANCE", "value": "" },
                
                  { "label": "CORDÃ“N NÂ°3 - SOLDADOR", "value": "" },
                  { "label": "CORDÃ“N NÂ°3 - TIPO DE ELECTRODO", "value": "" },
                  { "label": "CORDÃ“N NÂ°3 - TIPO DE PROCESO", "value": "" },
                  { "label": "CORDÃ“N NÂ°3 - AVANCE", "value": "" },
                
                  { "label": "CORDÃ“N DE REMATE - SOLDADOR", "value": "" },
                  { "label": "CORDÃ“N DE REMATE - TIPO DE ELECTRODO", "value": "" },
                  { "label": "CORDÃ“N DE REMATE - TIPO DE PROCESO", "value": "" },
                  { "label": "CORDÃ“N DE REMATE - AVANCE", "value": "" }
                ]
              }
            ]
          }
        ]
      });
    }

    if (!segmentos.some(s => s.label === 'Bloque XXXXXXXXX')) {
       segmentos.push({
        "posicion": 21,
        "label": "Bloque XXXXXXXXX",
        "touch": true,
        "collapsible": false,
        "attributes": [
          {
            "type": "matriz",
            "label": "Bloque XXXXXXXXX",
            "headers": [
              [
                { "label": "SECTOR" },
                { "label": "ESPESOR" },
                { "label": "IQI REQUERIDO" },
                { "label": "IQI OBTENIDO" },
                { "label": "DENSIDAD" },
                { "label": "TIPO DEFECTO" },
                { "label": "CALIF." },
                { "label": "OBSERVACIONES" }
              ]
            ],
            "body": [
              
            ],
            "dialog": [
              {
                "title": "Resultados RadiografÃ­a",
                "inputs": [
                  { "label": "SECTOR", "value": "" },
                  { "label": "ESPESOR", "value": "" },
                  { "label": "IQI REQUERIDO", "value": "" },
                  { "label": "IQI OBTENIDO", "value": "" },
                  { "label": "DENSIDAD", "value": "" },
                  { "label": "TIPO DEFECTO", "value": "" },
                  { "label": "CALIF.", "value": "" },
                  { "label": "OBSERVACIONES", "value": "" }
                ]
              }
            ]
          }
        ]
      });
    } */
    /*if (!segmentos.some(s => s.label === 'Bloque XXXXXXXXXX')) {
      segmentos.push({
        "posicion": 1,
        "label": "Bloque XXXXXXXXXX",
        "touch": true,
        "collapsible": false,
        "attributes": [
          {
            "type": "matriz",
            "label": "Bloque XXXXXXXXXX",
            "headers": [
              [
                { "label": "PASADA", "rowspan": 2 },
                { "label": "COPLA SUPERIOR", "colspan": 3 }
              ],
              [
                { "label": "TÂ° PRECAL" },
                { "label": "AMPERAJE PROMEDIO" },
                { "label": "ESTAMPA DE SOLDADOR" }
              ]
            ],
            "body": [
              [
                { "value": "CORDÃ“N CAÃ‘ERÃA" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "RAÃZ / RELLENO" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "REMATE" },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ]
            ],
            "dialog": [
              {
                "title": "Detalles COPLA SUPERIOR",
                "inputs": [
                  { "label": "PASADA", "value": "" },
                  { "label": "TÂ° PRECAL", "value": "" },
                  { "label": "AMPERAJE PROMEDIO", "value": "" },
                  { "label": "ESTAMPA DE SOLDADOR", "value": "" }
                ]
              }
            ]
          }
        ]
      });
    }*/
    /*if (!segmentos.some(s => s.label === 'Bloque XXXXXXXXXXX')) {
      segmentos.push({
        "posicion": 1,
        "label": "Bloque XXXXXXXXXXX",
        "touch": true,
        "collapsible": false,
        "attributes": [
          {
            "type": "matriz",
            "label": "Bloque XXXXXXXXXXX",
            "actualizar": true,
            "headers": [
              [
                { "label": "PASADA", "rowspan": 2 },
                { "label": "COPLA INFERIOR", "colspan": 3 }
              ],
              [
                { "label": "TÂ° PRECAL" },
                { "label": "AMPERAJE PROMEDIO" },
                { "label": "ESTAMPA DE SOLDADOR" }
              ]
            ],
            "body": [
              [
                { "value": "CORDÃ“N CAÃ‘ERÃA", "editable": false },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "RAÃZ / RELLENO", "editable": false },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ],
              [
                { "value": "REMATE", "editable": false },
                { "value": "" },
                { "value": "" },
                { "value": "" }
              ]
            ],
            "dialog": [
              {
                "title": "Detalles COPLA SUPERIOR",
                "inputs": [
                  { "label": "CORDÃ“N CAÃ‘ERÃA - TÂ° PRECAL", "value": "" },
                  { "label": "CORDÃ“N CAÃ‘ERÃA - AMPERAJE PROMEDIO", "value": "" },
                  { "label": "CORDÃ“N CAÃ‘ERÃA - ESTAMPA DE SOLDADOR", "value": "" },

                  { "label": "RAÃZ / RELLENO - TÂ° PRECAL", "value": "" },
                  { "label": "RAÃZ / RELLENO - AMPERAJE PROMEDIO", "value": "" },
                  { "label": "RAÃZ / RELLENO - ESTAMPA DE SOLDADOR", "value": "" },

                  { "label": "REMATE - TÂ° PRECAL", "value": "" },
                  { "label": "REMATE - AMPERAJE PROMEDIO", "value": "" },
                  { "label": "REMATE - ESTAMPA DE SOLDADOR", "value": "" }
                ]
              }
            ]
          }
        ]
      });
    }*/
/*
    if (!segmentos.some(s => s.label === 'Bloque Matriz Check')) {
       segmentos.push({
        "posicion": 21,
        "label": "Bloque Matriz Check",
        "touch": true,
        "collapsible": false,
        "attributes": [
          {
            "type": "matrizCheck",
            "label": "Bloque Matriz Check",
            "actualizar": false,
            "headers": [
              [
                { "label": "NÂ°", "width": "5%" },
                { "label": "ELEMENTOS A INSPECCIONAR", "width": "30%" },
                { "label": "SI NO N/A", "width": "10%", "options": [
                    { id: 'si', label: 'SÃ­' },
                    { id: 'no', label: 'No' },
                    { id: 'n/a', label: 'N/A' },
                  ]
                },
                { "label": "Puntaje", "width": "10%" },
                { "label": "ObservaciÃ³n", "width": "20%" },
                { "label": "Imagen", "width": "25%" }
              ]
            ],
            "body": [
              [
                { "value": 1, "editable": false },
                { "value": "Â¿Dispone de bodega para almacenamiento de residuos peligrosos?", "editable": false, "text-align": "left" },
                { "value": "", "type": "check" },
                { "value": "", "type": "number" },
                { "value": "" },
                { "value": "", "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 2,  "editable": false },
                { "value": "La bodega, Â¿esta construida segÃºn se indica en procedimiento TPI-MAM-PRO-002?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 3,  "editable": false },
                { "value": "Â¿La bodega cuenta con la siguiente seÃ±alizaciÃ³n: uso de epp, no fumar, ingreso personal autorizado, pictogramas de peligrosidades, informativo NFPA?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 4,  "editable": false },
                { "value": "Â¿La bodega dispone de sistema de ventilaciÃ³n natural o forzada?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 5,  "editable": false },
                { "value": "Â¿La bodega cuenta con contenedores hermÃ©ticos para la segregaciÃ³n de residuos?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 6,  "editable": false },
                { "value": "Â¿Los contenedores se encuentran debidamente rotulados y  seÃ±alizados?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 7,  "editable": false },
                { "value": "La bodega, Â¿se encuentra ordenada y clasificada segÃºn compatibilidad?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 8,  "editable": false },
                { "value": "Â¿Existen medios para contener el derrame de residuos peligrosos?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 9,  "editable": false },
                { "value": "Â¿Dispone extintor de polvo quÃ­mico seco, segÃºn capacidad de eximiciÃ³n?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 10, "editable": false },
                { "value": "Â¿Dispone de listados de residuos peligrosos actualizado de bodega?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 11, "editable": false },
                { "value": "Â¿Dispone del croquis de residuos peligrosos actualizado y publicado al exterior de la bodega?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 12, "editable": false },
                { "value": "Â¿Dispone de matriz de incompatiblidad actualizado y publicado al exterior de la bodega?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 13, "editable": false },
                { "value": "Â¿El personal a cargo de la bodega de sustancias peligrosas cuenta con la capacitaciÃ³n especÃ­fica?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 14, "editable": false },
                { "value": "Â¿Los accesos a la bodega se encuentran despejados y libre de obstÃ¡culos para el ingreso de personal de emergencia?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ],
              [
                { "value": 15, "editable": false },
                { "value": "La bodega, Â¿se encuentra aisladas de fuentes de calor o fuentes de igniciÃ³n de fuego tales como madera, cartÃ³n, plÃ¡sticos, etc?", "editable": false, "text-align": "left" },
                { "value": "NO", "type": "check" },
                { "value": 0,    "type": "number" },
                { "value": "" },
                { "value": "",   "type": "image", "galeria": [], "compression": 10 }
              ]
            ],
            "footer":
              [
                { "label": "Puntaje Obtenido", "value": 0, "colspan": 2, "puntajeObtenido": 0 },
                { "label": "Puntaje MÃ¡ximo", "value": 0, "colspan": 2, "puntajeMaximo": 0 },
                { "label": "DesempeÃ±o", "value": "0%", "colspan": 2, "desempeno": "0%" }
              ]
          }
        ]
      });
    }
*/
    /*if (!segmentos.some(s => s.label === 'Matriz Excavaciones')) {
       segmentos.push({
         "label": "Matriz Excavaciones",
         "touch": false,
         "posicion": 2,
         "attributes": [
           {
             "body": [],
             "type": "matrizExcavaciones",
             "label": "Matriz Excavaciones",
             "dialog": [
               {
                 "title": "Perfiles de Zanja",
                 "inputs": [
                   {
                     "label": "NÂ°",
                     "value": ""
                   },
                   {
                     "label": "PK",
                     "value": ""
                   },
                   {
                     "label": "Ancho sup. (a)",
                     "value": ""
                   },
                   {
                     "label": "Ancho inf. (b)",
                     "value": ""
                   },
                   {
                     "label": "Profundidad (c) ",
                     "value": ""
                   },
                   {
                     "label": "Largo (L)",
                     "value": ""
                   },
                   {
                     "label": "Acumulado L (m)",
                     "value": ""
                   },
                   {
                     "label": "Volumen V (m3)",
                     "value": ""
                   }
                 ]
               }
             ],
             "headers": [
               [
                 {
                   "label": "NÂ°"
                 },
                 {
                   "label": "PK"
                 },
                 {
                   "label": "Ancho sup. (a)"
                 },
                 {
                   "label": "Ancho inf. (b)"
                 },
                 {
                   "label": "Profundidad (c) "
                 },
                 {
                   "label": "Largo (L)"
                 },
                 {
                   "label": "Acumulado L (m)"
                 },
                 {
                   "label": "Volumen V (m3)"
                 }
               ]
             ]
           }
         ],
         "collapsible": false
       });
    }*/

    /*if (!segmentos.some(s => s.label === 'matrizBorewrap')) {
      segmentos.push({
        "label": "matrizBorewrap",
        "touch": true,
        "posicion": 7,
        "attributes": [
          {
            "body": [],
            "type": "matrizBorewrap",
            "label": "CARGUIO DE AGUAS",
            "dialog": [
              {
                "title": "CONDICIONES AMBIENTALES",
                "inputs": [
                  {
                    "label": "(HR) % de hÃºmedad relativa",
                    "value": ""
                  },
                  {
                    "label": "(Ts) Temperatura de Superficie",
                    "value": ""
                  },
                  {
                    "label": "(Ta) Temperatura aire del ambiente",
                    "value": ""
                  },
                  {
                    "label": "(Td) Punto de RocÃ­o",
                    "value": ""
                  },
                  {
                    "label": "(Tâˆ†) Diferencia entre Td y Ts",
                    "value": ""
                  },
                  {
                    "label": "Hora de mediciÃ³n",
                    "value": ""
                  }
                ]
              }
            ],
            "headers": [
              [
                {
                  "label": "(HR) % de hÃºmedad relativa"
                },
                {
                  "label": "(Ts) Temperatura de Superficie"
                },
                {
                  "label": "(Ta) Temperatura aire del ambiente"
                },
                {
                  "label": "(Td) Punto de RocÃ­o"
                },
                {
                  "label": "(Tâˆ†) Diferencia entre Td y Ts"
                },
                {
                  "label": "Hora de mediciÃ³n"
                }
              ]
            ]
          }
        ],
        "collapsible": false
      });
    }

    if (!segmentos.some(s => s.label === 'matrizTransp')) {
      segmentos.push({
        "label": "matrizTransp",
        "touch": true,
        "posicion": 2,
        "attributes": [
          {
            "body": [],
            "type": "matrizTransp",
            "label": "2. LISTADO DE CAÃ‘ERIAS",
            "dialog": [
              {
                "title": "Detalles de CaÃ±erÃ­as",
                "inputs": [
                  {
                    "label": "Item",
                    "value": ""
                  },
                  {
                    "label": "NÃºmero de CaÃ±erÃ­a",
                    "value": ""
                  },
                  {
                    "label": "NÂ° SCI.",
                    "value": ""
                  },
                  {
                    "label": "Largo (m)",
                    "value": ""
                  }
                ]
              }
            ],
            "headers": [
              [
                {
                  "label": "Item"
                },
                {
                  "label": "NÃºmero de CaÃ±erÃ­a"
                },
                {
                  "label": "NÂ° SCI."
                },
                {
                  "label": "Largo (m)"
                }
              ]
            ],
            footer: [
              {
                label: 'TOTAL METRO LINEALES = ',
                value: 0,
                colspan: 2,
                totalLargo: 0
              }
            ]
          }
        ],
        "collapsible": false
      })
    }

    if (!segmentos.some(s => s.label === 'matrizGranallado')) {
      segmentos.push({
        "label": "matrizGranallado",
        "touch": true,
        "posicion": 2,
        "attributes": [
          {
            "body": [],
            "type": "matrizGranallado",
            "label": "matrizGranallado",
            "dialog": [
              {
                "title": "COTA PROFUNDIDAD DE SELLO",
                "inputs": [
                  {
                    "label": "NÂ° de mediciÃ³n ",
                    "value": ""
                  },
                  {
                    "label": "0Â°",
                    "value": ""
                  },
                  {
                    "label": "90Â°",
                    "value": ""
                  },
                  {
                    "label": "180Â°",
                    "value": ""
                  },
                  {
                    "label": "270Â°",
                    "value": ""
                  },
                  {
                    "label": "Promedio",
                    "value": ""
                  }
                ]
              }
            ],
            "headers": [
              [
                {
                  "label": "NÂ° de mediciÃ³n "
                },
                {
                  "label": "0Â°"
                },
                {
                  "label": "90Â°"
                },
                {
                  "label": "180Â°"
                },
                {
                  "label": "270Â°"
                },
                {
                  "label": "Promedio"
                }
              ]
            ]
          }
        ],
        "collapsible": false
      })
    };


    if (!segmentos.some(s => s.label === 'matrizProtal')) {
      segmentos.push({
          "label": "matrizProtal",
          "touch": true,
          "posicion": 2,
          "attributes": [
            {
              "type": "matrizProtal",
              "label": "matrizProtal",
              "dialog": [
                {
                  "title": "Detalles de la Tabla",
                  "inputs": [
                    {
                      "label": "nÂ° de mediciÃ³n/ distancia",
                      "value": ""
                    },
                    {
                      "label": "0Â°",
                      "value": ""
                    },
                    {
                      "label": "90Â°",
                      "value": ""
                    },
                    {
                      "label": "180Â°",
                      "value": ""
                    },
                    {
                      "label": "270Â°",
                      "value": ""
                    },
                    {
                      "label": "PROMEDIO",
                      "value": ""
                    }
                  ]
                }
              ],
              "headers": [
                [
                  {
                    "label": "NÂ° de mediciÃ³n/ distancia"
                  },
                  {
                    "label": "0Â°"
                  },
                  {
                    "label": "90Â°"
                  },
                  {
                    "label": "180Â°"
                  },
                  {
                    "label": "270Â°"
                  },
                  {
                    "label": "PROMEDIO"
                  }
                ]
              ]
            }
          ],
          "collapsible": false
        },
        {
          "label": "matrizProtal",
          "touch": true,
          "posicion": 5,
          "attributes": [
            {
              "type": "matrizProtal",
              "label": "matrizProtal",
              "dialog": [
                {
                  "title": "Detalles de la Tabla",
                  "inputs": [
                    {
                      "label": "nÂ° de mediciÃ³n/ distancia",
                      "value": ""
                    },
                    {
                      "label": "0Â°",
                      "value": ""
                    },
                    {
                      "label": "90Â°",
                      "value": ""
                    },
                    {
                      "label": "180Â°",
                      "value": ""
                    },
                    {
                      "label": "270Â°",
                      "value": ""
                    },
                    {
                      "label": "PROMEDIO",
                      "value": ""
                    }
                  ]
                }
              ],
              "headers": [
                [
                  {
                    "label": "NÂ° de mediciÃ³n/ distancia"
                  },
                  {
                    "label": "0Â°"
                  },
                  {
                    "label": "90Â°"
                  },
                  {
                    "label": "180Â°"
                  },
                  {
                    "label": "270Â°"
                  },
                  {
                    "label": "PROMEDIO"
                  }
                ]
              ]
            }
          ],
          "collapsible": false
        })
    };

    if (!segmentos.some(s => s.label === 'matrizPolypipe')) {
      segmentos.push({
        "label": "matrizPolypipe",
        "touch": false,
        "posicion": 2,
        "attributes": [
          {
            "type": "matrizPolypipe",
            "label": "matrizPolypipe",
            "dialog": [
              {
                "title": "Detalles de la Tabla",
                "inputs": [
                  {
                    "label": "(HR) % de hÃºmedad relativa",
                    "value": ""
                  },
                  {
                    "label": "(Ts) Temperatura de Superficie",
                    "value": ""
                  },
                  {
                    "label": "(Ta) Temperatura aire del ambiente",
                    "value": ""
                  },
                  {
                    "label": "(Td) Punto de RocÃ­o",
                    "value": ""
                  },
                  {
                    "label": "(Tâˆ†) Diferencia entre Td y Ts",
                    "value": ""
                  },
                  {
                    "label": "Hora de mediciÃ³n",
                    "value": ""
                  }
                ]
              }
            ],
            "headers": [
              [
                {
                  "label": "(HR) % de hÃºmedad relativa"
                },
                {
                  "label": "(Ts) Temperatura de Superficie"
                },
                {
                  "label": "(Ta) Temperatura aire del ambiente"
                },
                {
                  "label": "(Td) Punto de RocÃ­o"
                },
                {
                  "label": "(Tâˆ†) Diferencia entre Td y Ts"
                },
                {
                  "label": "Hora de mediciÃ³n"
                }
              ]
            ]
          }
        ],
        "collapsible": false
      })
    };

    if (!segmentos.some(s => s.label === 'matrizSoldadura')) {
      segmentos.push(
        {
          "label": "matrizSoldadura",
          "touch": true,
          "posicion": "9",
          "attributes": [
            {
              "body": [],
              "type": "matrizSoldadura",
              "label": "matrizSoldadura",
              "headers": [
                [
                  { "label": "SECTOR" },
                  { "label": "ESPESOR" },
                  { "label": "IQI REQUERIDO" },
                  { "label": "IQI OBTENIDO" },
                  { "label": "DENSIDAD" },
                  { "label": "TIPO DEFECTO" },
                  { "label": "CALIF." },
                  { "label": "OBSERVACIONES" }
                ]
              ]
            }
          ],
          "collapsible": false
        }
      )
    }*/

    /*if (!segmentos.some(s => s.label === 'Equipo')) {
      segmentos.push(
         {
            "label": "Equipo",
            "touch": false,
            "nullable": true,
            "posicion": 4,
            "attributes": [
                {
                    "type": "textArea",
                    "label": "Observaciones no obligatorias: ",
                    "default": "",
                    "nullable": true,
                    "posicion": 1
                }
                ,
                {
                    "type": "asignarEquipo",
                    "label": "Asignar Equipo: ",
                    "default": "",
                    "nullable": true,
                    "posicion": 1
                }
            ],
            "collapsible": false
        }
      )
    }*/
    /*if (!segmentos.some(s => s.label === 'prueba')) {
      segmentos.push(
         {
            label: 'prueba',
            touch: false,
            nullable: true,
            posicion: 1,
            attributes: [
              {
                label: 'TUBO LASTRADO: ',
                default: '.m.,m',
                nullable: true,
                posicion: 2,
                type: 'number'
              }
            ],
            collapsible: false
          }
      )
    }*/

    /*if (!segmentos.some(s => s.label === 'matrizCombustible')) {
      segmentos.push(
        {
          "label": "matrizCombustible",
          "touch": true,
          "posicion": "9",
          "attributes": [
            {
              "body": [
                [
                  { "value": "" },
                  { "value": "" },
                  { "value": "" },
                  { "value": "" },
                  { "value": "" }
                ]
              ],
              "type": "matrizCombustible",
              "label": "matrizCombustible",
              "headers": [
                [
                  { "label": "NOMBRE" },
                  { "label": "TIPO DE COMBUSTIBLE" },
                  { "label": "CANTIDAD (lt)" },
                  { "label": "HORAS FUNCIONAMIENTO" },
                  { "label": "OBSERVACIONES" }
                ]
              ]
            }
          ],
          "collapsible": false
        }
      )
    }*/
  /* {
  "segmentos": [
    {
      "label": "GENERAL",
      "touch": true,
      "cantidad": "2",
      "posicion": "1",
      "attributes": [
        {
          "body": [],
          "type": "resgistroAdd",
          "label": "Condiciones",
          "nullable": true,
          "compression": 0.25,
          "itemsCatalogo": [
            {
              "id": 1,
              "nombre": "EstaciÃ³n de Emergencia"
            },
            {
              "id": 2,
              "nombre": "Extintores"
            },
            {
              "id": 3,
              "nombre": "Gases Comprimirdos"
            },
            {
              "id": 4,
              "nombre": "ExcavaciÃ³n"
            },
            {
              "id": 5,
              "nombre": "Almacen Combustibles"
            },
            {
              "id": 6,
              "nombre": "SeÃ±alizaciÃ³n"
            },
            {
              "id": 7,
              "nombre": "BaÃ±os y Duchas"
            },
            {
              "id": 8,
              "nombre": "Arnes de Seguridad"
            },
            {
              "id": 9,
              "nombre": "Comedores y Vestidores"
            },
            {
              "id": 10,
              "nombre": "Dispensador de agua"
            },
            {
              "id": 11,
              "nombre": "Oficina"
            },
            {
              "id": 12,
              "nombre": "Trabajo en altura"
            },
            {
              "id": 13,
              "nombre": "Elementos de Izaje"
            }
          ],
          "condicionesOptions": [
            "Bueno",
            "Malo",
            "N/A"
          ]
        },
        {
          "type": "textArea",
          "label": "CondiciÃ³n Subestandar:",
          "default": ""
        },
        {
          "type": "textArea",
          "label": "Medidas Correctivas:",
          "default": ""
        }
      ],
      "collapsible": false
    }
  ]
}*/

/* Ejemplo minimo para ArtefactosCheck
if (!segmentos.some(s => s.label === 'Conversión de Artefactos')) {
  segmentos.push({
    posicion: 21,
    label: 'Conversión de Artefactos',
    touch: true,
    collapsible: false,
    attributes: [
      {
        type: 'ArtefactosCheck',
        label: 'Bloque Artefactos Check',
        actualizar: false
      }
    ]
  })
}
*/

/* Ejemplo Matriz Obs y Recomendaciones
if (!segmentos.some(s => s.label === 'MATRIZ OBS Y RECOMENDACIONES')) {
  segmentos.push({
    posicion: 41,
    label: 'MATRIZ OBS Y RECOMENDACIONES',
    touch: false,
    collapsible: false,
    attributes: [
      {
        type: 'matrizMAObsyRecomenaciones',
        label: 'Observaciones y recomendaciones',
        nullable: true,
        maxFotos: 3,
        compression: 0.25,
        body: []
      }
    ]
  })
}
*/


