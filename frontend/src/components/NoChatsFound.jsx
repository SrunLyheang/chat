import { MessageCircleIcon, UsersIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useI18nStore } from "../store/useI18nStore";

function NoChatsFound() {
  const { setActiveTab } = useChatStore();
  const { t } = useI18nStore();

  return (
    <div className="flex h-full items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-edge/50 bg-surface/40 p-8 text-center backdrop-blur-xl shadow-xl shadow-primary/5">

        {/* Icon */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
          <MessageCircleIcon className="h-10 w-10 text-primary" />
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
        </div>

        {/* Heading */}
        <h3 className="text-xl font-semibold text-content">
          {t("placeholder.noChats.title")}
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm leading-6 text-muted">
          {t("placeholder.noChats.desc")}
        </p>

        {/* Button */}
        <button
          onClick={() => setActiveTab("contacts")}
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-medium text-primary transition-all duration-200 hover:border-primary/40 hover:bg-primary/20 hover:scale-[1.02] active:scale-95"
        >
          <UsersIcon className="h-4 w-4" />
          {t("placeholder.noChats.cta")}
        </button>
      </div>
    </div>
  );
}

export default NoChatsFound;