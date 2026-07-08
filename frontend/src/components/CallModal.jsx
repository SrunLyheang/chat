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

function CallModal() {
  const { videoClient, activeCall, handleCallLeft, callStatus, isCallActionPending } = useCallStore();

  if (!activeCall || !videoClient) {
    if (callStatus === "connecting" || isCallActionPending) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-cyan-500/20 bg-slate-900/90 p-6 text-center shadow-2xl shadow-cyan-500/10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
              <LoaderCircleIcon className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Connecting the call</h3>
            <p className="mt-2 text-sm text-slate-400">Please wait while the connection is being set up.</p>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-3 backdrop-blur-sm sm:p-4">
      <div className="h-full w-full max-w-7xl overflow-hidden rounded-[28px] border border-slate-700/70 bg-slate-900/80 shadow-2xl shadow-black/30">
        <StreamVideo client={videoClient}>
          <StreamCall call={activeCall}>
            <StreamTheme>
              <SpeakerLayout participantBarPosition="right" />
              <CallControls onLeave={handleCallLeft} />
            </StreamTheme>
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  );
}

export default CallModal;