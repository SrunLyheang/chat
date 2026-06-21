import React from 'react'
import { useAuthStore } from '../store/useAuthStore'
function LoginPage() {
  const { authUser, isLoading, login } = useAuthStore();
  return (
    <div>LoginPage</div>
  )
}

export default LoginPage