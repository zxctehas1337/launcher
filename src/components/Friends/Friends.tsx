import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { IoPersonAdd, IoCheckmark, IoCloseCircle, IoArrowBack, IoClose } from 'react-icons/io5'
import { getAvatarUrl } from '../../utils/avatarGenerator'
import { User } from '../../types'
import './Friends.css'

interface Friend {
  id: number
  status: 'pending' | 'accepted'
  friend_user_id: number
  friend_username: string
  friend_avatar: string | null
  friend_last_active: string | null
  request_direction: 'incoming' | 'outgoing'
}

interface FriendsProps {
  user: User
  t: any
  onClose: () => void
}

const FriendItem = memo(({ 
  friend, 
  isOnline,
  onRemove
}: {
  friend: Friend
  isOnline: boolean
  onRemove: () => void
}) => (
  <div className="friend-item">
    <div className="friend-avatar-wrapper">
      <img 
        src={getAvatarUrl(friend.friend_avatar)} 
        alt={friend.friend_username}
        className="friend-avatar"
        loading="lazy"
      />
      <span className={`online-dot ${isOnline ? 'online' : ''}`} />
    </div>
    <div className="friend-info">
      <span className="friend-name">{friend.friend_username}</span>
      <span className={`friend-status ${isOnline ? 'online' : ''}`}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
    <button className="friend-remove-btn" onClick={onRemove} title="Remove">
      <IoClose size={16} />
    </button>
  </div>
))

FriendItem.displayName = 'FriendItem'

export function Friends({ user, t, onClose }: FriendsProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendInput, setFriendInput] = useState('')
  const [loading, setLoading] = useState(false)

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
      fetchFriends()
    } catch (error) {
      console.error('Error removing friend:', error)
    }
  }

  const isOnline = useCallback((friend: Friend) => {
    if (!friend.friend_last_active) return false
    const diff = Date.now() - new Date(friend.friend_last_active).getTime()
    return diff < 5 * 60 * 1000
  }, [])

  useEffect(() => {
    fetchFriends()
    const interval = setInterval(fetchFriends, 30000)
    return () => clearInterval(interval)
  }, [user.id])

  const acceptedFriends = useMemo(() => friends.filter(f => f.status === 'accepted'), [friends])
  const pendingRequests = useMemo(() => friends.filter(f => f.status === 'pending' && f.request_direction === 'incoming'), [friends])
  const pendingOutgoing = useMemo(() => friends.filter(f => f.status === 'pending' && f.request_direction === 'outgoing'), [friends])

  return (
    <div className="friends-fullscreen glass-card">
      <div className="friends-header">
        <button className="friends-back-btn" onClick={onClose}>
          <IoArrowBack size={20} />
        </button>
        <h2>{t.dashboard?.friends || 'Friends'}</h2>
      </div>

      <div className="friends-content">
        <div className="friends-add">
          <input
            type="text"
            value={friendInput}
            onChange={(e) => setFriendInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFriend()}
            placeholder={t.dashboard?.enterFriendUsername || 'Enter nickname...'}
            className="friends-add-input"
          />
          <button 
            className="friends-add-btn"
            onClick={addFriend}
            disabled={!friendInput.trim() || loading}
          >
            <IoPersonAdd size={18} />
          </button>
        </div>

        {pendingRequests.length > 0 && (
          <div className="friends-section">
            <div className="friends-section-title">
              {t.dashboard?.friendRequests || 'Requests'} ({pendingRequests.length})
            </div>
            {pendingRequests.map(friend => (
              <div key={friend.id} className="friend-item pending">
                <img 
                  src={getAvatarUrl(friend.friend_avatar)} 
                  alt={friend.friend_username}
                  className="friend-avatar"
                />
                <div className="friend-info">
                  <span className="friend-name">{friend.friend_username}</span>
                </div>
                <div className="friend-actions">
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

        {acceptedFriends.length > 0 && (
          <div className="friends-section">
            <div className="friends-section-title">
              {t.dashboard?.friends || 'Friends'} ({acceptedFriends.length})
            </div>
            {acceptedFriends.map(friend => (
              <FriendItem
                key={friend.id}
                friend={friend}
                isOnline={isOnline(friend)}
                onRemove={() => removeFriend(friend.id)}
              />
            ))}
          </div>
        )}

        {pendingOutgoing.length > 0 && (
          <div className="friends-section">
            <div className="friends-section-title">
              {t.dashboard?.pendingRequests || 'Pending'} ({pendingOutgoing.length})
            </div>
            {pendingOutgoing.map(friend => (
              <div key={friend.id} className="friend-item pending outgoing">
                <img 
                  src={getAvatarUrl(friend.friend_avatar)} 
                  alt={friend.friend_username}
                  className="friend-avatar"
                />
                <div className="friend-info">
                  <span className="friend-name">{friend.friend_username}</span>
                  <span className="friend-status">{t.dashboard?.requestSent || 'Sent'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {friends.length === 0 && (
          <div className="friends-empty">
            <span>{t.dashboard?.noFriendsYet || 'No friends yet'}</span>
          </div>
        )}
      </div>
    </div>
  )
}
