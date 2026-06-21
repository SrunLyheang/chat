import { useAuthStore } from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'

function ChatPage() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="text-slate-200 z-10">
      chat page
      <button
        onClick={handleLogout}
        className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
}

export default ChatPage;