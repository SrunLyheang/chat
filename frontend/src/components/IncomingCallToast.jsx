import { useCallStore } from "../store/useCallStore";
import { useI18nStore } from "../store/useI18nStore";
import { LoaderCircleIcon, PhoneIcon, PhoneOffIcon } from "lucide-react";

function IncomingCallToast() {
  const { incomingCall, answerCall, declineCall, isCallActionPending } = useCallStore();
  const { t } = useI18nStore();
  if (!incomingCall) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,420px)] rounded-2xl border border-primary/30 bg-ground/95 p-4 shadow-2xl shadow-primary/10 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-content font-semibold">{t("call.incoming", { name: incomingCall.callerName })}</p>
          <p className="text-muted text-sm">{t("call.answerOrDecline")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={answerCall}
            disabled={isCallActionPending}
            className="rounded-full bg-emerald-600 p-2.5 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
            aria-label={t("call.answer")}
          >
            {isCallActionPending ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <PhoneIcon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={declineCall}
            disabled={isCallActionPending}
            className="rounded-full bg-rose-600 p-2.5 text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
            aria-label={t("call.decline")}
          >
            <PhoneOffIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallToast;