import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { SearchIcon, BotIcon } from "lucide-react";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, selectedUser, isUserLoading } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

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
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search contacts..."
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {filteredBots.map((bot) => (
        <div
          key={bot._id}
          className={`p-4 rounded-lg cursor-pointer transition-colors mb-2 border ${selectedUser?._id === bot._id
            ? "border-cyan-400/60 bg-cyan-500/15 shadow-sm shadow-cyan-500/10"
            : "border-transparent hover:bg-slate-800/70"
            }`}
          onClick={() => setSelectedUser(bot)}
        >
          <div className="flex items-center gap-3">
            <div className="avatar online">
              <div className="size-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <BotIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h4 className="text-slate-200 font-medium">
              {bot.fullName}
              <span className="text-xs text-blue-400 ml-1">AI</span>
            </h4>
          </div>
        </div>
      ))}

      {filteredContacts.length === 0 && filteredBots.length === 0 ? (
        <p className="text-slate-400 text-sm text-center mt-6">No contacts found</p>
      ) : (
        filteredContacts.map((contact) => (
          <div
            key={contact._id}
            className={`p-4 rounded-lg cursor-pointer transition-colors border ${selectedUser?._id === contact._id
              ? "border-cyan-400/60 bg-cyan-500/15 shadow-sm shadow-cyan-500/10"
              : "border-transparent hover:bg-slate-800/70"
              }`}
            onClick={() => setSelectedUser(contact)}
          >
            <div className="flex items-center gap-3">
              <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
                <div className="size-12 rounded-full">
                  <img src={contact.profilePic || "/avatar.png"} />
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="truncate text-slate-200 font-medium">
                  {contact.nickname?.trim() || contact.fullName}
                </h4>
                {contact.nickname?.trim() && (
                  <p className="truncate text-xs text-slate-500">{contact.fullName}</p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}
export default ContactList;