<template>
  <div class="pdf-wrapper">
    <!-- Loader -->
    <div v-if="loading" class="loader-container">
      <v-progress-circular indeterminate color="primary" size="48" />
      <div class="mt-2">Cargando documento…</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-msg">
      <v-icon color="red" icon="mdi-alert" class="mr-2" />
      {{ error }}
    </div>

    <!-- PDF -->
    <div v-else class="pdf-container">
      <div class="pdf-actions">
        <v-btn
          color="primary"
          variant="elevated"
          size="small"
          :href="pdfBlobUrl"
          target="_blank"
        >
          <v-icon start icon="mdi-open-in-new" />
          Ver PDF en pantalla completa / Otra pestaña
        </v-btn>
      </div>
      <object
        :data="pdfBlobUrl"
        type="application/pdf"
        class="pdf-object"
      >
        <div class="pdf-fallback-container">
          <v-icon color="amber-darken-3" icon="mdi-file-pdf-box" size="64" />
          <div class="my-3 text-subtitle-1">Tu dispositivo no admite vista previa integrada.</div>
          <v-btn color="primary" :href="pdfBlobUrl" target="_blank">
            <v-icon start icon="mdi-open-in-new" />
            Ver Documento
          </v-btn>
        </div>
      </object>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    default: null, // por si necesitas Authorization
  },
});

const loading = ref(true);
const error = ref(null);
const pdfBlobUrl = ref(null);

// 🔥 Descarga el PDF como BLOB para evitar X-Frame-Options
async function cargarPDF() {
  loading.value = true;
  error.value = null;
  pdfBlobUrl.value = null;

  try {
    const res = await fetch(props.url, {
      method: "GET",
      headers: {
        ...(props.token ? { Authorization: `Bearer ${props.token}` } : {}),
      },
    });

    if (!res.ok) throw new Error(`Error al cargar PDF (${res.status})`);

    const blob = await res.blob();
    pdfBlobUrl.value = URL.createObjectURL(blob);
  } catch (e) {
    error.value = "No se pudo cargar el documento.";
    console.error("Error cargando PDF:", e);
  } finally {
    loading.value = false;
  }
}

onMounted(cargarPDF);

// Si cambia la URL del PDF, lo recarga automáticamente
watch(() => props.url, cargarPDF);
</script>

<style scoped>
.pdf-wrapper {
  width: 100%;
  height: 100vh;
  position: relative;
  background: #f5f5f5;
}

.pdf-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.pdf-actions {
  padding: 10px;
  background: #eceff1;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid #cfd8dc;
}

.pdf-object {
  flex-grow: 1;
  width: 100%;
  height: calc(100% - 54px);
  border: none;
}

.pdf-fallback-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  text-align: center;
  height: 100%;
  background: #fafafa;
}

.loader-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.error-msg {
  padding: 20px;
  color: #d32f2f;
  display: flex;
  align-items: center;
}
</style>
