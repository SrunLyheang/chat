import { useState, useRef, useEffect } from 'react';
import { ImageIcon, SendIcon, X as XIcon } from 'lucide-react';
import useKeyboardSound from '../../../backend/src/hooks/useKeyboardSound';
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from 'react-hot-toast';

const TYPING_TIMEOUT = 1500;

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    sendMessage,
    isSoundEnabled,
    startTyping,
    stopTyping,
    replyingTo,
    clearReplyingTo,
    selectedUser,
    rateLimitedBots, // 1. Added rateLimitedBots to the chat store destructuring
  } = useChatStore();
  const { authUser } = useAuthStore();

  // 2. Calculated bot limit state at the component level so JSX can read it
  const limitedUntil = rateLimitedBots?.[selectedUser?._id];
  const isBotLimited = selectedUser?.isBot && limitedUntil && new Date(limitedUntil) > new Date();

  const replySenderName = replyingTo?.senderId === authUser?._id ? "You" : selectedUser?.fullName;
  const replyText = replyingTo?.isDeleted
    ? "Deleted message"
    : replyingTo?.text || (replyingTo?.image ? "Photo" : "Message");

  const handleTextChange = (e) => {
    setText(e.target.value);
    isSoundEnabled && playRandomKeyStrokeSound();

    startTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_TIMEOUT);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isBotLimited) return; // 3. Added the bot limit check right after the empty-check

    if (isSoundEnabled) playRandomKeyStrokeSound();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    stopTyping();

    sendMessage({
      text: text.trim(),
      image: imagePreview
    });

    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      stopTyping();
    };

  }, [stopTyping]);

  useEffect(() => {
    if (replyingTo) textInputRef.current?.focus();
  }, [replyingTo]);

  return (
    <div className="p-4 border-t border-slate-700/50">
      {replyingTo && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2">
          <div className="min-w-0 flex-1 border-l-4 border-slate-500 pl-3">
            <p className="text-xs font-semibold text-slate-200">
              Replying to {replySenderName}
            </p>
            <p className="truncate text-sm text-slate-400">
              {replyText}
            </p>
          </div>
          {replyingTo.image && !replyingTo.isDeleted && (
            <img
              src={replyingTo.image}
              alt="Reply"
              className="h-11 w-11 rounded-md object-cover"
            />
          )}
          <button
            type="button"
            onClick={clearReplyingTo}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-slate-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex space-x-4">
        {/* 4. Updated placeholder and added disabled state to text input */}
        <input
          ref={textInputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          disabled={isBotLimited}
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={isBotLimited ? "Bot has hit message limit, can not chat now" : "Type your message..."}
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
        <button
          type="button"
          disabled={isBotLimited}
          onClick={() => fileInputRef.current?.click()}
          className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${imagePreview ? "text-cyan-500" : ""
            }`}
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        {/* 5. Updated disabled attribute on the submit button */}
        <button
          type="submit"
          disabled={(!text.trim() && !imagePreview) || isBotLimited}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;