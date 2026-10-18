/**
 * Pixel Studio Pro - Inline Educational Missions Bar
 *
 * Compact, non-intrusive widget that integrates seamlessly into the Studio Header Bar (48px):
 * - Never covers or pushes down the canvas grid.
 * - Displays mission number, title, and quick action (e.g. "+ Вставить образец").
 * - Has expandable tooltip/popover for the current objective.
 * - Supports next/prev navigation and quick help.
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  HelpCircle,
  Play,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { TileId } from '../types/game';
import { TUTORIAL_STEPS } from './TutorialModal';

interface EditorTutorialBarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onSelectTile: (tile: TileId) => void;
  onApplySample: (step: number) => void;
  onStartPlay: () => void;
  onOpenFullModal: (step: number) => void;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export const EditorTutorialBar: React.FC<EditorTutorialBarProps> = ({
  currentStep,
  onStepChange,
  onSelectTile,
  onApplySample,
  onStartPlay,
  onOpenFullModal,
  onClose,
  isMinimized,
  onToggleMinimize,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const step = TUTORIAL_STEPS[currentStep] || TUTORIAL_STEPS[0];
  const Icon = step.icon;

  // Close popover when clicking outside
  React.useEffect(() => {
    if (!isPopoverOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [isPopoverOpen]);

  const handlePickItem = () => {
    if (step.tileId) {
      onSelectTile(step.tileId);
      sound.playSelect();
    }
  };

  const handleApply = () => {
    if (currentStep === 6) {
      onStartPlay();
      return;
    }
    onApplySample(currentStep);
    sound.playPlaceTile();
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      sound.playClick();
      onStepChange(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      sound.playClick();
      onStepChange(currentStep + 1);
    }
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => {
          sound.playClick();
          onToggleMinimize();
        }}
        title="Развернуть подсказку по миссии"
        className="h-8 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm select-none"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Миссия {currentStep + 1}/7</span>
        <ChevronDown className="w-3 h-3 text-amber-400" />
      </button>
    );
  }

  return (
    <div ref={popoverRef} className="relative flex items-center z-50">
      {/* Compact Capsule Widget */}
      <div className="h-8.5 px-2 bg-slate-950/90 border border-amber-400/50 rounded-xl flex items-center gap-2 shadow-md text-xs select-none">
        {/* Step Badge & Title - Click to Expand / Collapse Mission Hints */}
        <button
          onClick={() => {
            sound.playClick();
            setIsPopoverOpen((p) => !p);
          }}
          title={isPopoverOpen ? 'Свернуть подробности' : 'Развернуть подробности миссии'}
          className="flex items-center gap-1.5 hover:text-amber-300 text-slate-200 transition-colors cursor-pointer text-left"
        >
          <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
            {currentStep + 1}
          </span>
          <span className="font-semibold text-xs text-white max-w-[130px] sm:max-w-[200px] truncate">
            {step.title.split(':')[1]?.trim() || step.title}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform duration-200 ${isPopoverOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className="w-[1px] h-3.5 bg-slate-800" />

        {/* Quick Sample Action */}
        <button
          onClick={handleApply}
          title={currentStep === 6 ? 'Запустить плейтест' : 'Вставить пример этой зоны в уровень'}
          className="h-6 px-2 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          {currentStep === 6 ? (
            <>
              <Play className="w-3 h-3 fill-slate-950" />
              <span>Тест</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3 h-3" />
              <span className="hidden sm:inline">Образец</span>
            </>
          )}
        </button>

        {/* Prev / Next Chevrons */}
        <div className="flex items-center">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            title="Предыдущая миссия"
            className="w-5 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentStep === TUTORIAL_STEPS.length - 1}
            title="Следующая миссия"
            className="w-5 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Minimize Button */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleMinimize();
          }}
          title="Свернуть виджет"
          className="w-5 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover Card for Details (Opens below the bar with high z-index and centered positioning) */}
      {isPopoverOpen && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[70] w-[340px] sm:w-[460px] max-w-[92vw] p-5 rounded-2xl bg-[#131B2E] border-2 border-amber-400/80 shadow-2xl shadow-black/95 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                {step.badge}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                {step.title}
              </h4>
            </div>
            <button
              onClick={() => setIsPopoverOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Что сделать:
              </div>
              <div className="text-xs sm:text-[13px] text-slate-100 whitespace-pre-line leading-relaxed font-normal bg-slate-900/70 p-3 rounded-xl border border-slate-800/80">
                {step.howToPlace}
              </div>
            </div>

            {step.extraRule && (
              <div className="mt-2.5 p-3 rounded-xl bg-indigo-950/70 border border-indigo-500/50 text-indigo-200 text-xs whitespace-pre-line leading-relaxed shadow-sm">
                {step.extraRule}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            {step.tileId && (
              <button
                onClick={() => {
                  handlePickItem();
                  setIsPopoverOpen(false);
                }}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                Выбрать блок «{step.tileName || 'Тайла'}»
              </button>
            )}
            <button
              onClick={() => {
                setIsPopoverOpen(false);
                onOpenFullModal(currentStep);
              }}
              className="text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer ml-auto"
            >
              <HelpCircle className="w-3 h-3 text-amber-400" />
              <span>Гид</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
