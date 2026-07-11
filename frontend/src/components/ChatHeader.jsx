import {
  ArrowLeftIcon,
  LoaderCircleIcon,
  PhoneIcon,
  PhoneOffIcon,
  XIcon,
  BotIcon,
  PencilIcon,
  CheckIcon,
  PinIcon,
  PinOffIcon,
  MoreVerticalIcon,
  BanIcon,
  UsersIcon,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";
import toast from "react-hot-toast";
import GroupInfoModal from "./GroupInfoModal";

function ChatHeader() {
  const { selectedUser, setSelectedUser, isTyping, isBotThinking, setNickname, togglePinChat, toggleBlockUser } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [prevSelectedUserId, setPrevSelectedUserId] = useState(selectedUser._id);
  const menuRef = useRef(null);

  // close any in-progress rename / open menu when switching chats
  if (prevSelectedUserId !== selectedUser._id) {
    setPrevSelectedUserId(selectedUser._id);
    setIsEditingNickname(false);
    setIsMenuOpen(false);
    setIsGroupInfoOpen(false);
  }

  const isGroup = !!selectedUser.isGroup;
  const memberCount = selectedUser.participants?.length || 0;
  const isOnline = onlineUsers.includes(selectedUser._id);
  const displayName = selectedUser.nickname?.trim() || selectedUser.fullName;
  const hasNickname = Boolean(selectedUser.nickname?.trim());

  const {
    startCall,
    leaveCall,
    activeCall,
    isCallActionPending,
    callStatus,
  } = useCallStore();

  useEffect(() => {
    const handleEscKey = (event) => {
      // Esc while renaming only cancels the rename, not the whole chat
      if (event.key === "Escape" && !isEditingNickname) setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser, isEditingNickname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBlockUser = () => {
    setIsMenuOpen(false);
    toggleBlockUser(selectedUser);
  };

  const startNicknameEdit = () => {
    setNicknameDraft(selectedUser.nickname || "");
    setIsEditingNickname(true);
  };

  const saveNickname = () => {
    setNickname(selectedUser._id, nicknameDraft.trim());
    setIsEditingNickname(false);
  };

  return (
    <div
      className="flex justify-between items-center bg-slate-800/50 border-b border-slate-700/50 max-h-[64px] px-4 py-2 flex-1"
    >
      {/* Left Side */}
      <div className="flex items-center space-x-3 min-w-0">
        <div
          className={`avatar ${!isGroup && (selectedUser.isBot || isOnline) ? "online" : "offline"
            }`}
        >
          <div className="w-10 rounded-full">
            {isGroup ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-white" />
              </div>
            ) : selectedUser.isBot ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <BotIcon className="w-5 h-5 text-white" />
              </div>
            ) : (
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={displayName}
              />
            )}
          </div>
        </div>

        {isGroup ? (
          <button
            type="button"
            onClick={() => setIsGroupInfoOpen(true)}
            className="min-w-0 text-left"
            title="Group info"
          >
            <h3 className="truncate text-sm text-slate-200 font-medium">{selectedUser.fullName}</h3>
            <p className="text-slate-400 text-xs truncate">
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </p>
          </button>
        ) : (
        <div className="min-w-0">
          {isEditingNickname ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={nicknameDraft}
                onChange={(e) => setNicknameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveNickname();
                  if (e.key === "Escape") setIsEditingNickname(false);
                }}
                maxLength={50}
                placeholder={selectedUser.fullName}
                className="w-40 rounded-md border border-slate-600 bg-slate-900/60 px-2 py-1 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={saveNickname}
                title="Save nickname"
                className="text-cyan-400 hover:text-cyan-300"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingNickname(false)}
                title="Cancel"
                className="text-slate-400 hover:text-slate-200"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="group/name flex items-center gap-1.5 min-w-0">
              <h3 className="truncate text-sm text-slate-200 font-medium">{displayName}</h3>
              <button
                type="button"
                onClick={startNicknameEdit}
                title={hasNickname ? "Edit nickname" : "Set nickname"}
                className="shrink-0 text-slate-500 opacity-0 transition-opacity hover:text-slate-300 group-hover/name:opacity-100"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <p className="text-slate-400 text-xs truncate">
            {hasNickname && !isEditingNickname && (
              <span className="mr-1.5 text-slate-500">{selectedUser.fullName} ·</span>
            )}
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
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {isGroup && (
          <button
            type="button"
            onClick={() => setIsGroupInfoOpen(true)}
            title="Group info"
            className="rounded-full p-2 transition hover:bg-slate-700/70"
          >
            <UsersIcon className="h-5 w-5 text-slate-400 hover:text-slate-200" />
          </button>
        )}

        {!isGroup && (
        <button
          type="button"
          onClick={() => togglePinChat(selectedUser._id)}
          title={selectedUser.isPinnedChat ? "Unpin chat" : "Pin chat"}
          className="rounded-full p-2 transition hover:bg-slate-700/70"
        >
          {selectedUser.isPinnedChat ? (
            <PinOffIcon className="h-5 w-5 text-cyan-400 hover:text-cyan-300" />
          ) : (
            <PinIcon className="h-5 w-5 text-slate-400 hover:text-slate-200" />
          )}
        </button>
        )}

        {!isGroup && !selectedUser.isBot && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              title="More options"
              className="rounded-full p-2 transition hover:bg-slate-700/70"
            >
              <MoreVerticalIcon className="h-5 w-5 text-slate-400 hover:text-slate-200" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900 shadow-lg">
                <button
                  type="button"
                  onClick={handleBlockUser}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-slate-800"
                >
                  <BanIcon className="h-4 w-4" />
                  Block user
                </button>
              </div>
            )}
          </div>
        )}

        {!isGroup && !selectedUser.isBot && (
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
            className={`rounded-full p-2 transition hover:bg-slate-700/70 disabled:cursor-not-allowed disabled:opacity-70 ${!isOnline && !activeCall
              ? "opacity-40 cursor-not-allowed"
              : ""
              }`}
          >
            {isCallActionPending && callStatus === "connecting" ? (
              <LoaderCircleIcon className="h-5 w-5 animate-spin text-cyan-400" />
            ) : activeCall ? (
              <PhoneOffIcon className="h-5 w-5 text-rose-400 hover:text-rose-300" />
            ) : (
              <PhoneIcon
                className={`h-5 w-5 ${isOnline
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600"
                  }`}
              />
            )}
          </button>
        )}

        {/* Mobile */}
        <button
          onClick={() => setSelectedUser(null)}
          className="md:hidden"
        >
          <ArrowLeftIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors" />
        </button>

        {/* Desktop */}
        <button
          onClick={() => setSelectedUser(null)}
          className="hidden md:block"
        >
          <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors" />
        </button>
      </div>

      {isGroup && isGroupInfoOpen && (
        <GroupInfoModal group={selectedUser} onClose={() => setIsGroupInfoOpen(false)} />
      )}
    </div>
  );
}

export default ChatHeader;
