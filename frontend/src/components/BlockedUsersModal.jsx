import { useEffect } from "react";
import { XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

// Lists everyone the current user has blocked and lets them unblock.
// Blocked users are hidden from the normal contacts list, so this modal is
// the only place to see and undo blocks.
function BlockedUsersModal({ onClose }) {
  const { blockedUsers, getBlockedUsers, toggleBlockUser } = useChatStore();

  useEffect(() => {
    getBlockedUsers();
  }, [getBlockedUsers]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="blocked-users-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-700/50 bg-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-4">
          <h3 id="blocked-users-title" className="text-slate-200 font-medium">
            Blocked users
          </h3>
          <button
            type="button"
            aria-label="Close blocked users"
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-200"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-3">
          {blockedUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              You haven't blocked anyone.
            </p>
          ) : (
            blockedUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-slate-800/70"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="size-10 shrink-0 overflow-hidden rounded-full">
                    <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                  </div>
                  <span className="truncate text-sm text-slate-200">{user.fullName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBlockUser(user)}
                  className="shrink-0 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:bg-slate-700"
                >
                  Unblock
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default BlockedUsersModal;
