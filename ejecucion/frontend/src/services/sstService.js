import axios from 'axios'

// Instancia dedicada para el nuevo backend de Transmac SST
const apiSST = axios.create({
  baseURL: 'http://138.255.103.18:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export const getInstrumentos = async () => {
  const response = await apiSST.get('/instrumentos')
  return response.data
}

export const getPautas = async (idInstrumento) => {
  const response = await apiSST.get(`/instrumentos/${idInstrumento}/pautas`)
  return response.data
}

export const saveEvaluacion = async (evaluacion) => {
  const response = await apiSST.post('/evaluaciones', evaluacion)
  return response.data
}

export const getSigoStats = async () => {
    const response = await apiSST.get('/instrumentos/4/stats')
    return response.data
}
