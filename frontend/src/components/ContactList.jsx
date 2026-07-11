import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useI18nStore } from "../store/useI18nStore";
import { SearchIcon, BotIcon, UserPlusIcon, CheckIcon, ClockIcon } from "lucide-react";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, selectedUser, isUserLoading } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { relationshipTo, sendRequest, acceptRequest, loadFriendData } = useFriendStore();
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useI18nStore();

  useEffect(() => {
    getAllContacts();
    // Needed so each row can reflect the current friend/request state.
    loadFriendData();
  }, [getAllContacts, loadFriendData]);

  // One-click friend affordance per contact row. Stops propagation so it
  // doesn't also open the chat.
  const renderFriendButton = (contact) => {
    const relationship = relationshipTo(contact._id);
    const stop = (fn) => (e) => {
      e.stopPropagation();
      fn();
    };

    if (relationship === "friends") {
      return (
        <span className="flex shrink-0 items-center gap-1 text-xs text-primary" title={t("contacts.friends")}>
          <CheckIcon className="h-4 w-4" />
        </span>
      );
    }
    if (relationship === "sent") {
      return (
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted" title={t("contacts.requestPending")}>
          <ClockIcon className="h-4 w-4" />
        </span>
      );
    }
    if (relationship === "incoming") {
      return (
        <button
          type="button"
          onClick={stop(() => acceptRequest(contact))}
          title={t("contacts.acceptRequest")}
          className="shrink-0 rounded-lg bg-primary/20 px-2.5 py-1 text-xs text-primary transition hover:bg-primary/30"
        >
          {t("contacts.accept")}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={stop(() => sendRequest(contact))}
        title={t("contacts.addFriend")}
        className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-surface2 hover:text-primary"
      >
        <UserPlusIcon className="h-4 w-4" />
      </button>
    );
  };

  if (isUserLoading) return <UsersLoadingSkeleton />;

  const contactsExcludingSelf = allContacts.filter(
    (contact) => contact._id !== authUser._id
  );

  const botContacts = contactsExcludingSelf.filter((c) => c.isBot);
  const humanContacts = contactsExcludingSelf.filter((c) => !c.isBot);

  const search = searchTerm.trim().toLowerCase();
  const matchesSearch = (user) =>
    user.fullName.toLowerCase().includes(search) ||
    (user.nickname || "").toLowerCase().includes(search);
  const filteredContacts = humanContacts.filter(matchesSearch);
  const filteredBots = botContacts.filter(matchesSearch);

  return (
    <>
      <div className="relative mb-3">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("contacts.search")}
          className="w-full bg-surface/50 border border-edge/50 rounded-lg py-2 pl-9 pr-3 text-sm text-content placeholder:text-muted focus:outline-none focus:border-primary/50"
        />
      </div>

      {filteredBots.map((bot) => (
        <div
          key={bot._id}
          className={`p-4 rounded-lg cursor-pointer transition-colors mb-2 border ${selectedUser?._id === bot._id
            ? "border-primary/60 bg-primary/15 shadow-sm shadow-primary/10"
            : "border-transparent hover:bg-surface/70"
            }`}
          onClick={() => setSelectedUser(bot)}
        >
          <div className="flex items-center gap-3">
            <div className="avatar online">
              <div className="size-12 rounded-full bg-gradient-to-br from-primary to-primaryStrong flex items-center justify-center">
                <BotIcon className="w-6 h-6 text-onPrimary" />
              </div>
            </div>
            <h4 className="text-content font-medium">
              {bot.fullName}
              <span className="text-xs text-primary ml-1">AI</span>
            </h4>
          </div>
        </div>
      ))}

      {filteredContacts.length === 0 && filteredBots.length === 0 ? (
        <p className="text-muted text-sm text-center mt-6">{t("contacts.notFound")}</p>
      ) : (
        filteredContacts.map((contact) => (
          <div
            key={contact._id}
            className={`p-4 rounded-lg cursor-pointer transition-colors border ${selectedUser?._id === contact._id
              ? "border-primary/60 bg-primary/15 shadow-sm shadow-primary/10"
              : "border-transparent hover:bg-surface/70"
              }`}
            onClick={() => setSelectedUser(contact)}
          >
            <div className="flex items-center gap-3">
              <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
                <div className="size-12 rounded-full">
                  <img src={contact.profilePic || "/avatar.png"} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-content font-medium">
                  {contact.nickname?.trim() || contact.fullName}
                </h4>
                {contact.nickname?.trim() && (
                  <p className="truncate text-xs text-muted">{contact.fullName}</p>
                )}
              </div>
              {renderFriendButton(contact)}
            </div>
          </div>
        ))
      )}
    </>
  );
}
export default ContactList;