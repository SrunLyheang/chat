import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, BotIcon, Pin } from "lucide-react";

const formatChatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 6);
  if (d > oneWeekAgo) return d.toLocaleDateString(undefined, { weekday: "short" });

  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function ChatsList() {
  const {
    getMyChatPartners,
    chats,
    isUserLoading,
    setSelectedUser,
    selectedUser,
    unreadChats,
    showIncomingMessagePreview,
    toggleIncomingMessagePreview,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUserLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  const pinnedChats = chats.filter((chat) => chat.isPinnedChat);
  const otherChats = chats.filter((chat) => !chat.isPinnedChat);

  const renderChat = (chat) => {
    const chatKey = chat._id?.toString();
    const unreadInfo = unreadChats[chatKey];
    const unreadCount = unreadInfo?.count || 0;
    const hasUnread = unreadCount > 0;
    const displayName = chat.nickname?.trim() || chat.fullName;
    const isSelected = selectedUser?._id?.toString() === chatKey;

    return (
      <div
        key={chat._id}
        className={`cursor-pointer rounded-xl border px-3 py-3 transition-colors ${isSelected
          ? "border-cyan-400/60 bg-cyan-500/15 shadow-sm shadow-cyan-500/10"
          : "border-transparent hover:bg-slate-800/70"
          }`}
        onClick={() => setSelectedUser(chat)}
      >
        <div className="flex items-center gap-3">
          {/* This will be paired with socket */}
          <div className={`avatar ${chat.isBot || onlineUsers.includes(chat._id) ? "online" : ""}`}>
            <div className="size-12 rounded-full">
              {chat.isBot ? (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <BotIcon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <img src={chat.profilePic || "/avatar.png"} alt={displayName} />
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className={`truncate text-slate-200 ${hasUnread ? "font-bold" : "font-medium"}`}>
                {displayName}
              </h4>
              <span className={`shrink-0 text-[11px] ${hasUnread ? "font-semibold text-cyan-400" : "text-slate-500"}`}>
                {formatChatTime(chat.lastMessageAt)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              {showIncomingMessagePreview ? (
                <p className={`truncate text-xs ${hasUnread ? "font-medium text-slate-200" : "text-slate-400"}`}>
                  {chat.lastMessagePreview || unreadInfo?.preview || "Start chatting"}
                </p>
              ) : (
                <span />
              )}
              <span className="flex shrink-0 items-center gap-1.5">
                {chat.isPinnedChat && <Pin className="h-3.5 w-3.5 text-slate-500" />}
                {hasUnread && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1.5 text-[11px] font-bold text-slate-950">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={toggleIncomingMessagePreview}
        className="mb-3 flex w-full items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50"
      >
        <span>Message previews</span>
        {showIncomingMessagePreview ? (
          <Eye className="h-4 w-4 text-cyan-300" />
        ) : (
          <EyeOff className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {pinnedChats.length > 0 && (
        <>
          <div className="mb-1 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Pin className="h-3 w-3" /> Pinned
          </div>
          {pinnedChats.map(renderChat)}
          {otherChats.length > 0 && (
            <div className="mb-1 mt-3 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              All chats
            </div>
          )}
        </>
      )}

      {otherChats.map(renderChat)}
    </>
  );
}
export default ChatsList;
