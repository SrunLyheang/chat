import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import { useChatStore } from "../store/useChatStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ContactList from "../components/ContactList";
import ProfileHeader from "../components/ProfileHeader";
import ChatList from "../components/ChatList";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  return (
    <div className="fixed inset-0 flex">
      <BorderAnimatedContainer>
        {/* left: full width on mobile/tablet when nothing is selected, fixed width on desktop */}
        <div
          className={`w-full lg:w-80 bg-slate-800/50 backdrop-blur-sm flex-col ${selectedUser ? "hidden lg:flex" : "flex"
            }`}
        >
          <ProfileHeader />
          <ActiveTabSwitch />

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? <ChatList /> : <ContactList />}
          </div>
        </div>

        {/* right side: full width on mobile/tablet once a chat is open */}
        <div
          className={`w-full lg:flex-1 flex-col bg-slate-900/50 backdrop-blur-sm ${selectedUser ? "flex" : "hidden lg:flex"
            }`}
        >
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}
export default ChatPage;