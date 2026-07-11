import {
  StreamVideo,
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { LoaderCircleIcon } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useI18nStore } from "../store/useI18nStore";

function CallModal() {
  const { videoClient, activeCall, leaveCall, callStatus, isCallActionPending } = useCallStore();
  const { t } = useI18nStore();

  if (!activeCall || !videoClient) {
    if (callStatus === "connecting" || isCallActionPending) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ground/95 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-primary/20 bg-ground/90 p-6 text-center shadow-2xl shadow-primary/10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <LoaderCircleIcon className="h-6 w-6 animate-spin text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-content">{t("call.connecting")}</h3>
            <p className="mt-2 text-sm text-muted">{t("call.connectingDesc")}</p>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ground/95 p-3 backdrop-blur-sm sm:p-4">
      <div className="h-full w-full max-w-7xl overflow-hidden rounded-[28px] border border-edge/70 bg-ground/80 shadow-2xl shadow-black/30">
        <StreamVideo client={videoClient}>
          <StreamCall call={activeCall}>
            <StreamTheme>
              <SpeakerLayout participantBarPosition="right" />
              <CallControls onLeave={leaveCall} />
            </StreamTheme>
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  );
}

export default CallModal;