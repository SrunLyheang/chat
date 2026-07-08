import { useCallStore } from "../store/useCallStore";
import { LoaderCircleIcon, PhoneIcon, PhoneOffIcon } from "lucide-react";

function IncomingCallToast() {
  const { incomingCall, answerCall, declineCall, isCallActionPending } = useCallStore();
  if (!incomingCall) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,420px)] rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-slate-100 font-semibold">{incomingCall.callerName} is calling</p>
          <p className="text-slate-400 text-sm">Answer or decline to continue.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={answerCall}
            disabled={isCallActionPending}
            className="rounded-full bg-emerald-600 p-2.5 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
            aria-label="Answer call"
          >
            {isCallActionPending ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <PhoneIcon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={declineCall}
            disabled={isCallActionPending}
            className="rounded-full bg-rose-600 p-2.5 text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
            aria-label="Decline call"
          >
            <PhoneOffIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallToast;