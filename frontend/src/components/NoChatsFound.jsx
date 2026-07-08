import { MessageCircleIcon, UsersIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function NoChatsFound() {
  const { setActiveTab } = useChatStore();

  return (
    <div className="flex h-full items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-slate-700/50 bg-slate-800/40 p-8 text-center backdrop-blur-xl shadow-xl shadow-cyan-500/5">

        {/* Icon */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 via-cyan-400/10 to-transparent">
          <MessageCircleIcon className="h-10 w-10 text-cyan-400" />
          <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-2xl" />
        </div>

        {/* Heading */}
        <h3 className="text-xl font-semibold text-slate-100">
          No conversations yet
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm leading-6 text-slate-400">
          You haven't started chatting with anyone yet.
          Browse your contacts and start your first conversation.
        </p>

        {/* Button */}
        <button
          onClick={() => setActiveTab("contacts")}
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-300 transition-all duration-200 hover:border-cyan-400/40 hover:bg-cyan-500/20 hover:scale-[1.02] active:scale-95"
        >
          <UsersIcon className="h-4 w-4" />
          Find Contacts
        </button>
      </div>
    </div>
  );
}

export default NoChatsFound;