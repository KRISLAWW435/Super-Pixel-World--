/**
 * Super Pixel World - About Modal Window (AboutModal)
 *
 * Modern, Premium Game UI with 3D Pixel Circles:
 * - Proper title spacing (24px margin-bottom on subtitle)
 * - 3D pixel circle badges (circular medallions with 3D bottom bevel & top highlight, not square buttons)
 * - Large vibrant emojis (🧠, 🎨, ⚙️, 🚀) as requested ("как были до этого но в кружках 3д пиксельных")
 * - Solid, elegant dark slate container (#1E293B)
 * - Generous card padding (20px - 24px) preventing text clipping
 * - Clean hover effect (subtle background shift, no transform scale)
 * - Preserved exact Russian text and author footer
 */

import React, { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
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

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  const handleButtonClick = () => {
    sound.playCoin();
    onClose();
  };

  const skills = [
    {
      emoji: '🧠',
      title: 'Логика и расчет',
      desc: 'Узнаешь, как расставлять препятствия, чтобы игра была интересной, но проходимой.',
      circleStyle:
        'bg-gradient-to-b from-[#3B1728] via-[#2A101D] to-[#1F0C15] border-[#13070D] shadow-[0_4px_0_#0C0408,inset_0_2px_0_rgba(255,182,193,0.35)]',
      innerRing: 'border-pink-500/25',
    },
    {
      emoji: '🎨',
      title: 'Творческое мышление',
      desc: 'Научишься придумывать дизайн уровней и собственные сюжеты.',
      circleStyle:
        'bg-gradient-to-b from-[#3D290D] via-[#2D1E09] to-[#201505] border-[#140C03] shadow-[0_4px_0_#0D0802,inset_0_2px_0_rgba(254,240,138,0.35)]',
      innerRing: 'border-amber-500/25',
    },
    {
      emoji: '⚙️',
      title: 'Основы геймдизайна',
      desc: 'Поймешь правила физики и то, как заставить героя слушаться твоих правил.',
      circleStyle:
        'bg-gradient-to-b from-[#132D3F] via-[#0E202D] to-[#0A1721] border-[#060F16] shadow-[0_4px_0_#04090E,inset_0_2px_0_rgba(186,230,253,0.35)]',
      innerRing: 'border-sky-500/25',
    },
    {
      emoji: '🚀',
      title: 'Внимательность и усидчивость',
      desc: 'Будешь тестировать свои уровни и исправлять ошибки, как настоящий разработчик.',
      circleStyle:
        'bg-gradient-to-b from-[#2E1642] via-[#200F2E] to-[#170A22] border-[#0E0614] shadow-[0_4px_0_#09040D,inset_0_2px_0_rgba(233,213,255,0.35)]',
      innerRing: 'border-purple-500/25',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-transparent animate-in fade-in duration-150 select-none"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[850px] retro-modal p-5 sm:p-7 shadow-[6px_6px_0px_#000] flex flex-col max-h-[92vh] overflow-hidden animate-modal-pop-in text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chunky Retro Close Button */}
        <button
          onClick={handleClose}
          className="retro-btn-sm absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-md bg-white hover:bg-slate-100 text-[#0F172A] border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center cursor-pointer z-30 transition-colors"
          title="Закрыть"
        >
          <X className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto pr-1 sm:pr-2 space-y-6 custom-scrollbar">
          {/* Header with Title and Subtitle */}
          <div className="text-center pt-1 sm:pt-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-pixel text-[var(--text-main)] tracking-wider mb-3 sm:mb-4">
              PIXEL WORLD
            </h1>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FDE047] border border-amber-500/40 text-[#0F172A] font-pixel text-[10px] sm:text-xs mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 fill-[#0F172A] text-[#0F172A]" />
              <span>ТВОЯ СТУДИЯ СОЗДАНИЯ ИГР</span>
            </div>
          </div>

          {/* Intro Text Card */}
          <div className="p-5 rounded-2xl bg-[var(--card-subtle)] border-2 border-[var(--border-color)] flex flex-col sm:flex-row items-center sm:items-start gap-4 shadow-sm">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--slot-bg)] border-2 border-[var(--border-color)] flex items-center justify-center text-2xl sm:text-3xl shrink-0 select-none">
              🎮
            </div>
            <p className="text-[var(--text-main)] text-sm sm:text-base leading-relaxed font-normal text-center sm:text-left">
              <strong className="text-amber-400 [body.theme-light_&]:text-[#1E293B] [.theme-light_&]:text-[#1E293B] font-bold">Pixel World</strong> — это не просто игра, а творческая мастерская! Здесь ты не просто проходишь уровни, а сам придумываешь, строишь и оживляешь свои собственные миры.
            </p>
          </div>

          {/* Section Header */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 rounded-lg bg-[var(--accent-amber)] text-slate-950 font-pixel text-xs sm:text-sm font-black tracking-wider flex items-center gap-2 shadow-sm select-none">
                <span>⭐</span>
                <span>В СТУДИИ ТЫ НАУЧИШЬСЯ:</span>
              </div>
              <div className="h-px flex-1 bg-[var(--border-color)] hidden sm:block" />
            </div>

            {/* Skills (2x2 Grid with generous 20px - 24px padding, 3D pixel circles, clean hover) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-2xl bg-[var(--card-bg)] border-2 border-[var(--border-color)] hover:border-[var(--accent-amber)] hover:shadow-md transition-colors duration-150 flex gap-4 sm:gap-5 items-center select-none"
                >
                  {/* 3D Pixel Circle */}
                  <div
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 ${skill.circleStyle} flex items-center justify-center shrink-0 select-none`}
                  >
                    {/* Inner depth ring */}
                    <div
                      className={`absolute inset-1 rounded-full border ${skill.innerRing} pointer-events-none opacity-60`}
                    />
                    {/* Vibrant Emoji */}
                    <span className="text-2xl sm:text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] select-none">
                      {skill.emoji}
                    </span>
                  </div>

                  {/* Skill Content with generous padding and clear hierarchy */}
                  <div className="space-y-1.5 min-w-0 flex-1 pr-1 sm:pr-2">
                    <h3 className="font-bold text-base text-[var(--text-main)] tracking-wide">
                      {skill.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] font-normal leading-relaxed">
                      {skill.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA Button & Footer */}
          <div className="pt-2 space-y-3.5">
            {/* Chunky, Solid Nintendo Switch Style CTA Button */}
            <button
              onClick={handleButtonClick}
              className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-[var(--accent-amber)] hover:brightness-110 text-slate-950 font-pixel text-sm sm:text-base font-black tracking-wider border-2 border-[var(--border-color)] shadow-[0_4px_0_var(--shadow-color)] active:translate-y-1 active:shadow-none transition-all duration-100 cursor-pointer flex items-center justify-center gap-2 select-none"
            >
              <span>ПОНЯТНО, К СОЗДАНИЮ!</span>
            </button>

            {/* Footer Signature */}
            <div className="text-center text-xs font-medium text-[var(--text-muted)] tracking-wide">
              Автор проекта: <span className="text-[var(--text-main)] font-semibold">Кристина Лавренюк</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
