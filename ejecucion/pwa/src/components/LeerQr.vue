<template>
  <div>
    <QrStream @decode="onDecode" @init="onInit" :paused="paused" />

    <div v-if="qrResult">
      <p>QR leído:</p>
      <strong>{{ qrResult }}</strong>
    </div>

    <v-btn @click="paused = !paused">
      {{ paused ? 'Reanudar' : 'Pausar' }} cámara
    </v-btn>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { QrStream } from 'vue3-qr-reader'

const qrResult = ref('')
const paused = ref(false)

function onDecode(result) {
  qrResult.value = result

  try {
    const url = new URL(result)
    const segmentos = url.pathname.split('/')
    const ultimo = segmentos.pop() || '' // por si termina en "/"
    console.log('Último segmento del QR:', ultimo)
  } catch (e) {
    console.error('No es una URL válida:', e)
  }

  paused.value = true // Detiene la cámara después de leer
}

function onInit(promise) {
  promise
    .then(() => console.log('Cámara iniciada correctamente'))
    .catch(error => console.error('Error al iniciar la cámara:', error))
}
</script>
