/**
 * Super Pixel World - Profile Creation Screen
 * Displayed upon first game launch if no profile is found in LocalStorage.
 * Child-friendly UI: Large name input (max 12 chars), grid of 8 cute avatars, and huge start button.
 */

import React, { useState } from 'react';
import { Sparkles, Check, User, ArrowRight } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { ProfileManager } from '../services/storageManager';
import { MENU_BG_IMAGE, PRESET_AVATARS, UserProfile } from '../types/storage';

interface ProfileCreationScreenProps {
  onProfileCreated: (profile: UserProfile) => void;
}

export const ProfileCreationScreen: React.FC<ProfileCreationScreenProps> = ({
  onProfileCreated,
}) => {
  const [name, setName] = useState<string>('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('fox');
  const [errorText, setErrorText] = useState<string>('');

  // Validate name (letters, numbers, underscores, max 12 chars)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow letters, numbers, spaces, dashes (Russian & English)
    const filtered = val.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s_-]/g, '').slice(0, 12);
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
        setErrorText('Введи имя (от 2 до 12 букв)!');
      }
      return;
    }

    sound.playCoin();
    const profile = ProfileManager.createProfile(name.trim(), selectedAvatarId);
    onProfileCreated(profile);
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none relative">
      {/* Pixel Art Panoramic Menu Background */}
      <img
        src={MENU_BG_IMAGE}
        alt="Pixel art adventure background"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-105 pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/70 via-slate-950/80 to-slate-950 pointer-events-none" />

      {/* Decorative cartoon elements */}
      <div className="absolute top-6 left-8 text-4xl opacity-40 animate-pulse pointer-events-none hidden sm:block z-10">
        ☁️
      </div>
      <div className="absolute top-16 right-12 text-5xl opacity-50 animate-bounce pointer-events-none hidden sm:block z-10">
        ⭐
      </div>
      <div className="absolute bottom-10 left-12 text-4xl opacity-40 pointer-events-none hidden sm:block z-10">
        🍄
      </div>
      <div className="absolute bottom-12 right-16 text-4xl opacity-40 pointer-events-none hidden sm:block z-10">
        🪙
      </div>

      <div className="w-full max-w-2xl bg-slate-900/90 backdrop-blur-md border-4 border-amber-400/80 rounded-3xl shadow-2xl shadow-indigo-950/80 p-6 sm:p-8 flex flex-col items-center gap-6 z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border-2 border-amber-400/50 text-amber-300 font-black text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Добро пожаловать в игру!</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-wide drop-shadow-md">
            Создай свой профиль
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-medium max-w-md mx-auto">
            Назови своего героя и выбери любимую пиксельную аватарку, чтобы сохранять свои миры!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* Step 1: Name Input */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>1. Как тебя зовут? (максимум 12 букв)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Введи своё имя..."
                autoFocus
                maxLength={12}
                className="w-full px-5 py-4 text-lg sm:text-xl font-bold bg-slate-950/80 border-3 border-slate-700 focus:border-amber-400 rounded-2xl text-white placeholder-slate-500 outline-none transition-all shadow-inner text-center sm:text-left"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                {name.length}/12
              </div>
            </div>
            {errorText && (
              <p className="text-xs font-bold text-rose-400 animate-shake">
                {errorText}
              </p>
            )}
          </div>

          {/* Step 2: Avatar Grid */}
          <div className="space-y-2.5">
            <label className="block text-xs sm:text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>2. Выбери своего пиксельного героя:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {PRESET_AVATARS.map((avatar) => {
                const isSelected = selectedAvatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleSelectAvatar(avatar.id)}
                    className={`relative p-3 rounded-2xl border-3 flex flex-col items-center gap-2 transition-all cursor-pointer group active:scale-95 ${
                      isSelected
                        ? `${avatar.borderColor} bg-slate-800/90 shadow-lg shadow-amber-500/20 scale-102 ring-2 ring-amber-400/50`
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md border-2 border-slate-900 z-10">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Pixel Art Avatar Box */}
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700/80 shadow-md transition-transform group-hover:scale-108 shrink-0 relative"
                    >
                      <img
                        src={avatar.imageUrl}
                        alt={avatar.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>

                    <div className="text-center">
                      <div
                        className={`text-xs font-black leading-tight ${
                          isSelected ? 'text-amber-300' : 'text-slate-200'
                        }`}
                      >
                        {avatar.name}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {avatar.subtitle}
                      </div>
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
              className={`w-full py-4 sm:py-5 px-6 rounded-2xl font-black text-lg sm:text-xl uppercase tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl ${
                isReady
                  ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 shadow-emerald-500/30 active:scale-98 animate-pulse'
                  : 'bg-slate-800 border-2 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <span>НАЧАТЬ ИГРАТЬ</span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
