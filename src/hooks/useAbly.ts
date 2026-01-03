import { useEffect, useRef, useCallback, useState } from 'react'
import * as Ably from 'ably'

interface Message {
  id: number
  sender_id: number
  receiver_id: number
  content: string
  is_read: boolean
  created_at: string
  sender_username?: string
}

interface UseAblyOptions {
  userId: number | string
  onMessage?: (message: Message) => void
  onUserStatus?: (data: { userId: number; online: boolean }) => void
  onTyping?: (data: { userId: number; typing: boolean }) => void
  onMessagesRead?: (data: { userId: number; friendId: number }) => void
}

export function useAbly({ userId, onMessage, onUserStatus, onTyping, onMessagesRead }: UseAblyOptions) {
  const ablyRef = useRef<Ably.Realtime | null>(null)
  const userChannelRef = useRef<Ably.RealtimeChannel | null>(null)
  const presenceChannelRef = useRef<Ably.RealtimeChannel | null>(null)
  const [connected, setConnected] = useState(false)
  
  // Store callbacks in refs to avoid stale closures
  const onMessageRef = useRef(onMessage)
  const onUserStatusRef = useRef(onUserStatus)
  const onTypingRef = useRef(onTyping)
  const onMessagesReadRef = useRef(onMessagesRead)
  
  // Keep refs updated with latest callbacks
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])
  
  useEffect(() => {
    onUserStatusRef.current = onUserStatus
  }, [onUserStatus])
  
  useEffect(() => {
    onTypingRef.current = onTyping
  }, [onTyping])
  
  useEffect(() => {
    onMessagesReadRef.current = onMessagesRead
  }, [onMessagesRead])

  useEffect(() => {
    if (!userId) return

    const initAbly = async () => {
      try {
        const ably = new Ably.Realtime({
          authUrl: `/api/ably-token?clientId=${userId}`,
          clientId: String(userId),
        })

        ablyRef.current = ably

        ably.connection.on('connected', () => {
          console.log('[Ably] Connected')
          setConnected(true)
        })

        ably.connection.on('disconnected', () => {
          console.log('[Ably] Disconnected')
          setConnected(false)
        })

        ably.connection.on('failed', (err) => {
          console.error('[Ably] Connection failed:', err)
          setConnected(false)
        })

        // Personal channel for receiving messages
        const userChannel = ably.channels.get(`user:${userId}`)
        userChannelRef.current = userChannel

        userChannel.subscribe('message', (msg) => {
          onMessageRef.current?.(msg.data as Message)
        })

        userChannel.subscribe('typing', (msg) => {
          onTypingRef.current?.(msg.data as { userId: number; typing: boolean })
        })

        userChannel.subscribe('read', (msg) => {
          onMessagesReadRef.current?.(msg.data as { userId: number; friendId: number })
        })

        // Global presence channel
        const presenceChannel = ably.channels.get('presence:global')
        presenceChannelRef.current = presenceChannel

        await presenceChannel.presence.enter({ odId: userId })

        presenceChannel.presence.subscribe('enter', (member) => {
          onUserStatusRef.current?.({ userId: Number(member.clientId), online: true })
        })

        presenceChannel.presence.subscribe('leave', (member) => {
          onUserStatusRef.current?.({ userId: Number(member.clientId), online: false })
        })

        // Get initial presence
        const members = await presenceChannel.presence.get()
        members.forEach((member) => {
          if (member.clientId !== String(userId)) {
            onUserStatusRef.current?.({ userId: Number(member.clientId), online: true })
          }
        })

      } catch (error) {
        console.error('[Ably] Init error:', error)
      }
    }

    initAbly()

    return () => {
      presenceChannelRef.current?.presence.leave()
      ablyRef.current?.close()
      ablyRef.current = null
      userChannelRef.current = null
      presenceChannelRef.current = null
    }
  }, [userId])

  const sendMessage = useCallback(async (receiverId: number, content: string) => {
    if (!ablyRef.current || !userId) return

    try {
      // Save to DB via API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userId,
          receiverId,
          content: content.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const message = data.data
        
        // Send to receiver via Ably
        const receiverChannel = ablyRef.current.channels.get(`user:${receiverId}`)
        await receiverChannel.publish('message', message)
        
        // Also trigger local callback for sender
        onMessage?.(message)
      }
    } catch (error) {
      console.error('[Ably] Send message error:', error)
    }
  }, [userId, onMessage])

  const markAsRead = useCallback(async (friendId: number) => {
    if (!ablyRef.current || !userId) return

    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, friendId })
      })

      // Notify friend that messages were read
      const friendChannel = ablyRef.current.channels.get(`user:${friendId}`)
      await friendChannel.publish('read', { userId: Number(userId), friendId })
    } catch (error) {
      console.error('[Ably] Mark as read error:', error)
    }
  }, [userId])

  const startTyping = useCallback(async (receiverId: number) => {
    if (!ablyRef.current) return

    try {
      const receiverChannel = ablyRef.current.channels.get(`user:${receiverId}`)
      await receiverChannel.publish('typing', { userId: Number(userId), typing: true })
    } catch (error) {
      console.error('[Ably] Typing error:', error)
    }
  }, [userId])

  const stopTyping = useCallback(async (receiverId: number) => {
    if (!ablyRef.current) return

    try {
      const receiverChannel = ablyRef.current.channels.get(`user:${receiverId}`)
      await receiverChannel.publish('typing', { userId: Number(userId), typing: false })
    } catch (error) {
      console.error('[Ably] Stop typing error:', error)
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
