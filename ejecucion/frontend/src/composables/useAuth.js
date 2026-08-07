import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '961053663096-s2a3uhics25fg1h0b20ocmqlqi3tvvdu.apps.googleusercontent.com'
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8086/api'

export function useAuth() {
  const router = useRouter()
  const loading = ref(false)
  const error = ref('')
  const googleBtnRef = ref(null)

  const email = ref('')
  const password = ref('')

  const loginInterno = async () => {
    try {
      loading.value = true
      error.value = ''
      
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: email.value,
        password: password.value
      })
      
      handleLoginSuccess(res.data)
    } catch (err) {
      console.error('Error Login:', err)
      error.value = err.response?.data?.error || 'Credenciales inválidas'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    // Inicializar Google Sign-In
    const waitForGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse
        })
        if (googleBtnRef.value) {
          renderGoogleButton()
        }
      } else {
        setTimeout(waitForGoogle, 100)
      }
    }
    waitForGoogle()
  })

  const renderGoogleButton = () => {
    if (window.google?.accounts?.id && googleBtnRef.value) {
      googleBtnRef.value.innerHTML = ''
      window.google.accounts.id.renderButton(googleBtnRef.value, {
        theme: 'outline',
        size: 'large',
        width: 380,
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      })
    }
  }

  const handleGoogleResponse = async (response) => {
    try {
      loading.value = true
      error.value = ''
      
      const res = await axios.post(`${API_URL}/auth/login-google`, { 
        token: response.credential 
      })
      
      handleLoginSuccess(res.data)
    } catch (err) {
      console.error('Error Google Login:', err)
      error.value = err.response?.data?.error || err.response?.data?.message || 'Error al iniciar sesión con Google'
    } finally {
      loading.value = false
    }
  }

  const handleLoginSuccess = (data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    
    const isEnrolPending = data.user?.flag_proc_enrol === true || data.user?.flag_proc_enrol === 't' || data.user?.flag_proc_enrol === 1
    if (isEnrolPending) {
      router.push({ name: 'enrolamiento' })
    } else {
      router.push('/')
    }
  }

  return {
    email,
    password,
    loading,
    error,
    googleBtnRef,
    loginInterno,
    renderGoogleButton
  }
}

