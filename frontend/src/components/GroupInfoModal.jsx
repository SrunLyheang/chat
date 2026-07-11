import { useEffect, useState } from "react";
import { XIcon, CheckIcon, UserMinusIcon, UserPlusIcon, LogOutIcon, PencilIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";
import { useI18nStore } from "../store/useI18nStore";

// View / manage a group: rename, add or remove members (admins only), and
// leave. `group` is the pseudo-selectedUser object with populated participants.
function GroupInfoModal({ group, onClose }) {
  const { allContacts, getAllContacts } = useChatStore();
  const { authUser } = useAuthStore();
  const { renameGroup, addParticipants, removeParticipant, leaveGroup } = useGroupStore();
  const { t } = useI18nStore();

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
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl border border-edge/50 bg-ground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-edge/50 px-5 py-4">
          <h3 className="font-medium text-content">{t("group.info")}</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-content">
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
                  className="flex-1 rounded-lg border border-edge/50 bg-surface/60 px-3 py-2 text-sm text-content focus:border-primary/50 focus:outline-none"
                />
                <button type="button" onClick={saveRename} className="text-primary hover:text-primary">
                  <CheckIcon className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setIsRenaming(false)} className="text-muted hover:text-content">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-semibold text-content">{group.fullName}</h4>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setNameDraft(group.fullName || "");
                      setIsRenaming(true);
                    }}
                    className="text-muted hover:text-content"
                    title={t("group.rename")}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <p className="mt-1 text-xs text-muted">
              {t((group.participants?.length || 0) === 1 ? "chat.member" : "chat.members", { count: group.participants?.length || 0 })}
            </p>
          </div>

          {/* Members */}
          <div className="space-y-1">
            {(group.participants || []).map((member) => {
              const mid = toId(member._id);
              const isMe = mid === myId;
              return (
                <div key={mid} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-surface/60">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="size-9 shrink-0 overflow-hidden rounded-full">
                      <img src={member.profilePic || "/avatar.png"} alt={member.fullName} />
                    </div>
                    <span className="truncate text-sm text-content">
                      {isMe ? t("chat.you") : member.fullName}
                    </span>
                    {adminIds.has(mid) && (
                      <span className="shrink-0 rounded bg-surface2/70 px-1.5 py-0.5 text-[10px] text-content">
                        {t("group.admin")}
                      </span>
                    )}
                  </div>
                  {isAdmin && !isMe && (
                    <button
                      type="button"
                      onClick={() => removeParticipant(group._id, mid)}
                      title={t("group.removeMember")}
                      className="shrink-0 rounded-full p-1.5 text-muted hover:bg-surface2 hover:text-rose-400"
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
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary"
                >
                  <UserPlusIcon className="h-4 w-4" /> {t("group.addMembers")}
                </button>
              ) : (
                <div className="rounded-lg border border-edge/50 p-2">
                  <div className="max-h-40 overflow-y-auto">
                    {addCandidates.length === 0 ? (
                      <p className="py-3 text-center text-xs text-muted">{t("group.noContactsToAdd")}</p>
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
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-surface/70"
                          >
                            <div className="size-8 shrink-0 overflow-hidden rounded-full">
                              <img src={c.profilePic || "/avatar.png"} alt={c.fullName} />
                            </div>
                            <span className="flex-1 truncate text-sm text-content">{c.fullName}</span>
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                picked ? "border-primary bg-primary/30 text-primary" : "border-edge"
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
                      className="rounded-lg px-3 py-1.5 text-xs text-content hover:bg-surface"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={toAdd.length === 0}
                      className="rounded-lg bg-primary/20 px-3 py-1.5 text-xs text-primary hover:bg-primary/30 disabled:opacity-40"
                    >
                      {t("group.add")} {toAdd.length > 0 ? `(${toAdd.length})` : ""}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-edge/50 p-4">
          <button
            type="button"
            onClick={handleLeave}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/40 py-2 text-sm text-rose-400 transition hover:bg-rose-500/10"
          >
            <LogOutIcon className="h-4 w-4" /> {t("group.leave")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupInfoModal;
