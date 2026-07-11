import { useEffect } from "react";
import { XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useI18nStore } from "../store/useI18nStore";

// Lists everyone the current user has blocked and lets them unblock.
// Blocked users are hidden from the normal contacts list, so this modal is
// the only place to see and undo blocks.
function BlockedUsersModal({ onClose }) {
  const { blockedUsers, getBlockedUsers, toggleBlockUser } = useChatStore();
  const { t } = useI18nStore();

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
        className="w-full max-w-md rounded-xl border border-edge/50 bg-ground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-edge/50 px-5 py-4">
          <h3 id="blocked-users-title" className="text-content font-medium">
            {t("blocked.title")}
          </h3>
          <button
            type="button"
            aria-label="Close blocked users"
            onClick={onClose}
            className="text-muted transition-colors hover:text-content"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-3">
          {blockedUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {t("blocked.empty")}
            </p>
          ) : (
            blockedUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-surface/70"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="size-10 shrink-0 overflow-hidden rounded-full">
                    <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                  </div>
                  <span className="truncate text-sm text-content">{user.fullName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBlockUser(user)}
                  className="shrink-0 rounded-lg border border-edge px-3 py-1.5 text-xs text-content transition-colors hover:bg-surface2"
                >
                  {t("blocked.unblock")}
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
