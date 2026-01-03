import { useState, useEffect, useRef } from 'react'
import { IoSend, IoClose, IoPersonAdd, IoCheckmark, IoCloseCircle, IoArrowBack } from 'react-icons/io5'
import { getAvatarUrl } from '../../utils/avatarGenerator'
import { User } from '../../types'
import './FriendsMessenger.css'

interface Friend {
  id: number
  status: 'pending' | 'accepted'
  friend_user_id: number
  friend_username: string
  friend_avatar: string | null
  friend_last_active: string | null
  request_direction: 'incoming' | 'outgoing'
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
  t: any
  onClose: () => void
}

export function FriendsMessenger({ user, t, onClose }: FriendsMessengerProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [friendInput, setFriendInput] = useState('')
  const [unreadData, setUnreadData] = useState<UnreadData>({ byUser: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchFriends = async () => {
    try {
      const response = await fetch(`/api/friends?userId=${user.id}`)
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
      const response = await fetch(`/api/messages/unread?userId=${user.id}`)
      const data = await response.json()
      if (data.success) {
        setUnreadData(data.data)
      }
    } catch (error) {
      console.error('Error fetching unread:', error)
    }
  }

  const fetchMessages = async (friendId: number) => {
    try {
      const response = await fetch(`/api/messages?userId=${user.id}&friendId=${friendId}`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.data)
        await fetch('/api/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, friendId })
        })
        fetchUnread()
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedFriend) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedFriend.friend_user_id,
          content: messageInput.trim()
        })
      })
      const data = await response.json()
      if (data.success) {
        setMessages(prev => [...prev, { ...data.data, sender_username: user.username }])
        setMessageInput('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const addFriend = async () => {
    if (!friendInput.trim()) return
    setLoading(true)

    try {
      const response = await fetch('/api/friends', {
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
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error adding friend:', error)
    } finally {
      setLoading(false)
    }
  }

  const acceptFriend = async (friendshipId: number) => {
    try {
      await fetch('/api/friends', {
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
      await fetch('/api/friends', {
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
      await fetch('/api/friends', {
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

  const isOnline = (lastActive: string | null) => {
    if (!lastActive) return false
    const diff = Date.now() - new Date(lastActive).getTime()
    return diff < 5 * 60 * 1000
  }

  const getUnreadCount = (friendId: number) => {
    const found = unreadData.byUser.find(u => u.sender_id === friendId)
    return found ? parseInt(found.unread_count) : 0
  }

  useEffect(() => {
    fetchFriends()
    fetchUnread()
    
    const interval = setInterval(() => {
      fetchFriends()
      fetchUnread()
      if (selectedFriend) {
        fetchMessages(selectedFriend.friend_user_id)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [user.id])

  useEffect(() => {
    if (selectedFriend) {
      fetchMessages(selectedFriend.friend_user_id)
    }
  }, [selectedFriend])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const acceptedFriends = friends.filter(f => f.status === 'accepted')
  const pendingRequests = friends.filter(f => f.status === 'pending' && f.request_direction === 'incoming')
  const pendingOutgoing = friends.filter(f => f.status === 'pending' && f.request_direction === 'outgoing')

  return (
    <div className="messenger-fullscreen glass-card">
      {/* Header */}
      <div className="messenger-header">
        <button className="messenger-back-btn" onClick={onClose}>
          <IoArrowBack size={20} />
        </button>
        <h2>{t.dashboard?.friends || 'Friends'}</h2>
        {unreadData.total > 0 && (
          <span className="messenger-unread-badge">{unreadData.total}</span>
        )}
      </div>

      <div className="messenger-content">
        {/* Sidebar - Friends List */}
        <div className="messenger-sidebar">
          {/* Add Friend */}
          <div className="messenger-add-friend">
            <input
              type="text"
              value={friendInput}
              onChange={(e) => setFriendInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addFriend()}
              placeholder={t.dashboard?.enterFriendUsername || 'Enter nickname...'}
              className="messenger-add-input"
            />
            <button 
              className="messenger-add-btn"
              onClick={addFriend}
              disabled={!friendInput.trim() || loading}
            >
              <IoPersonAdd size={18} />
            </button>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="messenger-section">
              <div className="messenger-section-title">
                {t.dashboard?.friendRequests || 'Requests'} ({pendingRequests.length})
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
                      <IoCheckmark size={16} />
                    </button>
                    <button className="reject-btn" onClick={() => rejectFriend(friend.id)}>
                      <IoCloseCircle size={16} />
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
                {t.dashboard?.friends || 'Friends'} ({acceptedFriends.length})
              </div>
              {acceptedFriends.map(friend => {
                const unread = getUnreadCount(friend.friend_user_id)
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
                      <span className={`online-dot ${isOnline(friend.friend_last_active) ? 'online' : ''}`} />
                    </div>
                    <div className="messenger-friend-info">
                      <span className="messenger-friend-name">{friend.friend_username}</span>
                      <span className={`messenger-friend-status ${isOnline(friend.friend_last_active) ? 'online' : ''}`}>
                        {isOnline(friend.friend_last_active) 
                          ? (t.dashboard?.online || 'Online')
                          : (t.dashboard?.offline || 'Offline')}
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
                {t.dashboard?.pendingRequests || 'Pending'} ({pendingOutgoing.length})
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
                    <span className="messenger-friend-status">{t.dashboard?.requestSent || 'Sent'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {friends.length === 0 && (
            <div className="messenger-empty">
              <span>{t.dashboard?.noFriendsYet || 'No friends yet'}</span>
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
                    <span className={`chat-status ${isOnline(selectedFriend.friend_last_active) ? 'online' : ''}`}>
                      {isOnline(selectedFriend.friend_last_active) 
                        ? (t.dashboard?.online || 'Online')
                        : (t.dashboard?.offline || 'Offline')}
                    </span>
                  </div>
                </div>
                <button 
                  className="chat-remove-btn"
                  onClick={() => removeFriend(selectedFriend.id)}
                  title={t.dashboard?.removeFriend || 'Remove'}
                >
                  <IoClose size={20} />
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
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={t.dashboard?.typeMessage || 'Message...'}
                  className="chat-input"
                />
                <button 
                  className="chat-send-btn"
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                >
                  <IoSend size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <span>{t.dashboard?.selectFriendToChat || 'Select a friend to start chatting'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
