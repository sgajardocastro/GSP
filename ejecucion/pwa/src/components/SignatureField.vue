<template>
  <div class="w-full mb-4 my-3">
    <label class="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
      ✍️ {{ label || 'FIRMA DEL CLIENTE' }}
    </label>
    
    <div ref="containerRef" class="border-2 border-dashed border-amber-500/50 rounded-xl overflow-hidden bg-white relative shadow-lg" style="min-height: 180px;">
      <!-- Clear button -->
      <button 
        @click.prevent="clear" 
        type="button"
        class="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-xs z-10 font-bold transition-all shadow-md flex items-center gap-1"
      >
        <span>🗑️ Limpiar Firma</span>
      </button>

      <!-- Signature canvas -->
      <canvas 
        ref="canvas" 
        class="w-full h-44 cursor-crosshair touch-none bg-white block"
        style="background-color: #ffffff !important; min-height: 170px;"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart.prevent="startDrawing"
        @touchmove.prevent="draw"
        @touchend.prevent="stopDrawing"
      ></canvas>

      <!-- Placeholder / Instructions -->
      <div v-if="!hasDrawn && !modelValue" class="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 font-semibold text-xs uppercase tracking-wider">
        ✍️ Dibuje o trace su firma aquí
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'FIRMA DEL CLIENTE'
  }
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const canvas = ref(null)
const ctx = ref(null)
const isDrawing = ref(false)
const hasDrawn = ref(false)
const lastPos = ref({ x: 0, y: 0 })
let resizeObserver = null

const getCoordinates = (e) => {
  if (!canvas.value) return { x: 0, y: 0 }
  const rect = canvas.value.getBoundingClientRect()
  const scaleX = canvas.value.width / (rect.width || 1)
  const scaleY = canvas.value.height / (rect.height || 1)

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
  if (canvas.value && canvas.value.width < 100) {
    resizeCanvas()
  }
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
    ctx.value.strokeStyle = '#0f172a'
    ctx.value.lineWidth = 3
    ctx.value.lineCap = 'round'
    ctx.value.lineJoin = 'round'
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
  if (canvas.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    const targetWidth = rect.width > 50 ? rect.width : (window.innerWidth ? window.innerWidth - 40 : 350)
    
    if (canvas.value.width !== targetWidth) {
      canvas.value.width = targetWidth
      canvas.value.height = 180
      
      if (ctx.value) {
        ctx.value.lineWidth = 3
        ctx.value.lineCap = 'round'
        ctx.value.lineJoin = 'round'
        ctx.value.strokeStyle = '#0f172a'
      }

      if (props.modelValue) {
        const img = new Image()
        img.onload = () => {
          if (ctx.value) ctx.value.drawImage(img, 0, 0, canvas.value.width, canvas.value.height)
          hasDrawn.value = true
        }
        img.src = props.modelValue
      }
    }
  }
}

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext('2d')
  }
  
  nextTick(() => {
    resizeCanvas()
    setTimeout(resizeCanvas, 300)
    setTimeout(resizeCanvas, 1000)
  })

  if (window.ResizeObserver && containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })
    resizeObserver.observe(containerRef.value)
  }

  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  }
})

watch(() => props.modelValue, (newVal) => {
  if (!newVal && hasDrawn.value) {
    clear()
  } else if (newVal && !hasDrawn.value) {
    resizeCanvas()
  }
})
</script>
