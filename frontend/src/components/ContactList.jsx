import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { SearchIcon, BotIcon } from "lucide-react";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUserLoading } = useChatStore();
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
  const filteredContacts = humanContacts.filter((contact) =>
    contact.fullName.toLowerCase().includes(search)
  );
  const filteredBots = botContacts.filter((bot) =>
    bot.fullName.toLowerCase().includes(search)
  );

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
          className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors mb-2 border border-cyan-500/20"
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
            className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
            onClick={() => setSelectedUser(contact)}
          >
            <div className="flex items-center gap-3">
              <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
                <div className="size-12 rounded-full">
                  <img src={contact.profilePic || "/avatar.png"} />
                </div>
              </div>
              <h4 className="text-slate-200 font-medium">{contact.fullName}</h4>
            </div>
          </div>
        ))
      )}
    </>
  );
}
export default ContactList;