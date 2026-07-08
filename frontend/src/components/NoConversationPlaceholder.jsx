import { MessageCircleIcon, SparklesIcon } from "lucide-react";

const NoConversationPlaceholder = () => {
  return (
    <div className="flex h-full items-center justify-center px-8">
      <div className="w-full max-w-lg text-center">

        {/* Icon */}
        <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 via-cyan-400/10 to-transparent shadow-xl shadow-cyan-500/10">
          <MessageCircleIcon className="h-11 w-11 text-cyan-400" />

          {/* Glow */}
          <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-2xl" />
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">
          No Conversation Selected
        </h2>

        {/* Description */}
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-400">
          Choose someone from the sidebar to start chatting,
          continue an existing conversation, or make a new connection.
        </p>

        {/* Divider */}
        <div className="my-8 flex items-center justify-center gap-3">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-cyan-400/30" />
          <SparklesIcon className="h-4 w-4 text-cyan-400/70" />
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-cyan-400/30" />
        </div>

        {/* Tips */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur-sm">
          <div className="space-y-3 text-left text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                1
              </span>
              <span>Select a contact from the sidebar.</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                2
              </span>
              <span>Send a message or share an image.</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                3
              </span>
              <span>Stay connected in real time.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoConversationPlaceholder;