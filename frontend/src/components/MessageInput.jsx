import { useState, useRef, useEffect } from 'react';
import { ImageIcon, SendIcon, X as XIcon } from 'lucide-react';
import useKeyboardSound from '../../../backend/src/hooks/useKeyboardSound';
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useI18nStore } from "../store/useI18nStore";
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
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { t } = useI18nStore();

  const replySenderName = replyingTo?.senderId === authUser?._id
    ? t("chat.you")
    : selectedUser?.nickname?.trim() || selectedUser?.fullName;
  const replyText = replyingTo?.isDeleted
    ? t("chat.deletedMessage")
    : replyingTo?.text || (replyingTo?.image ? t("chat.photo") : t("chat.message"));

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
      toast.error(t("chat.selectImage"));
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
    <div className="p-3 border-t border-edge/50">
      {replyingTo && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center gap-3 rounded-lg border border-edge bg-surface/80 px-3 py-2">
          <div className="min-w-0 flex-1 border-l-4 border-muted pl-3">
            <p className="text-xs font-semibold text-content">
              {t("chat.replyingTo", { name: replySenderName })}
            </p>
            <p className="truncate text-sm text-muted">
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
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface2 hover:text-content"
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
              className="w-20 h-20 object-cover rounded-lg border border-edge"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface flex items-center justify-center text-content hover:bg-surface2"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface/80 ${imagePreview ? "text-primary" : "text-muted hover:text-content"
            }`}
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <input
          ref={textInputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          className="flex-1 rounded-full border border-edge/50 bg-surface/60 px-4 py-2 text-sm text-content placeholder:text-muted focus:border-primary/50 focus:outline-none"
          placeholder={t("chat.typeMessage")}
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary bg-gradient-to-r from-primary to-primaryStrong text-onPrimary transition-all hover:from-primaryStrong hover:to-primaryStrong disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;