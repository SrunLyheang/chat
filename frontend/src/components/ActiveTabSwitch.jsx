
import { useChatStore } from "../store/useChatStore";
import { useI18nStore } from "../store/useI18nStore";



function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();
  const { t } = useI18nStore();

  return (
    <div className="tabs tabs-boxed bg-transparent p-2 m-2">
      <button
        onClick={() => setActiveTab("chats")}
        className={`tab ${activeTab === "chats" ? "bg-primary/20 text-primary" : "text-muted"
          }`}
      >
        {t("tabs.chats")}
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        className={`tab ${activeTab === "contacts" ? "bg-primary/20 text-primary" : "text-muted"
          }`}
      >
        {t("tabs.contacts")}
      </button>

      <button
        onClick={() => setActiveTab("friends")}
        className={`tab ${activeTab === "friends" ? "bg-primary/20 text-primary" : "text-muted"
          }`}
      >
        {t("tabs.friends")}
      </button>
    </div>
  );
}
export default ActiveTabSwitch;