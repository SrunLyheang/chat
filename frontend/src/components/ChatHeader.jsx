import { ArrowLeftIcon, LoaderCircleIcon, PhoneIcon, XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser, isTyping } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = onlineUsers.includes(selectedUser._id)
  const { startCall, isCallActionPending, callStatus } = useCallStore();


  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (

    <div

      className="flex justify-between items-center bg-slate-800/50 border-b

    border-slate-700/50 max-h-[84px] px-6 flex-1"

    >

      {/* Left Side */}

      <div className="flex items-center space-x-3">

        <div className={`avatar ${isOnline ? "online" : "offline"}`}>

          <div className="w-12 rounded-full">

            <img

              src={selectedUser.profilePic || "/avatar.png"}

              alt={selectedUser.fullName}

            />

          </div>

        </div>

        <div>

          <h3 className="text-slate-200 font-medium">

            {selectedUser.fullName}

          </h3>

          <p className="text-slate-400 text-sm">

            {isTyping ? (

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

        <button

          type="button"

          onClick={() => startCall(selectedUser)}

          disabled={isCallActionPending}

          className="rounded-full p-2 transition hover:bg-slate-700/70 disabled:cursor-not-allowed disabled:opacity-70"

        >

          {isCallActionPending && callStatus === "connecting" ? (

            <LoaderCircleIcon className="h-5 w-5 animate-spin text-cyan-400" />

          ) : (

            <PhoneIcon className="h-5 w-5 text-slate-400 hover:text-slate-200" />

          )}

        </button>

        {/* Mobile */}

        <button

          onClick={() => setSelectedUser(null)}

          className="lg:hidden"

        >

          <ArrowLeftIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors" />

        </button>

        {/* Desktop */}

        <button

          onClick={() => setSelectedUser(null)}

          className="hidden lg:block"

        >

          <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors" />

        </button>

      </div>

    </div>

  );
}
export default ChatHeader;