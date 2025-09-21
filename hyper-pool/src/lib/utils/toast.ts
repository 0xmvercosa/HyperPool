import hotToast from 'react-hot-toast'

// Configure react-hot-toast with our theme
export const toast = {
  success: (message: string) => {
    hotToast.success(message, {
      style: {
        background: '#10b981',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
    })
  },

  error: (message: string) => {
    hotToast.error(message, {
      style: {
        background: '#ef4444',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
    })
  },

  info: (message: string) => {
    hotToast(message, {
      style: {
        background: '#3b82f6',
        color: '#fff',
      },
      icon: 'ℹ️',
    })
  },

  warning: (message: string) => {
    hotToast(message, {
      style: {
        background: '#f59e0b',
        color: '#000',
      },
      icon: '⚠️',
    })
  },

  loading: (message: string) => {
    return hotToast.loading(message, {
      style: {
        background: '#1a1a1a',
        color: '#fff',
      },
    })
  },

  dismiss: (toastId?: string) => {
    if (toastId) {
      hotToast.dismiss(toastId)
    } else {
      hotToast.dismiss()
    }
  },

  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((err: any) => string)
    }
  ) => {
    return hotToast.promise(
      promise,
      {
        loading: msgs.loading,
        success: msgs.success,
        error: msgs.error,
      },
      {
        style: {
          background: '#1a1a1a',
          color: '#fff',
        },
      }
    )
  },
}