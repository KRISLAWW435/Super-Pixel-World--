/**
 * Super Pixel World - Interactive Game Tutorial & Step-by-Step Academy Modal
 * Detailed guide for each stage: what item to pick, how and where to place it, how to start playing, and hero controls.
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Gamepad2,
  Hammer,
  HelpCircle,
  Play,
  ShieldAlert,
  Sparkles,
  Swords,
  Target,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { TileId } from '../types/game';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTile?: (tile: TileId) => void;
  onStartPlay?: () => void;
  onApplyStepSample?: (stepIndex: number) => void;
  initialStep?: number;
}

export interface TutorialStepDef {
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  tileId?: TileId;
  tileName?: string;
  categoryName?: string;
  whatToTake: string;
  howToPlace: string;
  whereToPlace: string;
  extraRule?: string;
  sampleActionName?: string;
}

export const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    title: 'Этап 1: Дорога и платформы (Основа уровня)',
    badge: 'Шаг 1 из 7 · Платформы',
    icon: Hammer,
    tileId: 'grass_dirt',
    tileName: 'Трава и земля',
    categoryName: 'Платформы',
    whatToTake: 'Блок «Трава и земля» (или Камень / Деревянный мост) во вкладке «Платформы» справа.',
    howToPlace:
      'Зажмите ЛКМ (левую кнопку мыши) и плавно протяните курсор горизонтально — блоки автоматически соединятся в ровную дорогу с красивыми травяными краями! Для единичных блоков просто кликайте.',
    whereToPlace:
      'На нижних строках сетки (ряды 13–14), чтобы герой не падал в бездну. Оставляйте небольшие ямы шириной в 2–4 клетки для прыжков.',
    extraRule: '💡 ПКМ (правая кнопка мыши) мгновенно стирает любой блок под курсором.',
    sampleActionName: 'Поставить образец дороги',
  },
  {
    title: 'Этап 2: Опасные препятствия (Шипы и пропасти)',
    badge: 'Шаг 2 из 7 · Препятствия',
    icon: ShieldAlert,
    tileId: 'spikes',
    tileName: 'Опасные шипы',
    categoryName: 'Объекты',
    whatToTake: 'Предмет «Опасные шипы» во вкладке «Объекты» справа.',
    howToPlace:
      'Кликните ЛКМ по пустой клетке на полу или в углублении. Если поставили не туда — кликните по шипам правой кнопкой мыши (ПКМ) для удаления.',
    whereToPlace:
      'На дно ямы между островками или перед ступенькой. Игрок должен будет рассчитать разбег и перепрыгнуть опасную зону, иначе потеряет сердечко!',
    extraRule: '💡 Шипы можно комбинировать с кирпичными блоками и узкими островками.',
    sampleActionName: 'Поставить яму с шипами',
  },
  {
    title: 'Этап 3: Сокровища и блок с вопросом (?)',
    badge: 'Шаг 3 из 7 · Секреты',
    icon: Sparkles,
    tileId: 'question_block',
    tileName: 'Блок с вопросом (?)',
    categoryName: 'Объекты',
    whatToTake:
      '«Блок с вопросом (?)», «Золотая монета» (+1) или «Большая звезда» (+5) во вкладке «Объекты».',
    howToPlace:
      'Устанавливайте блоки и монетки одиночными кликами ЛКМ. Монетки размещайте плавной дугой над пропастью — они подсказывают игроку идеальную траекторию прыжка!',
    whereToPlace:
      'Блок (?) размещайте на высоте 3–4 клетки над платформой (на уровне рядов 9–10). Тогда герой на бегу сможет прыгнуть и ударить его снизу головой, выбив монетку!',
    extraRule: '💡 Кирпичный блок разрушается на осколки при ударе головой снизу!',
    sampleActionName: 'Поставить блок (?) и монеты',
  },
  {
    title: 'Этап 4: Супер-пружина (Батут для взлёта)',
    badge: 'Шаг 4 из 7 · Механика',
    icon: Zap,
    tileId: 'spring',
    tileName: 'Батут / Супер-пружина',
    categoryName: 'Объекты',
    whatToTake: '«Батут / Супер-пружина» во вкладке «Объекты».',
    howToPlace: 'Кликните ЛКМ прямо на верхнюю грань любой твердой платформы.',
    whereToPlace:
      'Перед высокой отвесной стеной (6–8 блоков) или широкой пропастью, куда невозможно допрыгнуть обычным прыжком. При наступлении сверху герой взмывает высоко в небо на 8–10 клеток!',
    extraRule: '💡 Прыгните на батут с разбега, чтобы совершить рекордный дальний прыжок!',
    sampleActionName: 'Поставить батут перед стеной',
  },
  {
    title: 'Этап 5: Расстановка боевых врагов и битва',
    badge: 'Шаг 5 из 7 · 4 врага',
    icon: Swords,
    tileId: 'enemy_chaser',
    tileName: 'Зверь-охотник',
    categoryName: 'Враги',
    whatToTake: 'Вкладка «Враги» (красная вкладка справа). Выберите любого из 4 монстров:',
    howToPlace:
      '🔴 Зверь-охотник: Быстро бежит за героем. Прыгай ему на голову!\n\n🔵 Часовой дозора: Патрулирует узкий участок.\n\n🟢 Прыгун-засадник: Совершает высокие прыжки.\n\n🟣 Летучий пикировщик: Летает в воздухе.',
    whereToPlace:
      'Размещайте врагов на платформах или в воздухе. Не ставьте монстров вплотную к старту!',
    extraRule:
      '⚔️ ПРАВИЛА БИТВЫ:\n• Прыгай на врага сверху, чтобы уничтожить его и совершить отскок вверх!\n• Если монстр заденет сбоку — герой потеряет сердце, но побежит дальше с защитой.',
    sampleActionName: 'Поставить образец врагов',
  },
  {
    title: 'Этап 6: Финишные ворота (Цель уровня)',
    badge: 'Шаг 6 из 7 · Финиш',
    icon: Target,
    tileId: 'goal',
    tileName: 'Финишные ворота',
    categoryName: 'Объекты',
    whatToTake: '«Финишные ворота» во вкладке «Объекты».',
    howToPlace:
      'Установите ворота ЛКМ строго на твердую платформу. Чтобы быстро переместиться в конец карты, кликните по правому краю нижней мини-карты или нажмите кнопку «Финиш».',
    whereToPlace:
      'В самом правом конце вашего уровня. Коснувшись ворот, герой завершает карту победным салютом, подсчетом очков и звезд!',
    extraRule: '💡 Без финишных ворот уровень нельзя закончить победой — не забудьте их поставить!',
    sampleActionName: 'Поставить финишные ворота',
  },
  {
    title: 'Этап 7: Проверка уровня',
    badge: 'Шаг 7 из 7 · Тестирование',
    icon: Gamepad2,
    whatToTake: 'Все элементы расставлены — пора испытать твой уровень в действии!',
    howToPlace: 'Нажмите кнопку «ТЕСТ» в правом верхнем углу, чтобы проверить уровень.',
    whereToPlace: 'Кнопка «ТЕСТ» всегда закреплена в правом верхнем углу экрана и доступна в любой момент.',
    sampleActionName: 'Запустить проверку уровня ▶',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onSelectTile,
  onStartPlay,
  onApplyStepSample,
  initialStep = 0,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const Icon = step.icon;

  const handleSelectTile = () => {
    if (step.tileId && onSelectTile) {
      onSelectTile(step.tileId);
      sound.playSelect();
      onClose();
    }
  };

  const handleApplySample = () => {
    if (currentStep === 6 && onStartPlay) {
      onStartPlay();
      onClose();
      return;
    }
    if (onApplyStepSample) {
      onApplyStepSample(currentStep);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-4xl lg:max-w-5xl retro-modal tutorial-modal overflow-hidden flex flex-col max-h-[92vh] bg-[var(--panel-bg)] text-[var(--text-main)] border-4 border-black shadow-[6px_6px_0px_#000000]">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 sm:px-8 py-4 border-b-4 border-black"
          style={{ backgroundColor: 'var(--panel-header)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-400/25 border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center text-amber-500 shrink-0">
              <Icon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                <span>Обучение как в играх</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[var(--text-muted)] font-semibold">{step.badge}</span>
              </div>
              <h3 className="font-bold text-[var(--text-main)] text-xl sm:text-2xl leading-tight mt-0.5">
                {step.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[var(--card-bg)] text-[var(--text-main)] hover:text-white hover:bg-rose-500 border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-y-0.5 active:shadow-none flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-3"
            title="Закрыть"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="px-6 sm:px-8 py-3 bg-[var(--card-subtle)] border-b-2 border-black flex items-center gap-2 overflow-x-auto scrollbar-none">
          {TUTORIAL_STEPS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border-2 border-black ${
                idx === currentStep
                  ? 'bg-amber-400 text-slate-950 font-black shadow-[2px_2px_0px_#000] scale-102'
                  : 'bg-[var(--card-bg)] hover:bg-[var(--slot-bg)] text-[var(--text-muted)] shadow-[1px_1px_0px_#000]'
              }`}
            >
              <span>{idx + 1}.</span>
              <span className="hidden sm:inline">
                {idx === 0 && 'Дорога'}
                {idx === 1 && 'Препятствия'}
                {idx === 2 && 'Сокровища'}
                {idx === 3 && 'Батут'}
                {idx === 4 && '4 Врага'}
                {idx === 5 && 'Финиш'}
                {idx === 6 && 'Игра и Управление'}
              </span>
            </button>
          ))}
        </div>

        {/* Main Step Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 bg-[var(--panel-bg)] text-[var(--tutorial-text)]">
          {/* Card 1: ЧТО ВЗЯТЬ */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--card-subtle)] border-2 border-black shadow-[3px_3px_0px_#000000] space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                1. Что взять:
              </div>
              {step.tileId && (
                <button
                  onClick={handleSelectTile}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border-2 border-black text-amber-500 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-[1px_1px_0px_#000]"
                >
                  <Wand2 className="w-4 h-4" />
                  Взять этот предмет в руку
                </button>
              )}
            </div>
            <div className="text-[15px] sm:text-base text-[var(--tutorial-text)] font-semibold leading-relaxed">
              {step.whatToTake}
            </div>
          </div>

          {/* Card 2: ЧТО СДЕЛАТЬ / КАК ПОСТАВИТЬ */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--card-subtle)] border-2 border-black shadow-[3px_3px_0px_#000000] space-y-3">
            <div className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-500 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              2. Что сделать:
            </div>
            <div className="text-[15px] sm:text-base text-[var(--tutorial-text)] whitespace-pre-line leading-loose font-normal">
              {step.howToPlace}
            </div>
          </div>

          {/* Card 3: КУДА ПОСТАВИТЬ */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--card-subtle)] border-2 border-black shadow-[3px_3px_0px_#000000] space-y-2">
            <div className="text-sm sm:text-base font-black uppercase tracking-wider text-sky-500 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              3. Куда поставить:
            </div>
            <div className="text-[15px] sm:text-base text-[var(--tutorial-text)] whitespace-pre-line leading-relaxed font-normal">
              {step.whereToPlace}
            </div>
          </div>

          {/* Extra Rule / Combat Rules with Clear Margins */}
          {step.extraRule && (
            <div className="mt-5 p-5 sm:p-6 rounded-2xl bg-[var(--pastel-blue)] border-2 border-[var(--border-color)] text-[var(--tutorial-text)] text-sm sm:text-[15px] whitespace-pre-line leading-relaxed shadow-[3px_3px_0px_#000000]">
              {step.extraRule}
            </div>
          )}

          {/* Sample Placement CTA */}
          {step.sampleActionName && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-[var(--card-subtle)] border-2 border-black shadow-[2px_2px_0px_#000000] text-sm">
              <span className="text-[var(--text-main)] font-medium text-center sm:text-left">
                Хотите сразу увидеть как это выглядит на карте?
              </span>
              <button
                onClick={handleApplySample}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 border-2 border-black text-slate-950 font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-[2px_2px_0px_#000] shrink-0"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                {step.sampleActionName}
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 sm:px-8 py-4 sm:py-5 bg-[var(--panel-header)] border-t-4 border-black shrink-0">
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              className="px-4 py-2.5 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--slot-bg)] disabled:opacity-40 disabled:pointer-events-none text-[var(--text-main)] text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer border-2 border-black shadow-[2px_2px_0px_#000]"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </button>

            {currentStep < TUTORIAL_STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer border-2 border-black shadow-[3px_3px_0px_#000] active:scale-95"
              >
                Следующий этап
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onStartPlay) onStartPlay();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer border-2 border-black shadow-[3px_3px_0px_#000] active:scale-95 animate-pulse"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Начать играть!
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {step.tileId && (
              <button
                onClick={handleSelectTile}
                className="px-4 py-2.5 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--slot-bg)] text-amber-500 text-xs sm:text-sm font-bold transition-all cursor-pointer border-2 border-black shadow-[2px_2px_0px_#000]"
              >
                Выбрать блок и закрыть
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--slot-bg)] text-[var(--text-main)] text-xs sm:text-sm font-bold transition-all cursor-pointer border-2 border-black shadow-[2px_2px_0px_#000]"
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
