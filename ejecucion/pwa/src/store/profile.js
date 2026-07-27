import { defineStore } from 'pinia'

export default defineStore('profile', {
  state: () => ({ 
    ID_USUARIO: 0,
    CODI_USUARIO: '',
    NOMBRE_USUARIO: '',
    RUT_USUARIO: '',
    TELEFONO_USUARIO: '',
    CELULAR_USUARIO: '',
    CORREO_USUARIO: null,
    ESTADO_USUARIO: '',
    USUARIO: '',
    NOMBRE: '',
    APELLIDO_MATERNO: null,
    APELLIDO_PATERNO: '',
    RUT: '',
    TELEFONO: '',
    CELULAR: '',
    CORREO: null,
    ID_ROL: 0,
    NOMBRE_ROL: '',
    CODI_GRUPO_BASE_ROL: null,
    ID_PERFIL: 0,
    CODI_GRUPO_BASE_PERFIL: ' ',
    NOMBRE_PERFIL: '',
    ESTADO: '',
    ID_EMPRESA: 0,
    NOMBRE_EMPRESA: '',
    ID_AREA: 0,
    NOMBRE_AREA: '',
    PASSWORD_USUARIO: '',
    PASSWORD: '',
    OBSERVACION_USUARIO: null,
    auth: false,
    lastLogIn: null
  })
})
