/**
 * Super Pixel World - Creator Profile Modal (EditProfileModal)
 *
 * Implements:
 * - Wider and taller modal layout
 * - Author name input with maxLength = 20
 * - 10 new 256x256 avatar assets (avatar_1.png to avatar_10.png) in a 5x2 grid
 * - Large clear avatar cells without text labels
 * - Distinctive bright golden 3D frame for the selected avatar
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
  const [avatarId, setAvatarId] = useState<string>(
    currentProfile.avatarId || 'avatar_1'
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow letters, numbers, spaces, dashes (max 20 characters)
    const val = e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s_-]/g, '').slice(0, 20);
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
      subtitle="Настройте имя и аватар для подписи авторских уровней"
      icon={<User className="w-6 h-6 text-amber-400" />}
      badge="Геймдизайнер"
      badgeColor="amber"
      maxWidth="xl"
    >
      <div className="space-y-6 py-2 px-1">
        {/* Step 1: Name Input (Up to 20 characters) */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Имя автора (от 2 до 20 символов):</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-300/90">
              {name.length}/20
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Введите имя автора (до 20 символов)..."
              maxLength={20}
              className="w-full px-4 py-3 sm:py-3.5 text-base sm:text-lg font-bold bg-[#0B0F19] border-2 border-slate-700 focus:border-amber-400 rounded-2xl text-white outline-none transition-all shadow-inner placeholder-slate-500"
            />
          </div>
        </div>

        {/* Step 2: 10 Avatars Grid (5 columns, 2 rows, large square cells, no text under) */}
        <div className="space-y-3">
          <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Выберите аватарку:</span>
          </label>

          <div className="grid grid-cols-5 gap-2.5 sm:gap-4 p-2 sm:p-3 rounded-2xl bg-[#0B0F19]/60 border border-slate-800">
            {PRESET_AVATARS.map((av) => {
              const isSelected = avatarId === av.id;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => handleSelectAvatar(av.id)}
                  title={av.name || av.id}
                  className={`aspect-square w-full rounded-2xl flex items-center justify-center p-1.5 sm:p-2.5 transition-all cursor-pointer relative select-none ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500/25 to-amber-600/10 border-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6),0_6px_0_#B45309] scale-105 ring-2 ring-amber-300/80 z-10'
                      : 'bg-[#131B2E]/90 hover:bg-slate-800/90 border-2 border-slate-700/80 hover:border-slate-500 shadow-md hover:scale-105'
                  }`}
                >
                  {/* Selected Golden Corner Badge */}
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg border-2 border-slate-900 z-20 animate-in zoom-in-75">
                      <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                    </div>
                  )}

                  {/* Avatar 256x256 Image */}
                  <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center">
                    <img
                      src={av.imageUrl}
                      alt={av.name || av.id}
                      className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Save Button */}
        <button
          onClick={handleSave}
          disabled={!isReady}
          className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg select-none ${
            isReady
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_4px_0_#B45309] hover:shadow-[0_6px_0_#B45309] active:translate-y-1 active:shadow-[0_1px_0_#B45309]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <span>Сохранить профиль</span>
        </button>
      </div>
    </StudioModal>
  );
};
