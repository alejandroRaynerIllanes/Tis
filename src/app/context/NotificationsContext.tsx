import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode
} from 'react'

export interface AppNotification {
  id: string
  title: string
  message: string
  time: Date
  read: boolean
  type: 'success' | 'warning'
  meta?: {
    pedidoId?: string
    tableId?: string
    actionType?: 'deliver_order' | 'process_payment'
  }
}

interface NotificationsContextType {
  notifications: AppNotification[]
  addNotification: (notification: Omit<AppNotification, 'id' | 'time' | 'read'>) => boolean
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  // Ref to always hold the latest value of notifications to avoid stale closures in listeners
  const notificationsRef = useRef<AppNotification[]>([])
  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

  const addNotification = useCallback(
    (notification: Omit<AppNotification, 'id' | 'time' | 'read'>): boolean => {
      const prev = notificationsRef.current

      // Prevent duplicates for 'Cuenta Solicitada'
      if (notification.title === 'Cuenta Solicitada' && notification.meta?.tableId) {
        if (
          prev.some(
            (n) =>
              !n.read &&
              n.meta?.tableId === notification.meta?.tableId &&
              n.title === 'Cuenta Solicitada'
          )
        ) {
          return false
        }
      }

      // Prevent duplicates for 'Pedido Listo'
      if (notification.title === 'Pedido Listo' && notification.meta?.pedidoId) {
        if (
          prev.some(
            (n) => n.meta?.pedidoId === notification.meta?.pedidoId && n.title === 'Pedido Listo'
          )
        ) {
          return false
        }
      }

      const newNotification: AppNotification = {
        ...notification,
        id: Date.now().toString() + Math.random(),
        time: new Date(),
        read: false
      }

      setNotifications((prevList) => [newNotification, ...prevList])
      return true
    },
    []
  )

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const value = {
    notifications,
    addNotification,
    markNotificationAsRead,
    clearNotifications
  }

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
