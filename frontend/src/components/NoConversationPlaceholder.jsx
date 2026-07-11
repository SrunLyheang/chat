import { MessageCircleIcon, SparklesIcon } from "lucide-react";
import { useI18nStore } from "../store/useI18nStore";

const NoConversationPlaceholder = () => {
  const { t } = useI18nStore();
  return (
    <div className="flex h-full items-center justify-center px-8">
      <div className="w-full max-w-lg text-center">

        {/* Icon */}
        <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-xl shadow-primary/10">
          <MessageCircleIcon className="h-11 w-11 text-primary" />

          {/* Glow */}
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold tracking-tight text-content">
          {t("placeholder.noConv.title")}
        </h2>

        {/* Description */}
        <p className="mx-auto mt-4 max-w-md leading-7 text-muted">
          {t("placeholder.noConv.desc")}
        </p>

        {/* Divider */}
        <div className="my-8 flex items-center justify-center gap-3">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-primary/30" />
          <SparklesIcon className="h-4 w-4 text-primary/70" />
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-primary/30" />
        </div>

        {/* Tips */}
        <div className="rounded-2xl border border-edge/50 bg-surface/40 p-5 backdrop-blur-sm">
          <div className="space-y-3 text-left text-sm text-content">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                1
              </span>
              <span>{t("placeholder.noConv.tip1")}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                2
              </span>
              <span>{t("placeholder.noConv.tip2")}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                3
              </span>
              <span>{t("placeholder.noConv.tip3")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoConversationPlaceholder;