import { useEffect, useState } from "react";
import { XIcon, SearchIcon, CheckIcon, UsersIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useI18nStore } from "../store/useI18nStore";

// Create a new group: name it and pick members from your contacts.
function CreateGroupModal({ onClose }) {
  const { allContacts, getAllContacts } = useChatStore();
  const { createGroup, isCreating } = useGroupStore();
  const { t } = useI18nStore();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]); // array of user ids

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const candidates = allContacts.filter((c) => !c.isBot);
  const term = search.trim().toLowerCase();
  const filtered = candidates.filter((c) => c.fullName.toLowerCase().includes(term));

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return;
    const ok = await createGroup(name.trim(), selected);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl border border-edge/50 bg-ground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-edge/50 px-5 py-4">
          <h3 className="flex items-center gap-2 font-medium text-content">
            <UsersIcon className="h-5 w-5 text-accent" /> {t("group.new")}
          </h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-content">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder={t("group.name")}
            className="w-full rounded-lg border border-edge/50 bg-surface/60 px-3 py-2 text-sm text-content placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("contacts.search")}
              className="w-full rounded-lg border border-edge/50 bg-surface/50 py-2 pl-9 pr-3 text-sm text-content placeholder:text-muted focus:border-primary/50 focus:outline-none"
            />
          </div>
          {selected.length > 0 && (
            <p className="px-1 text-xs text-muted">{t("group.selected", { count: selected.length })}</p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{t("contacts.notFound")}</p>
          ) : (
            filtered.map((c) => {
              const isSelected = selected.includes(c._id);
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => toggle(c._id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface/70"
                >
                  <div className="size-10 shrink-0 overflow-hidden rounded-full">
                    <img src={c.profilePic || "/avatar.png"} alt={c.fullName} />
                  </div>
                  <span className="flex-1 truncate text-sm text-content">{c.fullName}</span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      isSelected ? "border-primary bg-primary/30 text-primary" : "border-edge"
                    }`}
                  >
                    {isSelected && <CheckIcon className="h-3.5 w-3.5" />}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-edge/50 p-4">
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || selected.length === 0 || isCreating}
            className="w-full rounded-lg bg-gradient-to-r from-primary to-primaryStrong py-2 text-sm font-medium text-onPrimary transition hover:from-primaryStrong hover:to-primaryStrong disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCreating ? t("group.creating") : t("group.create")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupModal;
