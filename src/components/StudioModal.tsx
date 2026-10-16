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
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
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
      ? 'max-w-4xl'
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F19]/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div
        className={`w-full ${maxWidthClass} bg-[#131B2E] border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0F172A]/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/90 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#F8FAFC] truncate">
                  {title}
                </h2>
                {badge && (
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeStyles} shrink-0`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-[#94A3B8] truncate mt-0.5 font-normal">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleClose}
            title="Закрыть (Esc)"
            className="w-8 h-8 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-[#F8FAFC]">
          {children}
        </div>

        {/* Footer (Optional) */}
        {footer && (
          <div className="px-5 py-3.5 bg-[#0F172A]/90 border-t border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
