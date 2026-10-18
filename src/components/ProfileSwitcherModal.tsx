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
                className={`p-3.5 sm:p-4 rounded-[4px] border-4 transition-all cursor-pointer flex items-center justify-between gap-3 group select-none shadow-[3px_3px_0px_var(--shadow-color)] ${
                  isActive
                    ? 'bg-[var(--card-subtle)] border-[var(--accent-emerald)] ring-2 ring-emerald-500/40'
                    : 'bg-[var(--card-bg)] border-[var(--border-color)] hover:border-[var(--accent-amber)]'
                }`}
              >
                {/* Left: Avatar & Details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className={`w-13 h-13 sm:w-14 sm:h-14 rounded-[4px] overflow-hidden border-2 bg-[var(--slot-bg)] shrink-0 ${
                      isActive ? 'border-[var(--accent-emerald)]' : 'border-[var(--border-color)] group-hover:border-[var(--accent-amber)]'
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
                      <h4 className="text-base sm:text-lg font-bold font-body text-[var(--text-main)] truncate">
                        {p.name}
                      </h4>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-[2px] bg-[var(--accent-emerald)] border border-[var(--border-color)] text-white text-[9px] font-pixel uppercase tracking-wider shrink-0 shadow-sm">
                          Активный
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {/* Tutorial status tag */}
                      <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded-[2px] border border-[var(--border-color)] bg-[var(--slot-bg)] text-[var(--text-main)] flex items-center gap-1">
                        <GraduationCap className={`w-3.5 h-3.5 ${p.tutorialCompleted ? 'text-[var(--accent-blue)]' : 'text-[var(--accent-amber)]'}`} />
                        <span>
                          {p.tutorialCompleted ? 'Обучение пройдено' : 'Нужно обучение'}
                        </span>
                      </span>

                      {/* Projects count */}
                      <span className="text-[11px] font-body font-semibold text-[var(--text-muted)] flex items-center gap-1">
                        <FolderOpen className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
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
                      className="retro-btn-sm px-3.5 py-1.5 rounded-[4px] bg-[var(--accent-amber)] hover:brightness-110 text-slate-950 font-pixel text-[10px] uppercase flex items-center gap-1.5 transition-all cursor-pointer border-2 border-[var(--border-color)] shadow-[2px_2px_0px_var(--shadow-color)]"
                    >
                      <span>Выбрать</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="w-8 h-8 rounded-[4px] bg-[var(--accent-emerald)] border-2 border-[var(--border-color)] shadow-[2px_2px_0px_var(--shadow-color)] flex items-center justify-center text-white">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  {profiles.length > 1 && (
                    <>
                      {deleteConfirmId === p.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleDelete(p.id, e)}
                            className="retro-btn-sm px-2 py-1 rounded-[4px] bg-[var(--accent-rose)] hover:brightness-110 text-white text-[10px] font-pixel border-2 border-[var(--border-color)]"
                          >
                            Удалить?
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="retro-btn-sm px-2 py-1 rounded-[4px] bg-[var(--card-subtle)] text-[var(--text-main)] text-[10px] font-pixel border-2 border-[var(--border-color)]"
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
                          className="p-1.5 rounded-[4px] text-[var(--text-muted)] hover:text-rose-500 transition-colors"
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
        <div className="pt-2 border-t-2 border-[var(--border-color)]">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
              onOpenCreateProfile();
            }}
            className="retro-btn w-full py-3.5 px-5 rounded-[4px] bg-[var(--accent-emerald)] hover:brightness-110 active:brightness-95 text-white font-pixel text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 border-4 border-[var(--border-color)] shadow-[4px_4px_0px_var(--shadow-color)] hover:shadow-[5px_5px_0px_var(--shadow-color)] active:shadow-[1px_1px_0px_var(--shadow-color)] cursor-pointer"
          >
            <UserPlus className="w-5 h-5 stroke-[2.5]" />
            <span>+ СОЗДАТЬ НОВЫЙ ПРОФИЛЬ</span>
          </button>
        </div>
      </div>
    </StudioModal>
  );
};
