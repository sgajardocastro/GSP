<template>
  <div class="w-full mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>
    
    <div class="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white relative">
      <!-- Clear button -->
      <button 
        @click.prevent="clear" 
        class="absolute top-2 right-2 bg-gray-100 hover:bg-gray-200 text-gray-700 p-1 rounded-md text-xs z-10 font-medium transition-colors"
      >
        Limpiar
      </button>

      <!-- Signature canvas -->
      <canvas 
        ref="canvas" 
        class="w-full h-48 cursor-crosshair touch-none"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart.prevent="startDrawing"
        @touchmove.prevent="draw"
        @touchend.prevent="stopDrawing"
      ></canvas>

      <!-- Placeholder / Instructions -->
      <div v-if="!hasDrawn && !modelValue" class="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-400">
        Firme aquí
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Firma'
  }
})

const emit = defineEmits(['update:modelValue'])

const canvas = ref(null)
const ctx = ref(null)
const isDrawing = ref(false)
const hasDrawn = ref(false)
const lastPos = ref({ x: 0, y: 0 })

const getCoordinates = (e) => {
  const rect = canvas.value.getBoundingClientRect()
  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height

  if (e.touches && e.touches.length > 0) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    }
  }
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  }
}

const startDrawing = (e) => {
  isDrawing.value = true
  hasDrawn.value = true
  lastPos.value = getCoordinates(e)
}

const draw = (e) => {
  if (!isDrawing.value) return

  const currentPos = getCoordinates(e)
  
  if (ctx.value) {
    ctx.value.beginPath()
    ctx.value.moveTo(lastPos.value.x, lastPos.value.y)
    ctx.value.lineTo(currentPos.x, currentPos.y)
    ctx.value.strokeStyle = '#000000'
    ctx.value.lineWidth = 2
    ctx.value.lineCap = 'round'
    ctx.value.stroke()
  }
  
  lastPos.value = currentPos
}

const stopDrawing = () => {
  if (isDrawing.value) {
    isDrawing.value = false
    emitUpdate()
  }
}

const clear = () => {
  if (ctx.value && canvas.value) {
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    hasDrawn.value = false
    emit('update:modelValue', '')
  }
}

const emitUpdate = () => {
  if (canvas.value) {
    const dataUrl = canvas.value.toDataURL('image/png')
    emit('update:modelValue', dataUrl)
  }
}

const resizeCanvas = () => {
  if (canvas.value) {
    const rect = canvas.value.parentElement.getBoundingClientRect()
    // Make canvas actual size match the visual size for 1:1 drawing
    canvas.value.width = rect.width
    canvas.value.height = 192 // h-48 = 192px
    if (ctx.value) {
      ctx.value.lineWidth = 2
      ctx.value.lineCap = 'round'
    }
    // Repaint existing signature if available
    if (props.modelValue) {
      const img = new Image()
      img.onload = () => {
        ctx.value.drawImage(img, 0, 0, canvas.value.width, canvas.value.height)
        hasDrawn.value = true
      }
      img.src = props.modelValue
    }
  }
}

onMounted(() => {
  ctx.value = canvas.value.getContext('2d')
  window.addEventListener('resize', resizeCanvas)
  // Slight delay to ensure DOM is fully rendered
  setTimeout(resizeCanvas, 100)
})

watch(() => props.modelValue, (newVal) => {
  if (!newVal && hasDrawn.value) {
    clear()
  }
})
</script>
