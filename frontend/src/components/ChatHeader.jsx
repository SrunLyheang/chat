import { ArrowLeftIcon, LoaderCircleIcon, PhoneIcon, PhoneOffIcon, XIcon, BotIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";
import toast from "react-hot-toast";

function ChatHeader() {
  const { selectedUser, setSelectedUser, isTyping, isBotThinking } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = onlineUsers.includes(selectedUser._id)
  const { startCall, leaveCall, activeCall, isCallActionPending, callStatus } = useCallStore();


  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div
      className="flex justify-between items-center bg-slate-800/50 border-b
    border-slate-700/50 max-h-[84px] px-6 flex-1"
    >
      {/* Left Side */}
      <div className="flex items-center space-x-3">
        <div className={`avatar ${selectedUser.isBot || isOnline ? "online" : "offline"}`}>
          <div className="w-12 rounded-full">
            {selectedUser.isBot ? (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <BotIcon className="w-6 h-6 text-white" />
              </div>
            ) : (
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            )}
          </div>
        </div>

        <div>
          <h3 className="text-slate-200 font-medium">
            {selectedUser.fullName}
          </h3>

          <p className="text-slate-400 text-sm">
            {selectedUser.isBot ? (
              isBotThinking ? (
                <span className="text-blue-400 inline-flex items-center gap-1">
                  AI is thinking
                  <span className="inline-flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" />
                  </span>
                </span>
              ) : (
                <span className="text-blue-400 font-medium">AI</span>
              )
            ) : isTyping ? (
              <span className="text-cyan-400">typing...</span>
            ) : isOnline ? (
              "Online"
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {!selectedUser.isBot && (
          <button
            type="button"
            onClick={() => {
              if (activeCall) {
                leaveCall();
                return;
              }
              if (!isOnline) {
                toast.error("User is offline, cannot call");
                return;
              }
              startCall(selectedUser);
            }}
            disabled={isCallActionPending}
            className={`rounded-full p-2 transition hover:bg-slate-700/70 disabled:cursor-not-allowed disabled:opacity-70 ${!isOnline && !activeCall ? "opacity-40 cursor-not-allowed" : ""
              }`}
          >
            {isCallActionPending && callStatus === "connecting" ? (
              <LoaderCircleIcon className="h-5 w-5 animate-spin text-cyan-400" />
            ) : activeCall ? (
              <PhoneOffIcon className="h-5 w-5 text-rose-400 hover:text-rose-300" />
            ) : (
              <PhoneIcon className={`h-5 w-5 ${isOnline ? "text-slate-400 hover:text-slate-200" : "text-slate-600"}`} />
            )}
          </button>
        )}

        {/* Mobile */}
        <button onClick={() => setSelectedUser(null)} className="lg:hidden">
          <ArrowLeftIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors" />
        </button>

        {/* Desktop */}
        <button onClick={() => setSelectedUser(null)} className="hidden lg:block">
          <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors" />
        </button>
      </div>
    </div>
  );
}
export default ChatHeader;