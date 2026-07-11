import { MessageCircleIcon, SparklesIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useI18nStore } from "../store/useI18nStore";

const NoChatHistoryPlaceholder = ({ name }) => {
  const { sendMessage, selectedUser } = useChatStore();
  const { t } = useI18nStore();

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
      <div className="w-full max-w-lg rounded-3xl border border-edge/50 bg-surface/40 backdrop-blur-xl p-10 text-center shadow-2xl shadow-primary/5">

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/20">
          <MessageCircleIcon className="h-10 w-10 text-primary" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold tracking-tight text-content">
          {t("placeholder.noHistory.title")}
        </h2>

        <p className="mt-1 text-xl font-bold text-primary">
          {name}
        </p>

        {/* Description */}
        <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-muted">
          {t("placeholder.noHistory.desc")}
        </p>

        {/* Divider */}
        <div className="my-8 flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/30"></div>

          <SparklesIcon className="h-4 w-4 text-primary/70" />

          <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/30"></div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => handleQuickAction(t("placeholder.noHistory.hello").slice(3))}
            className="rounded-full border border-primary/20 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition-all duration-200 hover:border-primary/40 hover:bg-primary/20 hover:scale-105"
          >
            {t("placeholder.noHistory.hello")}
          </button>

          <button
            type="button"
            onClick={() => handleQuickAction(t("placeholder.noHistory.howAreYou").slice(3))}
            className="rounded-full border border-primary/20 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition-all duration-200 hover:border-primary/40 hover:bg-primary/20 hover:scale-105"
          >
            {t("placeholder.noHistory.howAreYou")}
          </button>

          <button
            type="button"
            onClick={() => handleQuickAction(t("placeholder.noHistory.meetUp").slice(3))}
            className="rounded-full border border-primary/20 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition-all duration-200 hover:border-primary/40 hover:bg-primary/20 hover:scale-105"
          >
            {t("placeholder.noHistory.meetUp")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoChatHistoryPlaceholder;