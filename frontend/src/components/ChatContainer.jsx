import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  CheckCheck,
  X,
  Reply,
  Pin,
  PinOff,
} from "lucide-react";

const GROUP_GAP_MS = 5 * 60 * 1000; // messages closer than this collapse into one group

const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

const formatDayLabel = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
};

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    getGroupMessages,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    editMessage,
    deleteMessage,
    togglePinMessage,
    setReplyingTo,
    isTyping,
    isBotThinking,
    highlightedMessageId,
    setHighlightedMessageId,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [pinnedCursor, setPinnedCursor] = useState(0);
  const [prevSelectedUserId, setPrevSelectedUserId] = useState(selectedUser._id);

  // restart the pinned-bar cycle when switching chats
  if (prevSelectedUserId !== selectedUser._id) {
    setPrevSelectedUserId(selectedUser._id);
    setPinnedCursor(0);
  }

  const toUserId = (value) => (value ? value.toString() : "");
  const isGroup = !!selectedUser.isGroup;
  const selectedUserName = selectedUser.nickname?.trim() || selectedUser.fullName;

  // For groups: map participant id -> details so each bubble can show who sent it.
  const participantMap = new Map(
    (selectedUser.participants || []).map((p) => [toUserId(p._id), p])
  );
  const senderName = (senderId) => {
    if (toUserId(senderId) === toUserId(authUser._id)) return "You";
    const p = participantMap.get(toUserId(senderId));
    return p?.fullName || "Unknown";
  };

  const pinnedMessages = messages.filter((m) => m.isPinned && !m.isDeleted);
  // newest pinned message shown first, clicking the bar cycles back through older ones
  const currentPinned =
    pinnedMessages.length > 0
      ? pinnedMessages[(pinnedMessages.length - 1 - (pinnedCursor % pinnedMessages.length) + pinnedMessages.length) % pinnedMessages.length]
      : null;

  const getReplySenderName = (reply) => {
    if (!reply?.senderId) return "Message";
    if (toUserId(reply.senderId) === toUserId(authUser._id)) return "You";
    // In a group the reply can be from any member; look them up by id.
    return isGroup ? senderName(reply.senderId) : selectedUserName;
  };

  const getReplyText = (reply) => {
    if (reply?.isDeleted) return "Deleted message";
    if (reply?.text) return reply.text;
    if (reply?.image) return "Photo";
    return "Message";
  };

  const startEditing = (msg) => {
    setEditingId(msg._id);
    setEditText(msg.text || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEditing = (messageId) => {
    const trimmed = editText.trim();
    if (!trimmed) return cancelEditing();
    editMessage(messageId, trimmed);
    cancelEditing();
  };

  const scrollToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(messageId);
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => setHighlightedMessageId(null), 1600);
  };

  const handlePinnedBarClick = () => {
    if (!currentPinned) return;
    scrollToMessage(currentPinned._id);
    setPinnedCursor((cursor) => cursor + 1);
  };

  useEffect(() => {
    if (selectedUser.isGroup) {
      getGroupMessages(selectedUser._id);
    } else {
      getMessagesByUserId(selectedUser._id);
    }
    subscribeToMessages();

    // clean up
    return () => unsubscribeFromMessages();
    // Depend on the id/isGroup primitives, not the selectedUser object: pin,
    // nickname, and block updates replace the object and would refetch here.
  }, [selectedUser._id, selectedUser.isGroup, getMessagesByUserId, getGroupMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => () => {
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
  }, []);

  // only auto-scroll when a NEW message arrives (not on edits/pins), or on typing indicators
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1]._id : null;
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastMessageId, isTyping, isBotThinking]);

  return (
    <>
      <ChatHeader />

      {/* Pinned messages bar */}
      {currentPinned && (
        <div
          onClick={handlePinnedBarClick}
          className="flex cursor-pointer items-center gap-3 border-b border-slate-700/50 bg-slate-800/80 px-4 py-2 transition-colors hover:bg-slate-800"
        >
          <Pin className="h-4 w-4 shrink-0 text-cyan-400" />
          <div className="min-w-0 flex-1 border-l-2 border-cyan-400/70 pl-3">
            <p className="text-xs font-semibold text-cyan-400">
              Pinned message
              {pinnedMessages.length > 1 &&
                ` · ${((pinnedCursor % pinnedMessages.length) + 1)} of ${pinnedMessages.length}`}
            </p>
            <p className="truncate text-xs text-slate-300">
              {currentPinned.text || (currentPinned.image ? "📷 Photo" : "Message")}
            </p>
          </div>
          {currentPinned.image && (
            <img
              src={currentPinned.image}
              alt="Pinned"
              className="h-8 w-8 shrink-0 rounded object-cover"
            />
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePinMessage(currentPinned._id);
              setPinnedCursor(0);
            }}
            title="Unpin"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="mx-auto max-w-2xl">
            {messages.map((msg, index) => {
              const isOwnMessage = toUserId(msg.senderId) === toUserId(authUser._id);
              const isEditingThis = editingId === msg._id;
              const isHighlighted = highlightedMessageId === msg._id;

              const prev = messages[index - 1];
              const next = messages[index + 1];
              const showDateSeparator = !prev || !isSameDay(prev.createdAt, msg.createdAt);
              const isFirstInGroup =
                showDateSeparator ||
                toUserId(prev?.senderId) !== toUserId(msg.senderId) ||
                new Date(msg.createdAt) - new Date(prev.createdAt) > GROUP_GAP_MS;
              const isLastInGroup =
                !next ||
                !isSameDay(next.createdAt, msg.createdAt) ||
                toUserId(next.senderId) !== toUserId(msg.senderId) ||
                new Date(next.createdAt) - new Date(msg.createdAt) > GROUP_GAP_MS;

              return (
                <div key={msg._id} id={`msg-${msg._id}`}>
                  {showDateSeparator && (
                    <div className="my-3 flex items-center justify-center">
                      <span className="rounded-full border border-slate-700/50 bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
                        {formatDayLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`group flex ${isOwnMessage ? "justify-end" : "justify-start"} ${
                      isFirstInGroup ? "mt-2" : "mt-0.5"
                    }`}
                  >
                    <div
                      className={`relative max-w-[80%] px-3 py-1.5 shadow-sm transition-all sm:max-w-[70%] ${
                        isOwnMessage
                          ? `rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white ${
                              isLastInGroup ? "rounded-br-md" : ""
                            }`
                          : `rounded-2xl border border-slate-700/60 bg-slate-800 text-slate-100 ${
                              isLastInGroup ? "rounded-bl-md" : ""
                            }`
                      } ${isHighlighted ? "ring-2 ring-cyan-300/80 ring-offset-2 ring-offset-slate-900" : ""}`}
                    >
                      {!msg.isDeleted && !isEditingThis && (
                        <div
                          className={`dropdown absolute top-1 opacity-0 transition-opacity group-hover:opacity-100 ${
                            isOwnMessage ? "dropdown-left -left-7" : "dropdown-right -right-7"
                          }`}
                        >
                          <label
                            tabIndex={0}
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-700/70 hover:text-slate-200"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </label>
                          <ul
                            tabIndex={0}
                            className="dropdown-content menu menu-sm z-10 mt-1 w-36 rounded-box border border-slate-700/60 bg-slate-900 p-1 text-slate-200 shadow-lg"
                          >
                            <li>
                              <button
                                onClick={() => {
                                  document.activeElement?.blur();
                                  setReplyingTo(msg);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Reply className="w-3.5 h-3.5" /> Reply
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => {
                                  document.activeElement?.blur();
                                  togglePinMessage(msg._id);
                                }}
                                className="flex items-center gap-2"
                              >
                                {msg.isPinned ? (
                                  <>
                                    <PinOff className="w-3.5 h-3.5" /> Unpin
                                  </>
                                ) : (
                                  <>
                                    <Pin className="w-3.5 h-3.5" /> Pin
                                  </>
                                )}
                              </button>
                            </li>
                            {isOwnMessage && msg.text && (
                              <li>
                                <button
                                  onClick={() => {
                                    document.activeElement?.blur();
                                    startEditing(msg);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                              </li>
                            )}
                            {isOwnMessage && (
                              <li>
                                <button
                                  onClick={() => {
                                    document.activeElement?.blur();
                                    deleteMessage(msg._id);
                                  }}
                                  className="flex items-center gap-2 text-red-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {isGroup && !isOwnMessage && isFirstInGroup && (
                        <p className="mb-0.5 text-xs font-semibold text-cyan-300">
                          {senderName(msg.senderId)}
                        </p>
                      )}

                      {msg.isDeleted ? (
                        <p className="text-sm italic opacity-60">This message was deleted</p>
                      ) : (
                        <>
                          {msg.replyTo?.messageId && (
                            <div
                              className={`mb-1.5 flex cursor-pointer items-center gap-2 rounded-lg border-l-2 px-2.5 py-1.5 ${
                                isOwnMessage
                                  ? "border-white/70 bg-white/15"
                                  : "border-cyan-400/70 bg-slate-700/50"
                              }`}
                              onClick={() => msg.replyTo.messageId && scrollToMessage(msg.replyTo.messageId)}
                            >
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-semibold ${isOwnMessage ? "text-white" : "text-cyan-300"}`}>
                                  {getReplySenderName(msg.replyTo)}
                                </p>
                                <p className={`truncate text-xs ${isOwnMessage ? "text-white/80" : "text-slate-300"}`}>
                                  {getReplyText(msg.replyTo)}
                                </p>
                              </div>
                              {msg.replyTo.image && !msg.replyTo.isDeleted && (
                                <img
                                  src={msg.replyTo.image}
                                  alt="Reply"
                                  className="h-9 w-9 rounded object-cover"
                                />
                              )}
                            </div>
                          )}
                          {msg.image && (
                            <img
                              src={msg.image}
                              alt="Shared"
                              onClick={() => setEnlargedImage(msg.image)}
                              className="h-48 cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90"
                            />
                          )}
                          {isEditingThis ? (
                            <div className="mt-1 flex items-center gap-2">
                              <input
                                autoFocus
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEditing(msg._id);
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                className="input input-sm input-bordered w-full bg-slate-950/40 text-inherit"
                              />
                              <button onClick={() => saveEditing(msg._id)}>
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={cancelEditing}>
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            msg.text && (
                              <p className={`whitespace-pre-wrap break-words text-sm leading-snug ${msg.image ? "mt-1.5" : ""}`}>
                                {msg.text}
                              </p>
                            )
                          )}
                        </>
                      )}

                      <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] opacity-70">
                        {msg.isPinned && !msg.isDeleted && <Pin className="h-3 w-3" />}
                        {msg.isEdited && !msg.isDeleted && <span className="italic">edited</span>}
                        {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {isOwnMessage && !msg.isDeleted && !isGroup && (
                          msg.seen ? (
                            <CheckCheck className="h-3.5 w-3.5 text-sky-200" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {((selectedUser.isBot && isBotThinking) || (!selectedUser.isBot && isTyping)) && (
              <div className="mt-2 flex justify-start">
                <div
                  className={`flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-700/60 bg-slate-800 px-3 py-2 ${
                    selectedUser.isBot ? "text-blue-300" : "text-slate-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-current animate-bounce" />
                </div>
              </div>
            )}

            {/* Scroll */}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUserName} />
        )}
      </div>

      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            onClick={() => setEnlargedImage(null)}
            className="absolute top-4 right-4 text-slate-200 hover:text-white"
          >
            <X className="w-7 h-7" />
          </button>
          <img
            src={enlargedImage}
            alt="Enlarged"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}

      <MessageInput />
    </>
  );
}

export default ChatContainer;
