/**
 * Super Pixel World - Interactive Guided Tour (TutorialOverlay)
 *
 * Implements:
 * - Spotlight Overlay with ultra-performant CSS box-shadow cutout (0 0 0 9999px rgba(0,0,0,0.75))
 * - Animated Ghost Pointer Hand with click & horizontal drag gestures
 * - Dynamic viewport positioning for child-friendly tooltip cards
 * - Auto-advancing step-by-step onboarding flow
 * - Seamless click-through for the highlighted interactive element
 * - Top-right Skip button & Centered Welcome / Congratulatory modals
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Sparkles,
  X,
  Play,
  CheckCircle2,
  Trophy,
  MousePointer,
  RotateCcw,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';

export type TutorialHandAction = 'click' | 'drag-horizontal' | 'input' | 'none';

export interface TutorialOverlayProps {
  isOpen: boolean;
  step: number;
  targetElementId?: string;
  title?: string;
  message: string;
  handAction?: TutorialHandAction;
  onSkip: () => void;
  onStartTour?: () => void;
  onCompleteTour?: () => void;
  placedCount?: number;
  targetPlacedCount?: number;
  wrongClickMessage?: string;
}

// --- Crisp White Cartoon Hand with Pointing Index Finger ---
export const WhitePointingHand: React.FC<{
  className?: string;
  size?: number;
}> = ({ className = '', size = 52 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)] ${className}`}
  >
    {/* Pure White Glove/Hand Silhouette with Extended Index Pointing Finger */}
    <path
      d="M11 2 C9.89 2 9 2.89 9 4 V14.5 C8.3 13.9 7.4 13.5 6.3 13.5 C4.7 13.5 3.5 14.8 3.5 16.4 C3.5 17.2 3.9 18 4.5 18.5 L9.6 23.6 C11 25 12.8 25.8 14.7 25.8 H19.2 C22.8 25.8 25.6 23 25.6 19.4 V13 C25.6 11.9 24.7 11 23.6 11 C23.3 11 23 11.1 22.7 11.2 C22.3 10.2 21.3 9.5 20.2 9.5 C19.9 9.5 19.6 9.6 19.3 9.7 C18.8 8.7 17.8 8 16.7 8 C16.2 8 15.7 8.2 15.3 8.5 V4 C15.3 2.89 14.41 2 13.3 2 H11 Z"
      fill="#FFFFFF"
      stroke="#0A0F1D"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Inner crease lines between curled fingers */}
    <path
      d="M15.3 12.5 V17.5"
      stroke="#0A0F1D"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M19.3 13.5 V18.5"
      stroke="#0A0F1D"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M22.7 14.5 V19"
      stroke="#0A0F1D"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Thumb knuckle crease line */}
    <path
      d="M9 18 C10 19.5 11.5 20.5 13.5 20.5"
      stroke="#CBD5E1"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Glove cuff line at wrist */}
    <path
      d="M12.5 25.8 V28.8 C12.5 29.8 13.4 30.8 14.8 30.8 H18.8 C20.2 30.8 21.2 29.8 21.2 28.8 V25.8"
      fill="#FFFFFF"
      stroke="#0A0F1D"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isOpen,
  step,
  targetElementId,
  title,
  message,
  handAction = 'click',
  onSkip,
  onStartTour,
  onCompleteTour,
  placedCount = 0,
  targetPlacedCount = 3,
  wrongClickMessage,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [handAnimationKey, setHandAnimationKey] = useState<number>(0);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const shakeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Measure target element bounding box
  const updateTargetRect = useCallback(() => {
    if (!targetElementId) {
      setTargetRect(null);
      return;
    }

    const el = document.getElementById(targetElementId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [targetElementId]);

  // Track target on mount, step change, resize, and scroll
  useEffect(() => {
    if (!isOpen) return;

    // Measure immediately and across rendering phases
    updateTargetRect();
    const rAF = requestAnimationFrame(updateTargetRect);
    const initialTimer = setTimeout(updateTargetRect, 60);
    const secondaryTimer = setTimeout(updateTargetRect, 200);
    const tertiaryTimer = setTimeout(updateTargetRect, 500);

    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      cancelAnimationFrame(rAF);
      clearTimeout(initialTimer);
      clearTimeout(secondaryTimer);
      clearTimeout(tertiaryTimer);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [isOpen, step, targetElementId, updateTargetRect]);

  // Periodic repetition of Ghost Hand animation (every 4.5 seconds if user is idle)
  useEffect(() => {
    if (!isOpen || handAction === 'none' || !targetRect) return;

    const interval = setInterval(() => {
      setHandAnimationKey((k) => k + 1);
    }, 4500);

    return () => clearInterval(interval);
  }, [isOpen, handAction, targetRect]);

  // Shake effect when user clicks outside the spotlighted element
  const triggerShake = useCallback(() => {
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    setIsShaking(true);
    sound.playBump();
    shakeTimerRef.current = setTimeout(() => {
      setIsShaking(false);
    }, 600);
  }, []);

  if (!isOpen) return null;

  // --- Step 0: Welcome Modal (Centered) ---
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
        <div className="relative w-full max-w-md p-6 bg-gradient-to-b from-[#131B2E] to-[#0B0F19] border-2 border-amber-400/80 rounded-3xl shadow-2xl shadow-amber-500/10 text-center space-y-5">
          {/* Top Mascot Icon */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Sparkles className="w-8 h-8 text-slate-950 animate-spin-slow" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold uppercase tracking-wider">
              Школа Геймдизайна
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Привет, Геймдизайнер!
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Давай создадим твою первую игру! Я покажу тебе шаг за шагом, как строить уровни и оживлять миры.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => {
                sound.playClick();
                onStartTour?.();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>Я готов!</span>
              <Play className="w-4 h-4 fill-slate-950" />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onSkip();
              }}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer font-medium"
            >
              Я уже умею, пропустить обучение
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Final Step: Congratulations Modal ---
  if (step === 6) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in zoom-in-95 duration-200">
        <div className="relative w-full max-w-md p-6 bg-gradient-to-b from-[#131B2E] to-[#0B0F19] border-2 border-emerald-400/80 rounded-3xl shadow-2xl shadow-emerald-500/10 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Trophy className="w-8 h-8 text-slate-950" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold uppercase tracking-wider">
              Тур Завершён!
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Поздравляю!
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ты сделал свой первый шаг в создании игр! Теперь у тебя есть все необходимые инструменты — твори свободно!
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                sound.playVictory();
                onCompleteTour?.();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Начать творить!</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate Tooltip Position based on Spotlight Cutout Rect
  let tooltipStyle: React.CSSProperties = {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  let arrowPlacement: 'top' | 'bottom' | 'left' | 'right' | 'none' = 'none';

  if (targetRect) {
    const pad = 8;
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    const spaceAbove = targetRect.top;
    const spaceBelow = viewH - targetRect.bottom;
    const spaceLeft = targetRect.left;
    const spaceRight = viewW - targetRect.right;

    // Prefer side with maximum comfortable space for ~280px wide card
    if (spaceLeft > 320 && targetRect.width < 120) {
      // Place to the left of the target element (e.g. sidebar tools)
      tooltipStyle = {
        top: Math.max(20, Math.min(viewH - 180, targetRect.top + targetRect.height * 0.5 - 70)),
        left: Math.max(16, targetRect.left - 310),
      };
      arrowPlacement = 'right';
    } else if (spaceBelow > 180) {
      // Place below target
      tooltipStyle = {
        top: targetRect.bottom + pad + 12,
        left: Math.max(16, Math.min(viewW - 320, targetRect.left + targetRect.width * 0.5 - 140)),
      };
      arrowPlacement = 'top';
    } else if (spaceAbove > 180) {
      // Place above target
      tooltipStyle = {
        top: Math.max(16, targetRect.top - pad - 140),
        left: Math.max(16, Math.min(viewW - 320, targetRect.left + targetRect.width * 0.5 - 140)),
      };
      arrowPlacement = 'bottom';
    } else {
      // Place to the right
      tooltipStyle = {
        top: Math.max(20, targetRect.top),
        left: Math.min(viewW - 320, targetRect.right + pad + 12),
      };
      arrowPlacement = 'left';
    }
  }

  const spotlightPadding = 6;
  const spotlightTop = targetRect ? targetRect.top - spotlightPadding : 0;
  const spotlightLeft = targetRect ? targetRect.left - spotlightPadding : 0;
  const spotlightWidth = targetRect ? targetRect.width + spotlightPadding * 2 : 0;
  const spotlightHeight = targetRect ? targetRect.height + spotlightPadding * 2 : 0;

  return (
    <div className="fixed inset-0 z-40 select-none overflow-hidden pointer-events-none">
      {/* 1. Backdrop Blocker with Spotlight Cutout */}
      {targetRect ? (
        <>
          {/* Spotlight aperture: for clicks it triggers targetElementId click; for drag it lets mouse events pass through */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (targetElementId && handAction !== 'drag-horizontal') {
                const el = document.getElementById(targetElementId);
                if (el) {
                  el.click();
                }
              }
            }}
            style={{
              top: spotlightTop,
              left: spotlightLeft,
              width: spotlightWidth,
              height: spotlightHeight,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.78), 0 0 24px 6px rgba(245, 158, 11, 0.5)',
            }}
            className={`fixed rounded-2xl border-2 border-amber-400 transition-all duration-300 ease-out ${
              handAction === 'drag-horizontal'
                ? 'pointer-events-none'
                : 'pointer-events-auto cursor-pointer'
            }`}
          />

          {/* 4 Click catchers surrounding the spotlight (prevents accidental wrong clicks & shakes tooltip) */}
          {/* Top blocker */}
          <div
            onClick={triggerShake}
            className="fixed top-0 left-0 right-0 pointer-events-auto"
            style={{ height: Math.max(0, spotlightTop) }}
          />
          {/* Bottom blocker */}
          <div
            onClick={triggerShake}
            className="fixed left-0 right-0 bottom-0 pointer-events-auto"
            style={{ top: Math.max(0, spotlightTop + spotlightHeight) }}
          />
          {/* Left blocker */}
          <div
            onClick={triggerShake}
            className="fixed left-0 pointer-events-auto"
            style={{
              top: Math.max(0, spotlightTop),
              width: Math.max(0, spotlightLeft),
              height: spotlightHeight,
            }}
          />
          {/* Right blocker */}
          <div
            onClick={triggerShake}
            className="fixed right-0 pointer-events-auto"
            style={{
              top: Math.max(0, spotlightTop),
              left: Math.max(0, spotlightLeft + spotlightWidth),
              height: spotlightHeight,
            }}
          />
        </>
      ) : (
        /* Full backdrop if target rect is not yet ready */
        <div
          onClick={triggerShake}
          className="fixed inset-0 bg-black/75 pointer-events-auto transition-opacity"
        />
      )}

      {/* 2. Top-Right Skip Button */}
      <button
        onClick={() => {
          sound.playClick();
          onSkip();
        }}
        className="fixed top-3.5 right-4 z-50 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all cursor-pointer pointer-events-auto"
      >
        <span>Пропустить обучение</span>
        <X className="w-3.5 h-3.5" />
      </button>

      {/* 3. Ghost Pointer Hand Animation (White with Index Pointing Finger) */}
      {targetRect && handAction !== 'none' && (
        <div
          key={`hand-${step}-${handAnimationKey}`}
          style={{
            top: targetRect.top + targetRect.height * 0.5,
            left: targetRect.left + targetRect.width * 0.5,
          }}
          className="fixed z-50 pointer-events-none"
        >
          {handAction === 'click' && (
            <div className="relative -translate-x-5 -translate-y-2 animate-tour-tap">
              {/* Expanding Ripple Ring at finger tip */}
              <div className="absolute top-0 left-4 w-7 h-7 rounded-full border-2 border-amber-400 animate-ping opacity-75" />

              {/* White Pointing Hand Cursor with Index Finger */}
              <WhitePointingHand size={54} className="transform -rotate-12" />
            </div>
          )}

          {handAction === 'drag-horizontal' && (
            <div className="relative animate-tour-drag-horizontal -translate-x-5 -translate-y-2">
              {/* Drag Trail Ripple */}
              <div className="absolute top-0 left-4 w-7 h-7 rounded-full border-2 border-amber-400 animate-ping opacity-60" />

              {/* White Pointing Hand Cursor */}
              <WhitePointingHand size={54} className="transform -rotate-12" />
            </div>
          )}

          {handAction === 'input' && (
            <div className="relative -translate-x-5 -translate-y-2 animate-bounce">
              <WhitePointingHand size={54} className="transform -rotate-12" />
            </div>
          )}
        </div>
      )}

      {/* 4. Child-Friendly Tooltip Card */}
      <div
        style={tooltipStyle}
        className={`fixed z-50 w-72 sm:w-80 pointer-events-auto transition-transform ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        <div className="relative p-4 rounded-2xl bg-gradient-to-b from-[#1E293B] to-[#0F172A] border-2 border-amber-400 text-white shadow-2xl shadow-black/80 backdrop-blur-md space-y-2">
          {/* Arrow pointing to element */}
          {arrowPlacement === 'top' && (
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1E293B] border-t-2 border-l-2 border-amber-400 transform rotate-45" />
          )}
          {arrowPlacement === 'bottom' && (
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0F172A] border-b-2 border-r-2 border-amber-400 transform rotate-45" />
          )}
          {arrowPlacement === 'right' && (
            <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-4 h-4 bg-[#1E293B] border-t-2 border-r-2 border-amber-400 transform rotate-45" />
          )}
          {arrowPlacement === 'left' && (
            <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-4 h-4 bg-[#1E293B] border-b-2 border-l-2 border-amber-400 transform rotate-45" />
          )}

          {/* Header Pill */}
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Шаг {step} из 5</span>
            </span>

            {/* Step Counter if placing blocks */}
            {step === 4 && (
              <span className="text-[11px] font-bold text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40">
                {placedCount} / {targetPlacedCount} блока
              </span>
            )}
          </div>

          {/* Card Message */}
          <div className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
            {message}
          </div>

          {/* Contextual Warning Reminder if user clicked wrong element */}
          {isShaking && (
            <div className="text-[11px] font-bold text-rose-400 bg-rose-950/60 p-1.5 rounded-lg border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
              <span>⚠️ {wrongClickMessage || 'Нажми на подсвеченный элемент!'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
