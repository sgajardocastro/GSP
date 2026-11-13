/**
 * Visor de Cámara WebRTC In-App Universal para PWA (Zero RAM Eviction en Android)
 * Evita invocar la aplicación nativa externa de cámara del sistema operativo Android
 * (que mata el proceso de Chrome en segundo plano por presión de memoria RAM).
 */

function comprimirImagenDesdeElemento(sourceEl, maxDimension = 1280, quality = 0.82) {
  const rawW = sourceEl.videoWidth || sourceEl.naturalWidth || sourceEl.width || 1280
  const rawH = sourceEl.videoHeight || sourceEl.naturalHeight || sourceEl.height || 960
  let width = rawW
  let height = rawH

  if (width > height) {
    if (width > maxDimension) {
      height = Math.round(height * (maxDimension / width))
      width = maxDimension
    }
  } else {
    if (height > maxDimension) {
      width = Math.round(width * (maxDimension / height))
      height = maxDimension
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(sourceEl, 0, 0, width, height)
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  return dataUrl
}

export function dataUrlToFile(dataUrl, filename = `foto_${Date.now()}.jpg`) {
  const arr = String(dataUrl || '').split(',')
  const mimeMatch = arr[0]?.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  const bstr = atob(arr[1] || '')
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime, lastModified: Date.now() })
}

export function leerArchivoComoDataUrlComprimido(file, maxDimension = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        try {
          const dataUrl = comprimirImagenDesdeElemento(img, maxDimension, quality)
          const compressedFile = dataUrlToFile(dataUrl, file.name || `foto_${Date.now()}.jpg`)
          resolve({ dataUrl, file: compressedFile })
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function abrirCamaraWebRTC(options = {}) {
  const titulo = options.titulo || 'Captura Fotográfica In-App'
  const maxDimension = Number(options.maxDimension) || 1280
  const quality = Number(options.quality) || 0.82

  return new Promise((resolve) => {
    let mediaStream = null
    let currentFacingMode = 'environment'
    let resuelto = false

    const detenerStream = () => {
      if (mediaStream) {
        try {
          mediaStream.getTracks().forEach((t) => t.stop())
        } catch (_) {
          // ignore stream stop error
        }
        mediaStream = null
      }
    }

    const finalizar = (resultado) => {
      if (resuelto) return
      resuelto = true
      detenerStream()
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay)
      }
      resolve(resultado || null)
    }

    // Crear DOM del modal In-App
    const overlay = document.createElement('div')
    overlay.setAttribute('data-gsp-inapp-camera', 'true')
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '999999',
      backgroundColor: 'rgba(2, 6, 23, 0.96)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#ffffff',
      userSelect: 'none'
    })

    // Header
    const header = document.createElement('div')
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      backgroundColor: '#0f172a',
      borderBottom: '1px solid #1e293b'
    })

    const titleBox = document.createElement('div')
    titleBox.innerHTML = `
      <div style="font-size:14px;font-weight:900;color:#fbbf24;letter-spacing:0.03em;">📸 ${titulo}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Cámara segura dentro de la aplicación (no reinicia tu formulario)</div>
    `

    const headerActions = document.createElement('div')
    Object.assign(headerActions.style, { display: 'flex', gap: '8px', alignItems: 'center' })

    const btnSwitch = document.createElement('button')
    btnSwitch.type = 'button'
    btnSwitch.textContent = '🔄 Girar'
    Object.assign(btnSwitch.style, {
      backgroundColor: '#1e293b',
      color: '#e2e8f0',
      border: '1px solid #334155',
      borderRadius: '10px',
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: '700',
      cursor: 'pointer'
    })

    const btnClose = document.createElement('button')
    btnClose.type = 'button'
    btnClose.textContent = '✕ Cerrar'
    Object.assign(btnClose.style, {
      backgroundColor: '#334155',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: '800',
      cursor: 'pointer'
    })
    btnClose.onclick = () => finalizar(null)

    headerActions.appendChild(btnSwitch)
    headerActions.appendChild(btnClose)
    header.appendChild(titleBox)
    header.appendChild(headerActions)

    // Cuerpo de video
    const body = document.createElement('div')
    Object.assign(body.style, {
      flex: '1',
      position: 'relative',
      backgroundColor: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    })

    const video = document.createElement('video')
    video.setAttribute('autoplay', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('muted', '')
    video.muted = true
    Object.assign(video.style, {
      width: '100%',
      height: '100%',
      maxHeight: '72vh',
      objectFit: 'contain',
      backgroundColor: '#000000'
    })

    const statusMsg = document.createElement('div')
    Object.assign(statusMsg.style, {
      position: 'absolute',
      inset: '0',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      color: '#f8fafc',
      fontSize: '14px',
      fontWeight: '600'
    })

    body.appendChild(video)
    body.appendChild(statusMsg)

    // Footer con botones de disparo y galería sin capture
    const footer = document.createElement('div')
    Object.assign(footer.style, {
      padding: '16px',
      backgroundColor: '#0f172a',
      borderTop: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    })

    const btnShutter = document.createElement('button')
    btnShutter.type = 'button'
    btnShutter.textContent = '📸 CAPTURAR FOTO AHORA'
    Object.assign(btnShutter.style, {
      width: '100%',
      padding: '16px',
      borderRadius: '14px',
      border: 'none',
      backgroundColor: '#10b981',
      color: '#022c22',
      fontSize: '16px',
      fontWeight: '900',
      letterSpacing: '0.03em',
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
    })

    const btnGallery = document.createElement('button')
    btnGallery.type = 'button'
    btnGallery.textContent = '🖼️ Adjuntar Imagen desde Galería / Archivos'
    Object.assign(btnGallery.style, {
      width: '100%',
      padding: '12px',
      borderRadius: '12px',
      border: '1px solid #334155',
      backgroundColor: '#1e293b',
      color: '#cbd5e1',
      fontSize: '13px',
      fontWeight: '700',
      cursor: 'pointer'
    })

    // Input oculto SIN atributo capture (abre selector liviano de archivos, no la app pesada de cámara)
    const galleryInput = document.createElement('input')
    galleryInput.type = 'file'
    galleryInput.accept = 'image/*'
    galleryInput.setAttribute('data-bypass-inapp', 'true')
    galleryInput.style.display = 'none'

    galleryInput.onchange = async (ev) => {
      const f = ev.target.files?.[0]
      if (!f) return
      try {
        const res = await leerArchivoComoDataUrlComprimido(f, maxDimension, quality)
        finalizar(res)
      } catch (err) {
        console.error('[InAppCamera] Error procesando imagen de galería:', err)
        finalizar(null)
      }
    }

    btnGallery.onclick = () => {
      galleryInput.value = ''
      galleryInput.click()
    }

    btnShutter.onclick = () => {
      if (!video.videoWidth || !video.videoHeight) {
        galleryInput.value = ''
        galleryInput.click()
        return
      }
      try {
        const dataUrl = comprimirImagenDesdeElemento(video, maxDimension, quality)
        const file = dataUrlToFile(dataUrl, `captura_${Date.now()}.jpg`)
        finalizar({ dataUrl, file })
      } catch (err) {
        console.error('[InAppCamera] Error capturando frame:', err)
        galleryInput.value = ''
        galleryInput.click()
      }
    }

    footer.appendChild(btnShutter)
    footer.appendChild(btnGallery)
    footer.appendChild(galleryInput)

    overlay.appendChild(header)
    overlay.appendChild(body)
    overlay.appendChild(footer)
    document.body.appendChild(overlay)

    const iniciarCamara = async (facingMode) => {
      detenerStream()
      statusMsg.style.display = 'none'
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusMsg.style.display = 'flex'
        statusMsg.innerHTML = `
          <div style="font-size:28px;margin-bottom:8px;">📷</div>
          <div>Tu navegador no permite cámara directa en esta pestaña.</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:6px;">Pulsa el botón inferior para elegir una imagen de tu galería.</div>
        `
        btnShutter.style.display = 'none'
        return
      }
      try {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 960 }
            },
            audio: false
          })
        } catch (_) {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          })
        }
        video.srcObject = mediaStream
        await video.play().catch(() => {})
        btnShutter.style.display = 'block'
      } catch (err) {
        console.warn('[InAppCamera] No se pudo iniciar getUserMedia:', err)
        statusMsg.style.display = 'flex'
        statusMsg.innerHTML = `
          <div style="font-size:28px;margin-bottom:8px;">🔒</div>
          <div>Permiso de cámara bloqueado o cámara ocupada.</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:6px;">Usa el botón "Adjuntar Imagen desde Galería" aquí abajo.</div>
        `
        btnShutter.style.display = 'none'
      }
    }

    btnSwitch.onclick = () => {
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment'
      iniciarCamara(currentFacingMode)
    }

    iniciarCamara(currentFacingMode)
  })
}

let interceptorInstalado = false

/**
 * Interceptor global que protege TODOS los <input type="file" capture="..."> de la PWA
 * para que ninguno abra la cámara nativa externa de Android ni mate la pestaña por RAM.
 */
export function instalarInterceptorGlobalCamaraInApp() {
  if (interceptorInstalado || typeof window === 'undefined' || typeof HTMLInputElement === 'undefined') return
  interceptorInstalado = true

  const esInputCamaraInterceptable = (el) => {
    if (!el || el.tagName !== 'INPUT' || el.type !== 'file') return false
    if (el.getAttribute('data-bypass-inapp') === 'true') return false
    const accept = String(el.getAttribute('accept') || el.accept || '').toLowerCase()
    const tieneCapture = el.hasAttribute('capture') || Boolean(el.capture)
    return tieneCapture && (accept.includes('image') || accept === '')
  }

  const ejecutarCapturaParaInput = async (inputEl) => {
    // Quitar atributo capture para que nunca dispare cámara nativa del SO
    inputEl.removeAttribute('capture')
    const resultado = await abrirCamaraWebRTC({
      titulo: 'Tomar Fotografía'
    })
    if (!resultado || !resultado.file) return
    try {
      const dt = new DataTransfer()
      dt.items.add(resultado.file)
      inputEl.files = dt.files
      inputEl.dispatchEvent(new Event('change', { bubbles: true }))
    } catch (err) {
      console.error('[InAppCamera] Error inyectando archivo capturado en input:', err)
    }
  }

  // 1. Interceptar llamadas programáticas input.click()
  const originalClick = HTMLInputElement.prototype.click
  HTMLInputElement.prototype.click = function (...args) {
    if (esInputCamaraInterceptable(this)) {
      ejecutarCapturaParaInput(this)
      return
    }
    return originalClick.apply(this, args)
  }

  // 2. Interceptar clics directos o vía <label for="..."> en fase de captura
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target
      if (esInputCamaraInterceptable(target)) {
        event.preventDefault()
        event.stopPropagation()
        ejecutarCapturaParaInput(target)
      }
    },
    true
  )
}
