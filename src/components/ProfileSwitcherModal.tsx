/**
 * Super Pixel World - Profile Switcher & Manager Modal
 * Allows switching between multiple creators, viewing their progress,
 * and creating a brand new profile.
 */

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Check,
  Trash2,
  Sparkles,
  GraduationCap,
  FolderOpen,
  ArrowRight,
  UserPlus,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { ProfileManager, SaveManager } from '../services/storageManager';
import { PRESET_AVATARS, UserProfile } from '../types/storage';
import { StudioModal } from './StudioModal';

interface ProfileSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: UserProfile;
  onProfileSelected: (profile: UserProfile) => void;
  onOpenCreateProfile: () => void;
}

export const ProfileSwitcherModal: React.FC<ProfileSwitcherModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onProfileSelected,
  onOpenCreateProfile,
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => ProfileManager.getProfiles());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const refreshProfiles = () => {
    setProfiles(ProfileManager.getProfiles());
  };

  const handleSelect = (p: UserProfile) => {
    sound.playSelect();
    const updated = ProfileManager.setActiveProfileId(p.id);
    if (updated) {
      onProfileSelected(updated);
    } else {
      onProfileSelected(p);
    }
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playBump();
    ProfileManager.deleteProfile(id);
    refreshProfiles();
    setDeleteConfirmId(null);

    const remaining = ProfileManager.getActiveProfile();
    if (remaining) {
      onProfileSelected(remaining);
    }
  };

  return (
    <StudioModal
      isOpen={isOpen}
      onClose={onClose}
      title="Сменить профиль"
      subtitle="Выберите профиль создателя или создайте нового игрока"
      icon={<Users className="w-6 h-6 text-amber-400" />}
      badge="Профили"
      badgeColor="amber"
      maxWidth="xl"
    >
      <div className="space-y-5 py-2">
        {/* List of Existing Profiles */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {profiles.map((p) => {
            const avatar =
              PRESET_AVATARS.find((a) => a.id === p.avatarId) || PRESET_AVATARS[0];
            const isActive = p.id === activeProfile.id;
            const projectCount = SaveManager.getSavedGamesForProfile(p.id).length;

            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 group select-none ${
                  isActive
                    ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-900/80 border-slate-700/80 hover:border-amber-400/80 hover:bg-slate-800/80'
                }`}
              >
                {/* Left: Avatar & Details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 bg-slate-950 shrink-0 ${
                      isActive ? 'border-emerald-400' : 'border-slate-600 group-hover:border-amber-400'
                    }`}
                  >
                    <img
                      src={avatar.imageUrl}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-black text-white truncate">
                        {p.name}
                      </h4>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-black uppercase tracking-wider shrink-0">
                          Активный
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {/* Tutorial status tag */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          p.tutorialCompleted
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        }`}
                      >
                        <GraduationCap className="w-3 h-3" />
                        <span>
                          {p.tutorialCompleted ? 'Обучение пройдено' : 'Нужно обучение'}
                        </span>
                      </span>

                      {/* Projects count */}
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <FolderOpen className="w-3 h-3" />
                        <span>{projectCount} {projectCount === 1 ? 'проект' : 'проектов'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Select / Delete Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isActive ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(p);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <span>Выбрать</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  {profiles.length > 1 && (
                    <>
                      {deleteConfirmId === p.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleDelete(p.id, e)}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                          >
                            Удалить?
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[11px]"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playClick();
                            setDeleteConfirmId(p.id);
                          }}
                          title="Удалить этот профиль"
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create New Profile CTA Button */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
              onOpenCreateProfile();
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <UserPlus className="w-5 h-5 stroke-[2.5]" />
            <span>+ СОЗДАТЬ НОВЫЙ ПРОФИЛЬ</span>
          </button>
        </div>
      </div>
    </StudioModal>
  );
};
