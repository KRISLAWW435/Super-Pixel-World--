/**
 * Pixel Studio Pro - Creator Profile Modal (EditProfileModal)
 * Uses unified StudioModal shell.
 */

import React, { useState } from 'react';
import { Check, User, Sparkles } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { ProfileManager } from '../services/storageManager';
import { PRESET_AVATARS, UserProfile } from '../types/storage';
import { StudioModal } from './StudioModal';

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
    <StudioModal
      isOpen={isOpen}
      onClose={onClose}
      title="Профиль создателя"
      subtitle="Имя и аватарка для подписи авторских уровней"
      icon={<User className="w-5 h-5 text-amber-400" />}
      badge="Геймдизайнер"
      badgeColor="amber"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Имя автора (от 2 до 12 символов):</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Введите имя..."
              maxLength={12}
              className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#0B0F19] border border-slate-700 focus:border-amber-400 rounded-xl text-white outline-none transition-all shadow-inner"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
              {name.length}/12
            </div>
          </div>
        </div>

        {/* Avatars Grid */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Выберите аватарку:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AVATARS.map((av) => {
              const isSelected = avatarId === av.id;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => handleSelectAvatar(av.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 text-white'
                      : 'bg-[#0B0F19]/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-700">
                    <img
                      src={av.imageUrl}
                      alt={av.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <div className="text-[11px] font-bold text-center leading-tight truncate w-full">
                    {av.name.split(' ')[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Save CTA */}
        <button
          onClick={handleSave}
          disabled={!isReady}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
            isReady
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20 active:scale-98'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <span>Сохранить профиль</span>
        </button>
      </div>
    </StudioModal>
  );
};
