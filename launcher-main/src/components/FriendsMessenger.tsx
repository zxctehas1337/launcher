import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import type { User } from '../types'
import { fetch } from '@tauri-apps/plugin-http'
import { useAbly } from '../hooks/useAbly'
import '../styles/FriendsMessenger.css'

const API_URL = 'https://booleanclient.ru'

interface Friend {
  id: number
  status: 'pending' | 'accepted'
  friend_user_id: number
  friend_username: string
  friend_avatar: string | null
  friend_last_active: string | null
  request_direction: 'incoming' | 'outgoing'
  isOnline?: boolean
}

interface Message {
  id: number
  sender_id: number
  receiver_id: number
  content: string
  is_read: boolean
  created_at: string
  sender_username?: string
}

interface UnreadData {
  byUser: { sender_id: number; unread_count: string }[]
  total: number
}

interface FriendsMessengerProps {
  user: User
}

function getAvatarUrl(avatar: string | null | undefined): string {
  if (avatar && avatar.startsWith('data:')) return avatar
  if (avatar && avatar.startsWith('http')) return avatar
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${avatar || 'default'}`
}

export default function FriendsMessenger({ user }: FriendsMessengerProps) {
  const { t } = useLanguage()
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [friendInput, setFriendInput] = useState('')
  const [unreadData, setUnreadData] = useState<UnreadData>({ byUser: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle incoming message
  const handleMessage = useCallback((message: Message) => {
    if (selectedFriend && 
        (message.sender_id === selectedFriend.friend_user_id || 
         message.receiver_id === selectedFriend.friend_user_id)) {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev
        return [...prev, message]
      })
      if (message.sender_id === selectedFriend.friend_user_id) {
        markAsRead(selectedFriend.friend_user_id)
      }
    } else if (message.sender_id !== user.id) {
      setUnreadData(prev => {
        const existing = prev.byUser.find(u => u.sender_id === message.sender_id)
        if (existing) {
          return {
            ...prev,
            byUser: prev.byUser.map(u => 
              u.sender_id === message.sender_id 
                ? { ...u, unread_count: String(parseInt(u.unread_count) + 1) }
                : u
            ),
            total: prev.total + 1
          }
        }
        return {
          byUser: [...prev.byUser, { sender_id: message.sender_id, unread_count: '1' }],
          total: prev.total + 1
        }
      })
    }
  }, [selectedFriend, user.id])

  const handleUserStatus = useCallback((data: { userId: number; online: boolean }) => {
    setFriends(prev => prev.map(f => 
      f.friend_user_id === data.userId 
        ? { ...f, isOnline: data.online }
        : f
    ))
  }, [])

  const handleTyping = useCallback((data: { userId: number; typing: boolean }) => {
    setTypingUsers(prev => {
      const next = new Set(prev)
      if (data.typing) {
        next.add(data.userId)
      } else {
        next.delete(data.userId)
      }
      return next
    })
  }, [])

  const { connected, sendMessage: ablySendMessage, markAsRead, startTyping, stopTyping } = useAbly({
    userId: user.id,
    onMessage: handleMessage,
    onUserStatus: handleUserStatus,
    onTyping: handleTyping
  })

  const fetchFriends = async () => {
    try {
      const response = await fetch(`${API_URL}/api/friends?userId=${user.id}`)
      const data = await response.json()
      if (data.success) {
        setFriends(data.data)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    }
  }

  const fetchUnread = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages/unread?userId=${user.id}`)
      const data = await response.json()
      if (data.success) {
        setUnreadData(data.data)
      }
    } catch (error) {
      console.error('Error fetching unread:', error)
    }
  }

  const fetchMessages = async (friendId: number, shouldMarkAsRead = true) => {
    try {
      const response = await fetch(`${API_URL}/api/messages?userId=${user.id}&friendId=${friendId}`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.data)
        if (shouldMarkAsRead) {
          setUnreadData(prev => ({
            ...prev,
            byUser: prev.byUser.filter(u => u.sender_id !== friendId),
            total: Math.max(0, prev.total - (prev.byUser.find(u => u.sender_id === friendId)?.unread_count ? parseInt(prev.byUser.find(u => u.sender_id === friendId)!.unread_count) : 0))
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedFriend) return

    const content = messageInput.trim()
    setMessageInput('')

    if (connected) {
      ablySendMessage(selectedFriend.friend_user_id, content)
    } else {
      try {
        const response = await fetch(`${API_URL}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: user.id,
            receiverId: selectedFriend.friend_user_id,
            content
          })
        })
        const data = await response.json()
        if (data.success) {
          setMessages(prev => [...prev, { ...data.data, sender_username: user.username }])
        }
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value)
    
    if (selectedFriend && connected) {
      startTyping(selectedFriend.friend_user_id)
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (selectedFriend) {
          stopTyping(selectedFriend.friend_user_id)
        }
      }, 2000)
    }
  }

  const addFriend = async () => {
    if (!friendInput.trim()) return
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          friendUsername: friendInput.trim()
        })
      })
      const data = await response.json()
      if (data.success) {
        setFriendInput('')
        fetchFriends()
      }
    } catch (error) {
      console.error('Error adding friend:', error)
    } finally {
      setLoading(false)
    }
  }

  const acceptFriend = async (friendshipId: number) => {
    try {
      await fetch(`${API_URL}/api/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'accept',
          friendshipId
        })
      })
      fetchFriends()
    } catch (error) {
      console.error('Error accepting friend:', error)
    }
  }

  const rejectFriend = async (friendshipId: number) => {
    try {
      await fetch(`${API_URL}/api/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'reject',
          friendshipId
        })
      })
      fetchFriends()
    } catch (error) {
      console.error('Error rejecting friend:', error)
    }
  }

  const removeFriend = async (friendshipId: number) => {
    try {
      await fetch(`${API_URL}/api/friends`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendshipId,
          userId: user.id
        })
      })
      setSelectedFriend(null)
      fetchFriends()
    } catch (error) {
      console.error('Error removing friend:', error)
    }
  }

  const isOnline = (friend: Friend) => {
    if (friend.isOnline !== undefined) return friend.isOnline
    if (!friend.friend_last_active) return false
    const diff = Date.now() - new Date(friend.friend_last_active).getTime()
    return diff < 5 * 60 * 1000
  }

  const getUnreadCount = (friendId: number) => {
    const found = unreadData.byUser.find(u => u.sender_id === friendId)
    return found ? parseInt(found.unread_count) : 0
  }

  useEffect(() => {
    fetchFriends()
    fetchUnread()
    
    // Reduced polling - only for friend requests when Ably connected
    const interval = setInterval(() => {
      fetchFriends()
      if (!connected) {
        fetchUnread()
        if (selectedFriend) {
          fetchMessages(selectedFriend.friend_user_id, false)
        }
      }
    }, connected ? 30000 : 5000)

    return () => {
      clearInterval(interval)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [user.id, connected])

  useEffect(() => {
    if (selectedFriend) {
      fetchMessages(selectedFriend.friend_user_id, true)
    }
  }, [selectedFriend?.friend_user_id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const acceptedFriends = friends.filter(f => f.status === 'accepted')
  const pendingRequests = friends.filter(f => f.status === 'pending' && f.request_direction === 'incoming')
  const pendingOutgoing = friends.filter(f => f.status === 'pending' && f.request_direction === 'outgoing')

  return (
    <div className="messenger-page">
      <div className="messenger-container">
        {/* Sidebar - Friends List */}
        <div className="messenger-sidebar">
          {/* Add Friend */}
          <div className="messenger-add-friend">
            <input
              type="text"
              value={friendInput}
              onChange={(e) => setFriendInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFriend()}
              placeholder={t('messenger.enterNickname')}
              className="messenger-add-input"
            />
            <button 
              className="messenger-add-btn"
              onClick={addFriend}
              disabled={!friendInput.trim() || loading}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </button>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="messenger-section">
              <div className="messenger-section-title">
                {t('messenger.requests')} ({pendingRequests.length})
              </div>
              {pendingRequests.map(friend => (
                <div key={friend.id} className="messenger-friend-item pending">
                  <img 
                    src={getAvatarUrl(friend.friend_avatar)} 
                    alt={friend.friend_username}
                    className="messenger-avatar"
                  />
                  <div className="messenger-friend-info">
                    <span className="messenger-friend-name">{friend.friend_username}</span>
                  </div>
                  <div className="messenger-friend-actions">
                    <button className="accept-btn" onClick={() => acceptFriend(friend.id)}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </button>
                    <button className="reject-btn" onClick={() => rejectFriend(friend.id)}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Friends */}
          {acceptedFriends.length > 0 && (
            <div className="messenger-section">
              <div className="messenger-section-title">
                {t('messenger.friends')} ({acceptedFriends.length})
              </div>
              {acceptedFriends.map(friend => {
                const unread = getUnreadCount(friend.friend_user_id)
                const online = isOnline(friend)
                return (
                  <div 
                    key={friend.id} 
                    className={`messenger-friend-item ${selectedFriend?.id === friend.id ? 'active' : ''}`}
                    onClick={() => setSelectedFriend(friend)}
                  >
                    <div className="messenger-avatar-wrapper">
                      <img 
                        src={getAvatarUrl(friend.friend_avatar)} 
                        alt={friend.friend_username}
                        className="messenger-avatar"
                      />
                      <span className={`online-dot ${online ? 'online' : ''}`} />
                    </div>
                    <div className="messenger-friend-info">
                      <span className="messenger-friend-name">{friend.friend_username}</span>
                      <span className={`messenger-friend-status ${online ? 'online' : ''}`}>
                        {online ? t('messenger.online') : t('messenger.offline')}
                      </span>
                    </div>
                    {unread > 0 && <span className="messenger-unread">{unread}</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Pending Outgoing */}
          {pendingOutgoing.length > 0 && (
            <div className="messenger-section">
              <div className="messenger-section-title">
                {t('messenger.pending')} ({pendingOutgoing.length})
              </div>
              {pendingOutgoing.map(friend => (
                <div key={friend.id} className="messenger-friend-item pending outgoing">
                  <img 
                    src={getAvatarUrl(friend.friend_avatar)} 
                    alt={friend.friend_username}
                    className="messenger-avatar"
                  />
                  <div className="messenger-friend-info">
                    <span className="messenger-friend-name">{friend.friend_username}</span>
                    <span className="messenger-friend-status">{t('messenger.sent')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {friends.length === 0 && (
            <div className="messenger-empty">
              <span>{t('messenger.noFriends')}</span>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="messenger-chat">
          {selectedFriend ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-user">
                  <img 
                    src={getAvatarUrl(selectedFriend.friend_avatar)} 
                    alt={selectedFriend.friend_username}
                    className="chat-avatar"
                  />
                  <div className="chat-user-info">
                    <span className="chat-username">{selectedFriend.friend_username}</span>
                    <span className={`chat-status ${isOnline(selectedFriend) ? 'online' : ''}`}>
                      {typingUsers.has(selectedFriend.friend_user_id)
                        ? t('messenger.typing')
                        : isOnline(selectedFriend) 
                          ? t('messenger.online')
                          : t('messenger.offline')}
                    </span>
                  </div>
                </div>
                <button 
                  className="chat-remove-btn"
                  onClick={() => removeFriend(selectedFriend.id)}
                  title={t('messenger.remove')}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`chat-message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                  >
                    <div className="message-bubble">{msg.content}</div>
                    <div className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chat-input-area">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={t('messenger.typeMessage')}
                  className="chat-input"
                />
                <button 
                  className="chat-send-btn"
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <span>{t('messenger.selectFriend')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
