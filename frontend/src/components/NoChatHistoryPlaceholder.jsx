import { MessageCircleIcon, SparklesIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const NoChatHistoryPlaceholder = ({ name }) => {
  const { sendMessage, selectedUser } = useChatStore();

  const handleQuickAction = async (text) => {
    if (!selectedUser) return;
    try {
      await sendMessage({ text });
    } catch (error) {
      console.error("Failed to send quick action message:", error);
    }
  };


  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-10 text-center shadow-2xl shadow-cyan-500/5">

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 via-cyan-400/10 to-transparent ring-1 ring-cyan-400/20">
          <MessageCircleIcon className="h-10 w-10 text-cyan-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
          Start chatting with
        </h2>

        <p className="mt-1 text-xl font-bold text-cyan-300">
          {name}
        </p>

        {/* Description */}
        <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-slate-400">
          Your conversation is empty for now. Send the first message and
          start connecting instantly.
        </p>

        {/* Divider */}
        <div className="my-8 flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-400/30"></div>

          <SparklesIcon className="h-4 w-4 text-cyan-400/70" />

          <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-400/30"></div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => handleQuickAction("Say Hello")}
            className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition-all duration-200 hover:border-cyan-400/40 hover:bg-cyan-500/20 hover:scale-105"
          >
            👋 Say Hello
          </button>

          <button
            type="button"
            onClick={() => handleQuickAction("How are you?")}
            className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition-all duration-200 hover:border-cyan-400/40 hover:bg-cyan-500/20 hover:scale-105"
          >
            😊 How are you?
          </button>

          <button
            type="button"
            onClick={() => handleQuickAction("Meet up soon?")}
            className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition-all duration-200 hover:border-cyan-400/40 hover:bg-cyan-500/20 hover:scale-105"
          >
            📅 Meet up soon?
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoChatHistoryPlaceholder;