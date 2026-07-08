import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff } from "lucide-react";

function ChatsList() {
  const {
    getMyChatPartners,
    chats,
    isUserLoading,
    setSelectedUser,
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

      {chats.map((chat) => {
        const chatKey = chat._id?.toString();
        const unreadInfo = unreadChats[chatKey];
        const unreadCount = unreadInfo?.count || 0;
        const hasUnread = unreadCount > 0;

        return (
          <div
            key={chat._id}
            className={`p-4 rounded-lg cursor-pointer transition-colors border ${hasUnread
              ? "bg-cyan-500/20 border-cyan-400/50 shadow-sm shadow-cyan-500/10"
              : "bg-cyan-500/10 border-transparent hover:bg-cyan-500/20"
              }`}
            onClick={() => setSelectedUser(chat)}
          >
            <div className="flex items-center gap-3">
              {/* This will be paired with socket */}
              <div className={`avatar ${onlineUsers.includes(chat._id) ? "online" : ""}`}>
                <div className="size-12 rounded-full">
                  <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={`truncate text-slate-200 ${hasUnread ? "font-bold" : "font-medium"}`}>
                  {chat.nickname?.trim() || chat.fullName}
                </h4>
                {showIncomingMessagePreview && (
                  <p className="mt-0.5 truncate text-xs font-medium text-slate-300">
                    {chat.lastMessagePreview || unreadInfo?.preview || "Start chatting"}
                  </p>
                )}
              </div>
              {hasUnread && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-400 px-2 text-xs font-bold text-slate-950">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
export default ChatsList;
