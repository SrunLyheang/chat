import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import { useChatStore } from "../store/useChatStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ContactList from "../components/ContactList";
import ProfileHeader from "../components/ProfileHeader";
import ChatList from "../components/ChatList";
import FriendsPanel from "../components/FriendsPanel";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();

  const renderSidebarList = () => {
    if (activeTab === "chats") return <ChatList />;
    if (activeTab === "friends") return <FriendsPanel />;
    return <ContactList />;
  };
  return (
    <div className="fixed inset-0 flex">
      <BorderAnimatedContainer>
        {/* left: full width on mobile when nothing is selected, fixed width from md up */}
        <div
          className={`w-full md:w-72 lg:w-80 bg-slate-800/50 backdrop-blur-sm flex-col ${selectedUser ? "hidden md:flex" : "flex"
            }`}
        >
          <ProfileHeader />
          <ActiveTabSwitch />

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {renderSidebarList()}
          </div>
        </div>

        {/* right side: full width on mobile once a chat is open */}
        <div
          className={`w-full md:flex-1 flex-col bg-slate-900/50 backdrop-blur-sm ${selectedUser ? "flex" : "hidden md:flex"
            }`}
        >
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}
export default ChatPage;