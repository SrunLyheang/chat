import { useState, useRef, useEffect } from "react";
import {
  LoaderIcon,
  LogOutIcon,
  VolumeOffIcon,
  Volume2Icon,
  BotIcon,
  ChevronDownIcon,
  ShieldBanIcon,
  MoreVerticalIcon,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useI18nStore, LANGS } from "../store/useI18nStore";
import BlockedUsersModal from "./BlockedUsersModal";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "./LanguageSwitcher";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const { logout, authUser, updateProfile, isUpdatingProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound, allContacts, getAllContacts, setSelectedUser } = useChatStore();
  const { t, lang, setLang } = useI18nStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isBotMenuOpen, setIsBotMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const botMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

  const bots = allContacts.filter((c) => c.isBot);

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (botMenuRef.current && !botMenuRef.current.contains(e.target)) {
        setIsBotMenuOpen(false);
      }
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target)
      ) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectBot = (bot) => {
    setSelectedUser(bot);
    setIsBotMenuOpen(false);
  };

  // With two languages a single button cycles; more languages later can turn
  // this into a menu like the theme picker.
  const toggleLang = () => {
    const currentIndex = LANGS.findIndex((l) => l.id === lang);
    const next = LANGS[(currentIndex + 1) % LANGS.length];
    setLang(next.id);
  };
  const currentLangLabel = LANGS.find((l) => l.id === lang)?.label || lang;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className="p-6 border-b border-edge/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* AVATAR */}
          <div className="avatar online">
            <button
              className="size-14 rounded-full overflow-hidden relative group disabled:cursor-not-allowed"
              onClick={() => fileInputRef.current.click()}
              disabled={isUpdatingProfile}
            >
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="User image"
                className="size-full object-cover"
              />
              {isUpdatingProfile ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <LoaderIcon className="size-5 text-white animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-xs">{t("profile.change")}</span>
                </div>
              )}
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUpdatingProfile}
            />
          </div>

          {/* USERNAME & ONLINE TEXT */}
          <div>
            <h3 className="text-content font-medium text-base max-w-[120px] xl:max-w-[180px] truncate">
              {authUser.fullName}
            </h3>

            <p className="text-muted text-xs">{t("profile.online")}</p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* THEME PICKER */}
          <ThemeSwitcher />

          {/* LANGUAGE TOGGLE */}
          <LanguageSwitcher />

          {/* AI ASSISTANT DROPDOWN — pick which bot to chat with */}
          {bots.length > 0 && (
            <div className="relative" ref={botMenuRef}>
              <button
                type="button"
                className="text-muted hover:text-primary transition-colors flex items-center gap-0.5"
                onClick={() => setIsBotMenuOpen((open) => !open)}
                title={t("profile.aiAssistant")}
              >
                <BotIcon className="size-5" />
                <ChevronDownIcon className="size-3" />
              </button>

              {isBotMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-edge/50 bg-ground shadow-lg z-20 overflow-hidden">
                  {bots.map((bot) => (
                    <button
                      key={bot._id}
                      type="button"
                      onClick={() => selectBot(bot)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-content hover:bg-surface transition-colors"
                    >
                      <div className="size-7 shrink-0 rounded-full bg-gradient-to-br from-primary to-primaryStrong flex items-center justify-center">
                        <BotIcon className="size-4 text-onPrimary" />
                      </div>
                      <span className="flex-1 truncate">{bot.fullName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="text-muted hover:text-primary transition-colors"
            >
              <MoreVerticalIcon className="size-5" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-edge/50 bg-ground shadow-lg z-20 overflow-hidden">

                {/* Language */}
                <button
                  onClick={() => {
                    toggleLang();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 flex justify-between items-center hover:bg-surface text-sm"
                >
                  <span>{t("profile.language")}</span>
                  <span>{currentLangLabel}</span>
                </button>

                {/* Sound */}
                <button
                  onClick={() => {
                    mouseClickSound.currentTime = 0;
                    mouseClickSound.play().catch(() => { });
                    toggleSound();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-surface text-sm"
                >
                  {isSoundEnabled ? (
                    <Volume2Icon className="size-4" />
                  ) : (
                    <VolumeOffIcon className="size-4" />
                  )}

                  {t("profile.sound")}
                </button>

                {/* Blocked */}
                <button
                  onClick={() => {
                    setIsBlockedModalOpen(true);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-surface text-sm"
                >
                  <ShieldBanIcon className="size-4" />
                  {t("profile.blockedUsers")}
                </button>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-surface text-sm text-red-500"
                >
                  <LogOutIcon className="size-4" />
                  {t("profile.logout")}
                </button>

              </div>
            )}
          </div>

        </div>
      </div>

      {isBlockedModalOpen && (
        <BlockedUsersModal onClose={() => setIsBlockedModalOpen(false)} />
      )}
    </div>
  );
}
export default ProfileHeader;
