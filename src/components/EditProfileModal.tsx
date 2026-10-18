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
    const updated = ProfileManager.updateProfile(currentProfile.id, {
      name: name.trim(),
      avatarId,
    });
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
      <div className="space-y-6 py-2 px-1 text-[var(--text-main)]">
        {/* Step 1: Name Input (Up to 20 characters) */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-bold text-[var(--text-main)] flex items-center justify-between font-body">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-amber)]" />
              <span>Имя автора (от 2 до 20 символов):</span>
            </span>
            <span className="text-xs font-body font-bold text-[var(--accent-amber)]">
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
              className="w-full px-4 py-3 sm:py-3.5 text-base sm:text-lg font-bold font-body bg-[var(--slot-bg)] border-2 border-[var(--border-color)] focus:border-[var(--accent-amber)] rounded-[4px] text-[var(--text-main)] outline-none transition-all shadow-inner placeholder-[var(--text-muted)]"
            />
          </div>
        </div>

        {/* Step 2: 10 Avatars Grid (5 columns, 2 rows, large square cells, no text under) */}
        <div className="space-y-3">
          <label className="text-xs sm:text-sm font-bold text-[var(--text-main)] flex items-center gap-2 font-body">
            <Sparkles className="w-4 h-4 text-[var(--accent-emerald)]" />
            <span>Выберите аватарку:</span>
          </label>

          <div className="grid grid-cols-5 gap-2.5 sm:gap-4 p-2 sm:p-3 rounded-[4px] bg-[var(--slot-bg)] border-2 border-[var(--border-color)]">
            {PRESET_AVATARS.map((av) => {
              const isSelected = avatarId === av.id;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => handleSelectAvatar(av.id)}
                  title={av.name || av.id}
                  className={`aspect-square w-full rounded-[4px] flex items-center justify-center p-1.5 sm:p-2.5 transition-all cursor-pointer relative select-none ${
                    isSelected
                      ? 'bg-[var(--accent-amber)]/20 border-4 border-[var(--accent-amber)] shadow-[2px_2px_0px_var(--shadow-color)] scale-105 z-10'
                      : 'bg-[var(--card-bg)] hover:bg-[var(--card-subtle)] border-2 border-[var(--border-color)] hover:border-[var(--accent-amber)] shadow-sm hover:scale-105'
                  }`}
                >
                  {/* Selected Golden Corner Badge */}
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-[2px] bg-[var(--accent-amber)] text-slate-950 flex items-center justify-center font-bold shadow-md border border-[var(--border-color)] z-20 animate-in zoom-in-75">
                      <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                    </div>
                  )}

                  {/* Avatar 256x256 Image */}
                  <div className="w-full h-full rounded-[2px] overflow-hidden flex items-center justify-center">
                    <img
                      src={av.imageUrl}
                      alt={av.name || av.id}
                      className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                      style={{ imageRendering: 'pixelated' }}
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
          className={`retro-btn w-full py-3.5 px-6 rounded-[4px] font-pixel text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer select-none border-4 border-[var(--border-color)] shadow-[4px_4px_0px_var(--shadow-color)] ${
            isReady
              ? 'bg-[var(--accent-emerald)] hover:brightness-110 text-white active:translate-y-1'
              : 'bg-[var(--card-subtle)] text-[var(--text-muted)] cursor-not-allowed opacity-60'
          }`}
        >
          <span>Сохранить профиль</span>
        </button>
      </div>
    </StudioModal>
  );
};
