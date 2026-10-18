/**
 * Pixel Studio Pro - Unified Modal Shell (StudioModal)
 *
 * Provides a consistent, professional game studio container for all dialogs:
 * - Save Game / Export
 * - Load / Presets
 * - Sound / Game Settings
 * - Author Profile
 *
 * Uses Pixel Studio Pro design tokens:
 * - Background overlay: #0B0F19/80 with backdrop blur
 * - Surface: #131B2E with #1E293B border & subtle glow
 * - Text: Primary #F8FAFC, Secondary #94A3B8, Accent #F59E0B
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { sound } from '../audio/soundEngine';

export interface StudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: 'amber' | 'emerald' | 'blue' | 'purple';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const StudioModal: React.FC<StudioModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  badgeColor = 'amber',
  maxWidth = 'md',
  children,
  footer,
}) => {
  // ESC key listener to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sound.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass =
    maxWidth === 'sm'
      ? 'max-w-sm'
      : maxWidth === 'lg'
      ? 'max-w-2xl'
      : maxWidth === 'xl'
      ? 'max-w-3xl'
      : maxWidth === '2xl'
      ? 'max-w-5xl'
      : 'max-w-lg';

  const badgeStyles = {
    amber: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    blue: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
  }[badgeColor];

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-transparent select-none animate-in fade-in duration-150"
    >
      <div
        className={`w-full ${maxWidthClass} retro-modal overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh] pointer-events-auto`}
      >
        {/* Retro Header */}
        <div
          className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b-4 border-black shrink-0"
          style={{ backgroundColor: 'var(--panel-header)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-9 h-9 rounded-md bg-[var(--card-subtle)] border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center text-amber-400 shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-pixel tracking-wide text-[var(--text-main)] truncate">
                  {title}
                </h2>
                {badge && (
                  <span
                    className={`text-[9px] font-pixel uppercase px-2 py-0.5 rounded-sm border-2 border-black shadow-[2px_2px_0px_#000000] ${badgeStyles} shrink-0`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5 font-normal">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleClose}
            title="Закрыть (Esc)"
            className="retro-btn-sm bg-rose-600 hover:bg-rose-500 text-white w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm text-[var(--text-main)] custom-scrollbar">
          {children}
        </div>

        {/* Footer (Optional) */}
        {footer && (
          <div
            className="px-4 sm:px-5 py-3 border-t-4 border-black flex items-center justify-end gap-2.5 shrink-0"
            style={{ backgroundColor: 'var(--panel-header)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
