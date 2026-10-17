/**
 * Super Pixel World - Interactive Guided Tour (TutorialOverlay)
 *
 * Full 12-Step Academy Curriculum:
 * Phase 1: Editor (Steps 1-9)
 *   1. Welcome / Приветствие
 *   2. Select Brush tool / Выбор кисти
 *   3. Select Grass & Dirt block / Выбор блока "Трава и земля"
 *   4. Build a Road / Построй дорогу (3 blocks, centered hand, zero canvas blackout, top tooltip)
 *   5. Camera Controls / Управление камерой (Mouse wheel listener & animation)
 *   6. Golden Reward / Золотая награда (Interactive Tab -> Coin, wait for placement)
 *   7. Enemy Placement / Враг (Enemies Tab -> Hunter Beast, wait for placement)
 *   8. Hazard Spikes / Шипы (Interactive Tab -> Spikes, wait for placement)
 *   9. Test Button / Кнопка ТЕСТ (Click TEST to enter playtest, never prematurely ends tour)
 * Phase 2: Gameplay (Steps 10-12)
 *   10. Run / Бег (Keys A/D cue, waiting for move)
 *   11. Jump / Прыжок (Space key cue, waiting for jump)
 *   12. Final Victory / Финал (Reach goal flag -> Celebratory green modal -> marks tutorial completed)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Sparkles,
  X,
  Play,
  CheckCircle2,
  Trophy,
  Mouse,
  Move,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';

export type TutorialHandAction =
  | 'click'
  | 'drag-horizontal'
  | 'wheel'
  | 'input'
  | 'keys-ad'
  | 'keys-space'
  | 'none';

export interface TutorialOverlayProps {
  isOpen: boolean;
  step: number;
  totalSteps?: number;
  targetElementId?: string;
  title?: string;
  message: string;
  handAction?: TutorialHandAction;
  onSkip: () => void;
  onStartTour?: () => void;
  onCompleteTour?: () => void;
  onSkipStep?: () => void;
  onNextStep?: () => void;
  placedCount?: number;
  targetPlacedCount?: number;
  wrongClickMessage?: string;
  isSuccess?: boolean;
  successMessage?: string;
  onWheelAction?: () => void;
  isVictory?: boolean;
}

// Crisp White Cartoon Hand with Pointing Index Finger
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
    <path
      d="M11 2 C9.89 2 9 2.89 9 4 V14.5 C8.3 13.9 7.4 13.5 6.3 13.5 C4.7 13.5 3.5 14.8 3.5 16.4 C3.5 17.2 3.9 18 4.5 18.5 L9.6 23.6 C11 25 12.8 25.8 14.7 25.8 H19.2 C22.8 25.8 25.6 23 25.6 19.4 V13 C25.6 11.9 24.7 11 23.6 11 C23.3 11 23 11.1 22.7 11.2 C22.3 10.2 21.3 9.5 20.2 9.5 C19.9 9.5 19.6 9.6 19.3 9.7 C18.8 8.7 17.8 8 16.7 8 C16.2 8 15.7 8.2 15.3 8.5 V4 C15.3 2.89 14.41 2 13.3 2 H11 Z"
      fill="#FFFFFF"
      stroke="#0A0F1D"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M15.3 12.5 V17.5" stroke="#0A0F1D" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M19.3 13.5 V18.5" stroke="#0A0F1D" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M22.7 14.5 V19" stroke="#0A0F1D" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 18 C10 19.5 11.5 20.5 13.5 20.5" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
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
  totalSteps = 12,
  targetElementId,
  title,
  message,
  handAction = 'click',
  onSkip,
  onStartTour,
  onCompleteTour,
  onSkipStep,
  onNextStep,
  placedCount = 0,
  targetPlacedCount = 3,
  wrongClickMessage,
  isSuccess = false,
  successMessage,
  onWheelAction,
  isVictory = false,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [handAnimationKey, setHandAnimationKey] = useState<number>(0);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const shakeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Anti-stuck idle assistance timer (15 seconds of inactivity)
  const [isIdleHelpActive, setIsIdleHelpActive] = useState<boolean>(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    updateTargetRect();
    const rAF = requestAnimationFrame(updateTargetRect);
    const t1 = setTimeout(updateTargetRect, 60);
    const t2 = setTimeout(updateTargetRect, 200);
    const t3 = setTimeout(updateTargetRect, 500);

    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      cancelAnimationFrame(rAF);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [isOpen, step, targetElementId, updateTargetRect]);

  // Step 5: Wheel listener (handles mouse wheel anywhere on window)
  useEffect(() => {
    if (!isOpen || step !== 5) return;

    const handleWindowWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > 5 || Math.abs(e.deltaY) > 5) {
        onWheelAction?.();
      }
    };

    window.addEventListener('wheel', handleWindowWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWindowWheel);
    };
  }, [isOpen, step, onWheelAction]);

  // Periodic repetition of Ghost Hand animation
  useEffect(() => {
    if (!isOpen || handAction === 'none') return;
    const interval = setInterval(() => {
      setHandAnimationKey((k) => k + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, [isOpen, handAction]);

  // Anti-stuck 15-second timer
  useEffect(() => {
    setIsIdleHelpActive(false);
    if (!isOpen || step <= 1 || step > totalSteps) return;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdleHelpActive(true);
      setHandAnimationKey((k) => k + 1);
    }, 15000);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen, step, totalSteps]);

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

  // --- Step 1: Welcome Modal (Centered) ---
  if (step === 1 || step === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
        <div className="relative w-full max-w-md p-6 bg-gradient-to-b from-[#131B2E] to-[#0B0F19] border-2 border-amber-400/80 rounded-3xl shadow-2xl shadow-amber-500/10 text-center space-y-5">
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
              Давай создадим твою первую игру! Я покажу тебе шаг за шагом, как строить уровни, размещать врагов и бонусы, а затем сыграть в них!
            </p>
          </div>

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

  // --- Step 12: Final Victory Modal (Shown ONLY when player wins in gameplay mode) ---
  if (step >= 12 && isVictory) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in zoom-in-95 duration-300">
        <div className="relative w-full max-w-md p-6 bg-gradient-to-b from-[#131B2E] to-[#0B0F19] border-2 border-emerald-400/90 rounded-3xl shadow-2xl shadow-emerald-500/20 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Trophy className="w-10 h-10 text-slate-950" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-bold uppercase tracking-wider">
              Тур Завершён! 🏆
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Поздравляю, Создатель!
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              Ты создал и победоносно прошёл свой первый уровень! Теперь в твоих руках все инструменты студии — воплощай любые миры и делись ими!
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                sound.playVictory();
                onCompleteTour?.();
              }}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Начать творить!</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine if this step is a free-canvas action (Step 4 "Road", Step 5 "Wheel", or in gameplay mode)
  const isRoadStep = step === 4;
  const isWheelStep = step === 5;
  const isGameplayPhase = step >= 10;
  const isFreeCanvasStep = isRoadStep || isWheelStep || isGameplayPhase;

  // Calculate Tooltip Position based on Target Rect
  let tooltipStyle: React.CSSProperties = {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  let arrowPlacement: 'top' | 'bottom' | 'left' | 'right' | 'none' = 'none';

  if (isFreeCanvasStep) {
    // Pin tooltip to top center of screen so drawing area & game are 100% unobstructed
    tooltipStyle = {
      top: 68,
      left: '50%',
      transform: 'translateX(-50%)',
    };
    arrowPlacement = 'none';
  } else if (targetRect) {
    const pad = 8;
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    const spaceLeft = targetRect.left;
    const spaceBelow = viewH - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (spaceLeft > 320 && targetRect.width < 140) {
      tooltipStyle = {
        top: Math.max(20, Math.min(viewH - 180, targetRect.top + targetRect.height * 0.5 - 70)),
        left: Math.max(16, targetRect.left - 315),
      };
      arrowPlacement = 'right';
    } else if (spaceBelow > 180) {
      tooltipStyle = {
        top: targetRect.bottom + pad + 12,
        left: Math.max(16, Math.min(viewW - 320, targetRect.left + targetRect.width * 0.5 - 140)),
      };
      arrowPlacement = 'top';
    } else if (spaceAbove > 180) {
      tooltipStyle = {
        top: Math.max(16, targetRect.top - pad - 140),
        left: Math.max(16, Math.min(viewW - 320, targetRect.left + targetRect.width * 0.5 - 140)),
      };
      arrowPlacement = 'bottom';
    } else {
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
      {/* 1a. Step 10 Gameplay Dimming Backdrop */}
      {step === 10 && (
        <div className="fixed inset-0 bg-black/60 pointer-events-none z-30 animate-in fade-in duration-300" />
      )}

      {/* 1b. Spotlight Cutout & Backdrop (DISABLED completely on drawing/wheel/gameplay steps) */}
      {!isFreeCanvasStep && targetRect ? (
        <>
          <div
            style={{
              top: spotlightTop,
              left: spotlightLeft,
              width: spotlightWidth,
              height: spotlightHeight,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.78), 0 0 24px 6px rgba(245, 158, 11, 0.5)',
            }}
            className={`fixed rounded-2xl border-2 transition-all duration-300 ease-out pointer-events-none z-30 ${
              isSuccess
                ? 'border-emerald-400 ring-4 ring-emerald-400/40'
                : isIdleHelpActive
                ? 'border-amber-400 animate-pulse-help'
                : 'border-amber-400'
            }`}
          />

          {/* Click catchers surrounding the spotlight */}
          <div
            onClick={triggerShake}
            className="fixed top-0 left-0 right-0 pointer-events-auto z-30"
            style={{ height: Math.max(0, spotlightTop) }}
          />
          <div
            onClick={triggerShake}
            className="fixed left-0 right-0 bottom-0 pointer-events-auto z-30"
            style={{ top: Math.max(0, spotlightTop + spotlightHeight) }}
          />
          <div
            onClick={triggerShake}
            className="fixed left-0 pointer-events-auto z-30"
            style={{
              top: Math.max(0, spotlightTop),
              width: Math.max(0, spotlightLeft),
              height: spotlightHeight,
            }}
          />
          <div
            onClick={triggerShake}
            className="fixed right-0 pointer-events-auto z-30"
            style={{
              top: Math.max(0, spotlightTop),
              left: Math.max(0, spotlightLeft + spotlightWidth),
              height: spotlightHeight,
            }}
          />
        </>
      ) : null}

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

      {/* 3. Ghost Pointer Hand for Step 4 (Centered Canvas Line Drag) */}
      {isRoadStep && (
        <div
          key={`hand-road-${handAnimationKey}`}
          style={{
            top: '52%',
            left: '42%',
          }}
          className="fixed z-50 pointer-events-none"
        >
          <div className="relative animate-tour-drag-horizontal -translate-x-5 -translate-y-2">
            <div className="absolute top-0 left-4 w-7 h-7 rounded-full border-2 border-amber-400 animate-ping opacity-60" />
            <WhitePointingHand size={56} className="transform -rotate-12" />
          </div>
        </div>
      )}

      {/* 4. Ghost Pointer Hand for Target Elements */}
      {!isFreeCanvasStep && targetRect && handAction !== 'none' && (
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
              <div className="absolute top-0 left-4 w-7 h-7 rounded-full border-2 border-amber-400 animate-ping opacity-75" />
              <WhitePointingHand size={54} className="transform -rotate-12" />
            </div>
          )}
          {handAction === 'drag-horizontal' && (
            <div className="relative animate-tour-drag-horizontal -translate-x-5 -translate-y-2">
              <div className="absolute top-0 left-4 w-7 h-7 rounded-full border-2 border-amber-400 animate-ping opacity-60" />
              <WhitePointingHand size={54} className="transform -rotate-12" />
            </div>
          )}
        </div>
      )}

      {/* 5. Tooltip Card */}
      <div
        style={tooltipStyle}
        className={`fixed z-50 w-72 sm:w-88 pointer-events-auto transition-transform ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        <div
          className={`relative p-4 rounded-2xl border-2 text-white shadow-2xl shadow-black/80 backdrop-blur-md space-y-2.5 transition-all ${
            isSuccess
              ? 'bg-gradient-to-b from-[#064E3B] to-[#0B0F19] border-emerald-400 shadow-emerald-500/20'
              : 'bg-gradient-to-b from-[#1E293B] to-[#0F172A] border-amber-400 shadow-black/80'
          }`}
        >
          {/* Arrow */}
          {arrowPlacement === 'top' && (
            <div
              className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 border-t-2 border-l-2 transform rotate-45 ${
                isSuccess ? 'bg-[#064E3B] border-emerald-400' : 'bg-[#1E293B] border-amber-400'
              }`}
            />
          )}
          {arrowPlacement === 'bottom' && (
            <div
              className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 border-b-2 border-r-2 transform rotate-45 ${
                isSuccess ? 'bg-[#0B0F19] border-emerald-400' : 'bg-[#0F172A] border-amber-400'
              }`}
            />
          )}
          {arrowPlacement === 'right' && (
            <div
              className={`absolute top-1/2 -right-2.5 -translate-y-1/2 w-4 h-4 border-t-2 border-r-2 transform rotate-45 ${
                isSuccess ? 'bg-[#064E3B] border-emerald-400' : 'bg-[#1E293B] border-amber-400'
              }`}
            />
          )}
          {arrowPlacement === 'left' && (
            <div
              className={`absolute top-1/2 -left-2.5 -translate-y-1/2 w-4 h-4 border-b-2 border-l-2 transform rotate-45 ${
                isSuccess ? 'bg-[#064E3B] border-emerald-400' : 'bg-[#1E293B] border-amber-400'
              }`}
            />
          )}

          {/* Header Pill & Skip Step Button */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isSuccess
                    ? 'bg-emerald-500/30 text-emerald-300'
                    : 'bg-amber-400/20 text-amber-300'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-400" />
                )}
                <span>Шаг {step} из {totalSteps}</span>
              </span>

              {/* Progress counter on Step 4 */}
              {step === 4 && (
                <span className="text-[10px] font-bold text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded-md border border-emerald-500/40">
                  {placedCount} / {targetPlacedCount} блока
                </span>
              )}
            </div>

            {/* Skip current step button */}
            {onSkipStep && step > 0 && !isSuccess && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  onSkipStep();
                }}
                title="Пропустить этот шаг обучения"
                className="text-[10px] text-amber-300 hover:text-white underline font-semibold cursor-pointer transition-colors shrink-0"
              >
                Пропустить шаг ⏭
              </button>
            )}
          </div>

          {/* Title */}
          {title && !isSuccess && (
            <div className="text-xs font-black text-amber-300 uppercase tracking-wide">
              {title}
            </div>
          )}

          {/* Mouse Wheel Visual Demo (Step 5) */}
          {isWheelStep && !isSuccess && (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/80 border border-slate-700">
              <div className="relative w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <Mouse className="w-5 h-5 text-amber-400 animate-pulse" />
                <ArrowUp className="w-3 h-3 text-amber-300 absolute -top-1" />
                <ArrowDown className="w-3 h-3 text-amber-300 absolute -bottom-1" />
              </div>
              <div className="text-xs text-slate-300 font-medium leading-snug">
                Покрути колёсико мыши вперёд или назад, чтобы подвинуть камеру!
              </div>
            </div>
          )}

          {/* Gameplay Keys Demo (Step 10: A/D) */}
          {step === 10 && !isSuccess && (
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm shadow-md flex items-center gap-1 animate-bounce">
                <span>◀ A</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm shadow-md flex items-center gap-1 animate-bounce">
                <span>D ▶</span>
              </div>
            </div>
          )}

          {/* Gameplay Keys Demo (Step 11: Space) */}
          {step === 11 && !isSuccess && (
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-sm shadow-lg flex items-center gap-2 animate-bounce">
                <span>⇧ ПРОБЕЛ (Прыжок)</span>
              </div>
            </div>
          )}

          {/* Message or Success Feedback */}
          {isSuccess ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 flex items-center gap-2.5 text-emerald-200 text-xs sm:text-sm font-bold shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 stroke-[2.5]" />
                <span>{successMessage || 'Отлично! Шаг выполнен!'}</span>
              </div>
              {onNextStep && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    onNextStep();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <span>Дальше</span>
                  <span className="text-sm">→</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
              {message}
            </div>
          )}

          {/* Idle Reminder Help if stuck > 15s */}
          {isIdleHelpActive && !isSuccess && (
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[11px] font-bold flex items-center gap-2 animate-pulse-help">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>💡 Нажми сюда! Подсвеченная кнопка ждёт твоего клика!</span>
            </div>
          )}

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
