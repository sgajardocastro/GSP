<template>
  <v-dialog
    v-model="internalModel"
    max-width="480"
  >
    <v-card>
      <v-card-title class="text-h6">
        Cambiar contrasena FES
      </v-card-title>

      <v-card-text>
        Ingresa tu nueva clave FES de 4 digitos y confirma.
      </v-card-text>

      <v-card-text>
        <div class="mb-2">
          Nueva FES
        </div>
        <v-otp-input
          v-model="nuevaFes"
          length="4"
          type="password"
          inputmode="numeric"
          class="fes-otp-mask"
        />

        <div class="mt-4 mb-2">
          Confirmar FES
        </div>
        <v-otp-input
          v-model="confirmarFes"
          length="4"
          type="password"
          inputmode="numeric"
          class="fes-otp-mask"
        />

        <v-alert
          v-if="error"
          type="error"
          density="compact"
          class="mt-4"
        >
          {{ error }}
        </v-alert>

        <v-alert
          v-if="exito"
          type="success"
          density="compact"
          class="mt-4"
        >
          {{ exito }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn
          variant="text"
          @click="cerrar"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          @click="guardar"
        >
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import apiAxios from '@/services/api'
import { useUserDetailStore } from '@/store/userDetail'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'fes-cambiada'])
const userDetailStore = useUserDetailStore()

const internalModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const nuevaFes = ref('')
const confirmarFes = ref('')
const loading = ref(false)
const error = ref('')
const exito = ref('')

watch(internalModel, (val) => {
  if (val) {
    nuevaFes.value = ''
    confirmarFes.value = ''
    error.value = ''
    exito.value = ''
  }
})

async function hashSHA256 (texto) {
  const encoder = new TextEncoder()
  const data = encoder.encode(texto)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const cerrar = () => {
  internalModel.value = false
}

const guardar = async () => {
  error.value = ''
  exito.value = ''

  if (!nuevaFes.value || !confirmarFes.value) {
    error.value = 'Debes ingresar y confirmar tu nueva FES.'
    return
  }

  if (nuevaFes.value.length !== 4 || confirmarFes.value.length !== 4) {
    error.value = 'La FES debe tener 4 digitos.'
    return
  }

  if (nuevaFes.value !== confirmarFes.value) {
    error.value = 'Las FES no coinciden.'
    return
  }

  try {
    loading.value = true
    const hash = await hashSHA256(nuevaFes.value)

    await apiAxios.put('/usuarios/updPassFes', {
      id_user: userDetailStore.userDetail.id_user,
      pass_fes: hash
    })

    exito.value = 'Contrasena FES actualizada correctamente.'
    emit('fes-cambiada')
    internalModel.value = false
  } catch (e) {
    console.error('Error al actualizar FES:', e)
    error.value = e?.response?.data?.error || 'No se pudo actualizar la FES.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fes-otp-mask :deep(input) {
  -webkit-text-security: disc;
  text-security: disc;
}
</style>
