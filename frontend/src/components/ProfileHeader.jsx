import { useState, useRef, useEffect } from "react";
import { LoaderIcon, LogOutIcon, VolumeOffIcon, Volume2Icon, BotIcon, ChevronDownIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const { logout, authUser, updateProfile, isUpdatingProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound, allContacts, getAllContacts, setSelectedUser } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isBotMenuOpen, setIsBotMenuOpen] = useState(false);

  const fileInputRef = useRef(null);
  const botMenuRef = useRef(null);

  const bots = allContacts.filter((c) => c.isBot);

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (botMenuRef.current && !botMenuRef.current.contains(e.target)) {
        setIsBotMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectBot = (bot) => {
    setSelectedUser(bot);
    setIsBotMenuOpen(false);
  };

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
    <div className="p-6 border-b border-slate-700/50">
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
                  <span className="text-white text-xs">Change</span>
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
            <h3 className="text-slate-200 font-medium text-base max-w-[180px] truncate">
              {authUser.fullName}
            </h3>

            <p className="text-slate-400 text-xs">Online</p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-4 items-center">
          {/* AI ASSISTANT DROPDOWN — pick which bot to chat with */}
          {bots.length > 0 && (
            <div className="relative" ref={botMenuRef}>
              <button
                type="button"
                className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-0.5"
                onClick={() => setIsBotMenuOpen((open) => !open)}
                title="Chat with an AI Assistant"
              >
                <BotIcon className="size-5" />
                <ChevronDownIcon className="size-3" />
              </button>

              {isBotMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-slate-700/50 bg-slate-900 shadow-lg z-20 overflow-hidden">
                  {bots.map((bot) => (
                    <button
                      key={bot._id}
                      type="button"
                      onClick={() => selectBot(bot)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <div className="size-7 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                        <BotIcon className="size-4 text-white" />
                      </div>
                      <span className="flex-1 truncate">{bot.fullName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LOGOUT BTN */}
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors"
            onClick={logout}
          >
            <LogOutIcon className="size-5" />
          </button>

          {/* SOUND TOGGLE BTN */}
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors"
            onClick={() => {
              mouseClickSound.currentTime = 0;
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              toggleSound();
            }}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-5" />
            ) : (
              <VolumeOffIcon className="size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export default ProfileHeader;