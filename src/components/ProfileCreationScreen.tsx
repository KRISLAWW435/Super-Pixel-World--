/**
 * Super Pixel World - Profile Creation Screen
 * Clean, focused modal dialog for creating a creator profile.
 * High z-index (z-[100]), clean backdrop, no murky background layers or stray corner symbols.
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Check, User, ArrowRight, X } from 'lucide-react';
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
        setErrorText('Введи имя (от 2 до 20 букв)!');
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto select-none"
    >
      <div className="relative w-full max-w-2xl bg-[#131B2E] border-2 border-amber-400/90 rounded-3xl shadow-2xl shadow-black/80 p-6 sm:p-8 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Optional Close button if cancellation is supported */}
        {onCancel && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onCancel();
            }}
            title="Закрыть"
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-rose-600 border border-slate-700 hover:border-rose-400 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Super Pixel World · Новый автор</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide drop-shadow-md">
            Создание Профиля Автора
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mx-auto">
            Назовите своего создателя миров и выберите аватарку для подписи уровней!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Step 1: Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>1. Как тебя зовут? (от 2 до 20 букв)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Введи своё имя..."
                autoFocus
                maxLength={20}
                className="w-full px-4 py-3 sm:py-3.5 text-base sm:text-lg font-bold bg-[#0B0F19] border-2 border-slate-700 focus:border-amber-400 rounded-2xl text-white placeholder-slate-500 outline-none transition-all shadow-inner text-center sm:text-left"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                {name.length}/20
              </div>
            </div>
            {errorText && (
              <p className="text-xs font-bold text-rose-400">
                {errorText}
              </p>
            )}
          </div>

          {/* Step 2: Avatar Grid */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>2. Выбери своего пиксельного героя:</span>
            </label>

            <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 p-2.5 sm:p-3 rounded-2xl bg-[#0B0F19]/70 border border-slate-800">
              {PRESET_AVATARS.map((avatar) => {
                const isSelected = selectedAvatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleSelectAvatar(avatar.id)}
                    className={`aspect-square w-full rounded-2xl flex items-center justify-center p-1.5 sm:p-2 transition-all cursor-pointer relative select-none ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500/25 to-amber-600/10 border-3 border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.5),0_4px_0_#B45309] scale-105 ring-2 ring-amber-300/80 z-10'
                        : 'bg-[#131B2E]/90 hover:bg-slate-800/90 border-2 border-slate-700/80 hover:border-slate-500 shadow-md hover:scale-105'
                    }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg border-2 border-slate-900 z-20 animate-in zoom-in-75">
                        <Check className="w-3 h-3 stroke-[3.5]" />
                      </div>
                    )}

                    {/* Pixel Art Avatar Box */}
                    <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center">
                      <img
                        src={avatar.imageUrl}
                        alt=""
                        className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Big Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isReady}
              className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl ${
                isReady
                  ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/30 active:scale-98'
                  : 'bg-slate-800 border-2 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <span>ВОЙТИ В СТУДИЮ</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
