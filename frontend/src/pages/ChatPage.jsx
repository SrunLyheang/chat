import React from 'react'
import { useAuthStore } from '../store/useAuthStore'
function ChatPage() {
  const { authUser, isLoading, login } = useAuthStore();
  return (
    <div>ChatPage</div>
  )
}

export default ChatPage