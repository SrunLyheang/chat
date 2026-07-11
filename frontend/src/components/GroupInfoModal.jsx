import { useEffect, useState } from "react";
import { XIcon, CheckIcon, UserMinusIcon, UserPlusIcon, LogOutIcon, PencilIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";

// View / manage a group: rename, add or remove members (admins only), and
// leave. `group` is the pseudo-selectedUser object with populated participants.
function GroupInfoModal({ group, onClose }) {
  const { allContacts, getAllContacts } = useChatStore();
  const { authUser } = useAuthStore();
  const { renameGroup, addParticipants, removeParticipant, leaveGroup } = useGroupStore();

  const toId = (v) => (v ? v.toString() : "");
  const myId = toId(authUser?._id);
  const isAdmin = (group.admins || []).some((id) => toId(id) === myId);

  const [nameDraft, setNameDraft] = useState(group.fullName || "");
  const [isRenaming, setIsRenaming] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [toAdd, setToAdd] = useState([]);

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (showAdd) getAllContacts();
  }, [showAdd, getAllContacts]);

  const participantIds = new Set((group.participants || []).map((p) => toId(p._id)));
  const adminIds = new Set((group.admins || []).map((id) => toId(id)));
  const addCandidates = allContacts.filter((c) => !c.isBot && !participantIds.has(toId(c._id)));

  const saveRename = async () => {
    if (!nameDraft.trim() || nameDraft.trim() === group.fullName) return setIsRenaming(false);
    const ok = await renameGroup(group._id, nameDraft.trim());
    if (ok) setIsRenaming(false);
  };

  const handleAdd = async () => {
    if (toAdd.length === 0) return;
    const ok = await addParticipants(group._id, toAdd);
    if (ok) {
      setToAdd([]);
      setShowAdd(false);
    }
  };

  const handleLeave = async () => {
    const ok = await leaveGroup(group._id);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl border border-slate-700/50 bg-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-4">
          <h3 className="font-medium text-slate-200">Group info</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {/* Name / rename */}
          <div className="mb-4">
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={80}
                  className="flex-1 rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
                />
                <button type="button" onClick={saveRename} className="text-cyan-400 hover:text-cyan-300">
                  <CheckIcon className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setIsRenaming(false)} className="text-slate-400 hover:text-slate-200">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-semibold text-slate-100">{group.fullName}</h4>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setNameDraft(group.fullName || "");
                      setIsRenaming(true);
                    }}
                    className="text-slate-500 hover:text-slate-300"
                    title="Rename group"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <p className="mt-1 text-xs text-slate-500">
              {group.participants?.length || 0} members
            </p>
          </div>

          {/* Members */}
          <div className="space-y-1">
            {(group.participants || []).map((member) => {
              const mid = toId(member._id);
              const isMe = mid === myId;
              return (
                <div key={mid} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-slate-800/60">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="size-9 shrink-0 overflow-hidden rounded-full">
                      <img src={member.profilePic || "/avatar.png"} alt={member.fullName} />
                    </div>
                    <span className="truncate text-sm text-slate-200">
                      {isMe ? "You" : member.fullName}
                    </span>
                    {adminIds.has(mid) && (
                      <span className="shrink-0 rounded bg-slate-700/70 px-1.5 py-0.5 text-[10px] text-slate-300">
                        admin
                      </span>
                    )}
                  </div>
                  {isAdmin && !isMe && (
                    <button
                      type="button"
                      onClick={() => removeParticipant(group._id, mid)}
                      title="Remove"
                      className="shrink-0 rounded-full p-1.5 text-slate-500 hover:bg-slate-700 hover:text-rose-400"
                    >
                      <UserMinusIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add members (admins) */}
          {isAdmin && (
            <div className="mt-3">
              {!showAdd ? (
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  <UserPlusIcon className="h-4 w-4" /> Add members
                </button>
              ) : (
                <div className="rounded-lg border border-slate-700/50 p-2">
                  <div className="max-h-40 overflow-y-auto">
                    {addCandidates.length === 0 ? (
                      <p className="py-3 text-center text-xs text-slate-500">No contacts to add</p>
                    ) : (
                      addCandidates.map((c) => {
                        const cid = toId(c._id);
                        const picked = toAdd.includes(cid);
                        return (
                          <button
                            key={cid}
                            type="button"
                            onClick={() =>
                              setToAdd((prev) => (picked ? prev.filter((x) => x !== cid) : [...prev, cid]))
                            }
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-slate-800/70"
                          >
                            <div className="size-8 shrink-0 overflow-hidden rounded-full">
                              <img src={c.profilePic || "/avatar.png"} alt={c.fullName} />
                            </div>
                            <span className="flex-1 truncate text-sm text-slate-200">{c.fullName}</span>
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                picked ? "border-cyan-400 bg-cyan-500/30 text-cyan-300" : "border-slate-600"
                              }`}
                            >
                              {picked && <CheckIcon className="h-3 w-3" />}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdd(false);
                        setToAdd([]);
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={toAdd.length === 0}
                      className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40"
                    >
                      Add {toAdd.length > 0 ? `(${toAdd.length})` : ""}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/50 p-4">
          <button
            type="button"
            onClick={handleLeave}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/40 py-2 text-sm text-rose-400 transition hover:bg-rose-500/10"
          >
            <LogOutIcon className="h-4 w-4" /> Leave group
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupInfoModal;
