import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface Message {
  id: number
  sender_id: number
  receiver_id: number
  content: string
  is_read: boolean
  created_at: string
  sender_username?: string
}

interface UseSocketOptions {
  userId: number | string
  onMessage?: (message: Message) => void
  onUserStatus?: (data: { userId: number; online: boolean }) => void
  onTyping?: (data: { userId: number; typing: boolean }) => void
  onMessagesRead?: (data: { userId: number; friendId: number }) => void
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD ? 'https://booleanclient.ru' : 'http://localhost:8080')

export function useSocket({ userId, onMessage, onUserStatus, onTyping, onMessagesRead }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!userId) return

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Connected')
      setConnected(true)
      socket.emit('user:online', userId)
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
      setConnected(false)
    })

    socket.on('message:new', (message: Message) => {
      onMessage?.(message)
    })

    socket.on('user:status', (data: { userId: number; online: boolean }) => {
      onUserStatus?.(data)
    })

    socket.on('typing:start', (data: { userId: number }) => {
      onTyping?.({ userId: data.userId, typing: true })
    })

    socket.on('typing:stop', (data: { userId: number }) => {
      onTyping?.({ userId: data.userId, typing: false })
    })

    socket.on('message:read', (data: { userId: number; friendId: number }) => {
      onMessagesRead?.(data)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId])

  const sendMessage = useCallback((receiverId: number, content: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message:send', {
        senderId: userId,
        receiverId,
        content
      })
    }
  }, [userId])

  const markAsRead = useCallback((friendId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message:read', { userId, friendId })
    }
  }, [userId])

  const startTyping = useCallback((receiverId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:start', { senderId: userId, receiverId })
    }
  }, [userId])

  const stopTyping = useCallback((receiverId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:stop', { senderId: userId, receiverId })
    }
  }, [userId])

  return {
    connected,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping
  }
}
