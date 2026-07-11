import { useEffect } from "react";
import { CheckIcon, XIcon, UserMinusIcon, MessageSquareIcon } from "lucide-react";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
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
          <h4 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Requests
          </h4>
          {incomingRequests.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-slate-800/70"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar user={user} />
                <span className="truncate text-sm text-slate-200">{user.fullName}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => acceptRequest(user)}
                  title="Accept"
                  className="rounded-full bg-cyan-500/20 p-1.5 text-cyan-400 transition hover:bg-cyan-500/30"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => declineRequest(user._id)}
                  title="Decline"
                  className="rounded-full bg-slate-700/60 p-1.5 text-slate-300 transition hover:bg-slate-700"
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
          <h4 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pending
          </h4>
          {sentRequests.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-slate-800/70"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar user={user} />
                <span className="truncate text-sm text-slate-200">{user.fullName}</span>
              </div>
              <button
                type="button"
                onClick={() => cancelRequest(user._id)}
                className="shrink-0 rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          ))}
        </section>
      )}

      <section>
        {friends.length > 0 && (
          <h4 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Friends
          </h4>
        )}
        {friends.map((user) => (
          <div
            key={user._id}
            className="group flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-slate-800/70"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar user={user} />
              <span className="truncate text-sm text-slate-200">{user.fullName}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedUser(user)}
                title="Message"
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
              >
                <MessageSquareIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => unfriend(user._id)}
                title="Remove friend"
                className="rounded-full p-1.5 text-slate-500 opacity-0 transition hover:bg-slate-700 hover:text-rose-400 group-hover:opacity-100"
              >
                <UserMinusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </section>

      {isEmpty && (
        <p className="mt-6 text-center text-sm text-slate-400">
          No friends yet. Add someone from the Contacts tab.
        </p>
      )}
    </div>
  );
}

export default FriendsPanel;
