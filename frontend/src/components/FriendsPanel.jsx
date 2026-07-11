import { useEffect } from "react";
import { CheckIcon, XIcon, UserMinusIcon, MessageSquareIcon } from "lucide-react";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useI18nStore } from "../store/useI18nStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";

// The "Friends" tab: a curated personal contact list, separate from the open
// "Contacts" directory. Shows incoming requests, sent (pending) requests, and
// accepted friends. Messaging anyone is still possible from Contacts — this
// tab is additive, not a gate.
function FriendsPanel() {
  const {
    friends,
    incomingRequests,
    sentRequests,
    isFriendsLoading,
    loadFriendData,
    acceptRequest,
    declineRequest,
    cancelRequest,
    unfriend,
  } = useFriendStore();
  const { setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { t } = useI18nStore();

  useEffect(() => {
    loadFriendData();
  }, [loadFriendData]);

  if (isFriendsLoading) return <UsersLoadingSkeleton />;

  const Avatar = ({ user }) => (
    <div className={`avatar ${onlineUsers.includes(user._id) ? "online" : "offline"}`}>
      <div className="size-11 rounded-full">
        <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
      </div>
    </div>
  );

  const isEmpty =
    friends.length === 0 && incomingRequests.length === 0 && sentRequests.length === 0;

  return (
    <div className="space-y-5">
      {incomingRequests.length > 0 && (
        <section>
          <h4 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("friends.requests")}
          </h4>
          {incomingRequests.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-surface/70"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar user={user} />
                <span className="truncate text-sm text-content">{user.fullName}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => acceptRequest(user)}
                  title={t("contacts.accept")}
                  className="rounded-full bg-primary/20 p-1.5 text-primary transition hover:bg-primary/30"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => declineRequest(user._id)}
                  title={t("friends.decline")}
                  className="rounded-full bg-surface2/60 p-1.5 text-content transition hover:bg-surface2"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {sentRequests.length > 0 && (
        <section>
          <h4 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("friends.pending")}
          </h4>
          {sentRequests.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-surface/70"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar user={user} />
                <span className="truncate text-sm text-content">{user.fullName}</span>
              </div>
              <button
                type="button"
                onClick={() => cancelRequest(user._id)}
                className="shrink-0 rounded-lg border border-edge px-2.5 py-1 text-xs text-content transition hover:bg-surface2"
              >
                {t("common.cancel")}
              </button>
            </div>
          ))}
        </section>
      )}

      <section>
        {friends.length > 0 && (
          <h4 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("friends.friends")}
          </h4>
        )}
        {friends.map((user) => (
          <div
            key={user._id}
            className="group flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-surface/70"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar user={user} />
              <span className="truncate text-sm text-content">{user.fullName}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedUser(user)}
                title={t("friends.message")}
                className="rounded-full p-1.5 text-muted transition hover:bg-surface2 hover:text-content"
              >
                <MessageSquareIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => unfriend(user._id)}
                title={t("friends.remove")}
                className="rounded-full p-1.5 text-muted opacity-0 transition hover:bg-surface2 hover:text-rose-400 group-hover:opacity-100"
              >
                <UserMinusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </section>

      {isEmpty && (
        <p className="mt-6 text-center text-sm text-muted">
          {t("friends.empty")}
        </p>
      )}
    </div>
  );
}

export default FriendsPanel;
