/**
 * Super Pixel World - Profile Creation Screen
 * 16-Bit Retro Console modal dialog for creating a creator profile.
 * High z-index (z-[100]), clean menu_bg.webp background with zero murky dimming overlays.
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Check, User, ArrowRight, X } from 'lucide-react';
import menuBgImg from '../assets/menu_bg.webp';
import { sound } from '../audio/soundEngine';
import { ProfileManager } from '../services/storageManager';
import { PRESET_AVATARS, UserProfile } from '../types/storage';

interface ProfileCreationScreenProps {
  onProfileCreated: (profile: UserProfile) => void;
  onCancel?: () => void;
}

export const ProfileCreationScreen: React.FC<ProfileCreationScreenProps> = ({
  onProfileCreated,
  onCancel,
}) => {
  const [name, setName] = useState<string>('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('avatar_1');
  const [errorText, setErrorText] = useState<string>('');

  // ESC key listener to cancel if onCancel is provided
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCancel) {
        sound.playClick();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Validate name (letters, numbers, underscores, max 20 chars)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const filtered = val.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s_-]/g, '').slice(0, 20);
    setName(filtered);
    if (filtered.trim().length > 0) {
      setErrorText('');
    }
  };

  const handleSelectAvatar = (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    sound.playSelect();
  };

  const isReady = name.trim().length >= 2 && Boolean(selectedAvatarId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady) {
      if (name.trim().length < 2) {
        setErrorText('ВВЕДИ ИМЯ (ОТ 2 ДО 20 БУКВ)!');
      }
      return;
    }

    sound.playCoin();
    const profile = ProfileManager.createProfile(name.trim(), selectedAvatarId);
    onProfileCreated(profile);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none"
      style={{
        backgroundImage: `url(${menuBgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background image layer for guaranteed high fidelity without murky darkening */}
      <img
        src={menuBgImg}
        alt="Background"
        className="fixed inset-0 w-full h-full object-cover object-center pointer-events-none select-none -z-10"
      />

      <div className="relative w-full max-w-2xl retro-modal p-6 sm:p-8 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-150 text-[var(--text-main)] rounded-[4px] border-4 border-[var(--border-color)] shadow-[6px_6px_0px_var(--shadow-color)] bg-[var(--panel-bg)]">
        {/* Optional Close button if cancellation is supported */}
        {onCancel && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onCancel();
            }}
            title="Закрыть"
            className="retro-btn-sm absolute top-4 right-4 w-8 h-8 rounded-[4px] bg-[var(--accent-rose)] hover:brightness-110 text-white flex items-center justify-center cursor-pointer border-[3px] border-[var(--border-color)] shadow-[2px_2px_0px_var(--shadow-color)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-lg sm:text-xl font-pixel uppercase tracking-wider text-[var(--text-main)]">
            СОЗДАНИЕ ПРОФИЛЯ АВТОРА
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-body font-medium max-w-md mx-auto">
            Назовите своего создателя миров и выберите аватарку для подписи уровней!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Step 1: Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-body font-bold text-[var(--accent-amber)] flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>1. Как тебя зовут? (от 2 до 20 символов)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Введи своё имя..."
                autoFocus
                maxLength={20}
                className="w-full px-4 py-3 text-sm sm:text-base font-body font-bold bg-[var(--slot-bg)] border-4 border-[var(--border-color)] focus:border-[var(--accent-amber)] rounded-[4px] text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none transition-all shadow-[inset_2px_2px_0px_rgba(0,0,0,0.4)] text-center sm:text-left"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-body font-bold text-[var(--text-muted)]">
                {name.length}/20
              </div>
            </div>
            {errorText && (
              <p className="text-xs font-body font-bold text-[var(--accent-rose)]">
                {errorText}
              </p>
            )}
          </div>

          {/* Step 2: Avatar Grid Styled as 16-Bit Inventory Slots */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-body font-bold text-[var(--accent-emerald)] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>2. Выбери своего пиксельного героя:</span>
            </label>

            <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 p-3 rounded-[4px] bg-[var(--slot-bg)] border-[3px] border-[var(--border-color)] shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)]">
              {PRESET_AVATARS.map((avatar) => {
                const isSelected = selectedAvatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleSelectAvatar(avatar.id)}
                    className={`aspect-square w-full rounded-[4px] flex items-center justify-center p-1.5 transition-all cursor-pointer relative select-none ${
                      isSelected
                        ? 'border-4 border-[var(--accent-amber)] bg-amber-500/20 shadow-[2px_2px_0px_var(--shadow-color)] scale-105 z-10'
                        : 'border-[3px] border-[var(--border-color)] bg-[var(--panel-bg)] hover:border-[var(--accent-amber)] hover:scale-105'
                    }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-[2px] bg-[var(--accent-amber)] text-slate-950 flex items-center justify-center font-bold shadow-md border-2 border-[var(--border-color)] z-20">
                        <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                      </div>
                    )}

                    {/* Pixel Art Avatar Box */}
                    <div className="w-full h-full rounded-[2px] overflow-hidden flex items-center justify-center">
                      <img
                        src={avatar.imageUrl}
                        alt=""
                        className="w-full h-full object-contain pointer-events-none"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Big Chunky Retro Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isReady}
              className={`w-full py-3.5 sm:py-4 px-6 rounded-[4px] font-pixel text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all select-none border-4 border-[var(--border-color)] ${
                isReady
                  ? 'retro-btn bg-[var(--accent-emerald)] text-white hover:brightness-110 active:brightness-95 cursor-pointer shadow-[4px_4px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_var(--shadow-color)] active:shadow-[1px_1px_0px_var(--shadow-color)]'
                  : 'bg-[var(--card-subtle)] text-[var(--text-muted)] cursor-not-allowed opacity-60 shadow-none'
              }`}
            >
              <span>ВОЙТИ В СТУДИЮ</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
