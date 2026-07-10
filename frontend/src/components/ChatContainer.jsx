import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { MoreVertical, Pencil, Trash2, Check, CheckCheck, X, Reply } from "lucide-react";



function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    editMessage,
    deleteMessage,
    setReplyingTo,
    isTyping,
    isBotThinking,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null)
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [enlargedImage, setEnlargedImage] = useState(null);

  const toUserId = (value) => (value ? value.toString() : "");

  const getReplySenderName = (reply) => {
    if (!reply?.senderId) return "Message";
    return toUserId(reply.senderId) === toUserId(authUser._id) ? "You" : selectedUser.fullName;
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


  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages()

    // clean up
    return () => unsubscribeFromMessages()
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isBotThinking]);



  return (
    <>
      <ChatHeader />
      <div className="flex-1 px-6 overflow-y-auto py-8">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
              const isOwnMessage = toUserId(msg.senderId) === toUserId(authUser._id);
              const isEditingThis = editingId === msg._id;

              return (
                <div
                  key={msg._id}
                  className={`chat ${isOwnMessage ? "chat-end" : "chat-start"} group`}
                >
                  <div
                    className={`chat-bubble relative ${isOwnMessage
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800 text-slate-200"
                      }`}
                  >
                    {!msg.isDeleted && !isEditingThis && (
                      <div className={`dropdown absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity ${isOwnMessage ? "dropdown-left right-1" : "dropdown-right left-1"}`}>
                        <label tabIndex={0} className="cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </label>
                        <ul
                          tabIndex={0}
                          className="dropdown-content menu menu-sm z-10 mt-1 p-1 shadow bg-slate-900 rounded-box w-32 text-slate-200"
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

                    {msg.isDeleted ? (
                      <p className="italic opacity-60 text-sm">This message was deleted</p>
                    ) : (
                      <>
                        {msg.replyTo?.messageId && (
                          <div className="mb-2 flex items-center gap-2 rounded-md border-l-4 border-slate-400 bg-slate-500/25 px-3 py-2 text-slate-100">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-200">
                                {getReplySenderName(msg.replyTo)}
                              </p>
                              <p className="truncate text-xs text-slate-300">
                                {getReplyText(msg.replyTo)}
                              </p>
                            </div>
                            {msg.replyTo.image && !msg.replyTo.isDeleted && (
                              <img
                                src={msg.replyTo.image}
                                alt="Reply"
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                          </div>
                        )}
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="Shared"
                            onClick={() => setEnlargedImage(msg.image)}
                            className="rounded-lg h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        )}
                        {isEditingThis ? (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              autoFocus
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditing(msg._id);
                                if (e.key === "Escape") cancelEditing();
                              }}
                              className="input input-sm input-bordered bg-slate-950/40 text-inherit w-full"
                            />
                            <button onClick={() => saveEditing(msg._id)}>
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEditing}>
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          msg.text && <p className="mt-2">{msg.text}</p>
                        )}
                      </>
                    )}

                    <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",

                      })}
                      {msg.isEdited && !msg.isDeleted && <span className="italic">(edited)</span>}
                      {isOwnMessage && !msg.isDeleted && (
                        msg.seen ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )
                      )}
                    </p>

                  </div>
                </div>
              );
            })}
            {((selectedUser.isBot && isBotThinking) || (!selectedUser.isBot && isTyping)) && (
              <div className="chat chat-start">
                <div
                  className={`chat-bubble flex items-center gap-1 ${selectedUser.isBot ? "bg-slate-800 text-blue-300" : "bg-slate-800 text-slate-200"
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

        ) : isMessagesLoading ? <MessagesLoadingSkeleton /> : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
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
