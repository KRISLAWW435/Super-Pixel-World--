/**
 * Super Pixel World - Edit Profile Mini-Modal
 * Opens when player clicks on their avatar in the top bar.
 * Allows changing the name or picking a new avatar.
 */

import React, { useState } from 'react';
import { Check, User, X, Sparkles } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { ProfileManager } from '../services/storageManager';
import { PRESET_AVATARS, UserProfile } from '../types/storage';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onProfileUpdated,
}) => {
  const [name, setName] = useState<string>(currentProfile.name);
  const [avatarId, setAvatarId] = useState<string>(currentProfile.avatarId);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s_-]/g, '').slice(0, 12);
    setName(val);
  };

  const handleSelectAvatar = (id: string) => {
    setAvatarId(id);
    sound.playSelect();
  };

  const handleSave = () => {
    if (name.trim().length < 2) return;
    sound.playCoin();
    ProfileManager.updateName(name.trim());
    const updated = ProfileManager.updateAvatar(avatarId);
    if (updated) {
      onProfileUpdated(updated);
    }
    onClose();
  };

  const isReady = name.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-slate-900 border-4 border-amber-400/80 rounded-3xl shadow-2xl shadow-indigo-950/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b-2 border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-lg">
              ✨
            </div>
            <div>
              <h3 className="font-black text-white text-base">
                Мой профиль
              </h3>
              <p className="text-xs text-slate-400">
                Сменить имя или аватарку
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Твоё имя:</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              maxLength={12}
              className="w-full px-4 py-3 text-base font-bold bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-xl text-white outline-none"
            />
          </div>

          {/* Avatars Grid */}
          <div className="space-y-2">
            <label className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Выбери новую аватарку:</span>
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {PRESET_AVATARS.map((item) => {
                const isSelected = avatarId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectAvatar(item.id)}
                    className={`relative p-2 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? `${item.borderColor} bg-slate-800 ring-2 ring-amber-400/50 scale-105`
                        : 'border-slate-850 bg-slate-950/60 hover:bg-slate-800/60'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <div
                      className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-sm shrink-0"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold truncate max-w-full ${
                        isSelected ? 'text-amber-300' : 'text-slate-300'
                      }`}
                    >
                      {item.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={!isReady}
              className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isReady
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>СОХРАНИТЬ ИЗМЕНЕНИЯ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
