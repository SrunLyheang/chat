import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { useI18nStore } from "../store/useI18nStore";
import { Eye, EyeOff, BotIcon, Pin, UsersIcon, PlusIcon } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const formatChatTime = (date) => {
  if (!date) return "";
  const { t, locale } = useI18nStore.getState();
  const loc = locale();
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
  }
  if (d.toDateString() === yesterday.toDateString()) return t("chat.yesterday");

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 6);
  if (d > oneWeekAgo) return d.toLocaleDateString(loc, { weekday: "short" });

  return d.toLocaleDateString(loc, { month: "short", day: "numeric" });
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
  const { t } = useI18nStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  // Don't early-return while the create-group modal is open: it lives in this
  // component's tree, and its own contacts fetch toggles isUserLoading — the
  // skeleton would unmount it, and remounting refetches in an infinite loop.
  if (isUserLoading && !isCreateOpen) return <UsersLoadingSkeleton />;

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
          ? "border-primary/60 bg-primary/15 shadow-sm shadow-primary/10"
          : "border-transparent hover:bg-surface/70"
          }`}
        onClick={() => setSelectedUser(chat)}
      >
        <div className="flex items-center gap-3">
          {/* This will be paired with socket */}
          <div className={`avatar ${!chat.isGroup && (chat.isBot || onlineUsers.includes(chat._id)) ? "online" : ""}`}>
            <div className="size-12 rounded-full">
              {chat.isGroup ? (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-onPrimary" />
                </div>
              ) : chat.isBot ? (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primaryStrong flex items-center justify-center">
                  <BotIcon className="w-6 h-6 text-onPrimary" />
                </div>
              ) : (
                <img src={chat.profilePic || "/avatar.png"} alt={displayName} />
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className={`truncate text-content ${hasUnread ? "font-bold" : "font-medium"}`}>
                {displayName}
              </h4>
              <span className={`shrink-0 text-[11px] ${hasUnread ? "font-semibold text-primary" : "text-muted"}`}>
                {formatChatTime(chat.lastMessageAt)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              {showIncomingMessagePreview ? (
                <p className={`truncate text-xs ${hasUnread ? "font-medium text-content" : "text-muted"}`}>
                  {chat.lastMessagePreview || unreadInfo?.preview || t("chat.startChatting")}
                </p>
              ) : (
                <span />
              )}
              <span className="flex shrink-0 items-center gap-1.5">
                {chat.isPinnedChat && <Pin className="h-3.5 w-3.5 text-muted" />}
                {hasUnread && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-onPrimary">
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
        onClick={() => setIsCreateOpen(true)}
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent/20"
      >
        <PlusIcon className="h-4 w-4" /> {t("chat.newGroup")}
      </button>

      <button
        type="button"
        onClick={toggleIncomingMessagePreview}
        className="mb-3 flex w-full items-center justify-between rounded-lg border border-edge/50 bg-surface/50 px-3 py-2 text-sm text-content hover:bg-surface2/50"
      >
        <span>{t("chat.messagePreviews")}</span>
        {showIncomingMessagePreview ? (
          <Eye className="h-4 w-4 text-primary" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted" />
        )}
      </button>

      {chats.length === 0 && <NoChatsFound />}

      {pinnedChats.length > 0 && (
        <>
          <div className="mb-1 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            <Pin className="h-3 w-3" /> {t("chat.pinned")}
          </div>
          {pinnedChats.map(renderChat)}
          {otherChats.length > 0 && (
            <div className="mb-1 mt-3 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
              {t("chat.allChats")}
            </div>
          )}
        </>
      )}

      {otherChats.map(renderChat)}

      {isCreateOpen && <CreateGroupModal onClose={() => setIsCreateOpen(false)} />}
    </>
  );
}
export default ChatsList;
