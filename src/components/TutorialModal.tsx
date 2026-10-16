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
    whatToTake: 'Вкладка «Враги» (красная вкладка справа). Доступно 4 уникальных боевых типа:',
    howToPlace:
      '1. 🔴 Зверь-охотник: замечает героя и бежит за ним на удвоенной скорости! Ставьте на длинную ровную дорожку.\n2. 🔵 Часовой дозора: бдительно патрулирует свои 3–5 клеток вокруг поста. Ставьте на узкие мостики и платформы.\n3. 🟢 Прыгун-засадник: приседает и совершает высокие дуговые прыжки. Ставьте перед ступеньками.\n4. 🟣 Летучий слайм: парит в воздухе и пикирует волной на героя. Ставьте в воздушные коридоры над пропастью.',
    whereToPlace:
      'Размещайте врагов на платформах или в воздухе (для слайма). Не ставьте врагов вплотную к точке старта героя!',
    extraRule:
      '⚔️ ПРАВИЛА БИТВЫ:\n• ПРЫГНИТЕ НА ВРАГА СВЕРХУ, чтобы уничтожить его! Враг моментально исчезает с хлопком, а герой совершает упругий отскок вверх (+250 очков).\n• Если враг заденет сбоку или снизу: герой теряет 1 жизнь, но НЕ возвращается назад, а продолжает движение вперед с кратковременной защитой!',
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
    title: 'Этап 7: Как начать играть и Управление',
    badge: 'Шаг 7 из 7 · Игра и управление',
    icon: Gamepad2,
    whatToTake: 'Ничего выбирать не нужно — пора запускать ваше приключение!',
    howToPlace:
      'КАК НАЧАТЬ ИГРАТЬ:\nНажмите большую зелёную кнопку «Играть ▶» в верхнем правом углу панели (или нажмите пробел в режиме ожидания)!',
    whereToPlace:
      'УПРАВЛЕНИЕ ГЕРОЕМ:\n• A / D или ⬅ / ➡ — Бег влево и вправо (с плавной инерцией и ускорением).\n• Пробел или W / ⬆ — Прыжок. ГЛАВНОЕ: чем дольше удерживаете клавишу, тем выше прыгает персонаж!\n• Прыжок сверху на врага — сокрушить монстра и отскочить вверх.\n• Удар головой снизу — выбить монетку из блока (?) или разбить кирпич.\n• Esc или кнопка «В редактор» — пауза и мгновенный возврат к доработке уровня.',
    extraRule: '🎮 На смартфонах и планшетах на экране автоматически появляются удобные сенсорные кнопки!',
    sampleActionName: 'Запустить игру прямо сейчас ▶',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <span>Обучение как в играх</span>
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                <span className="text-slate-300 font-semibold">{step.badge}</span>
              </div>
              <h3 className="font-black text-white text-lg leading-tight">
                {step.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {TUTORIAL_STEPS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                idx === currentStep
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
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
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-200">
          {/* Card 1: ЧТО ВЗЯТЬ */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                1. Что взять:
              </div>
              {step.tileId && (
                <button
                  onClick={handleSelectTile}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Взять этот предмет в руку
                </button>
              )}
            </div>
            <div className="text-slate-100 font-medium">
              {step.whatToTake}
            </div>
          </div>

          {/* Card 2: КАК ПОСТАВИТЬ */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              2. Как поставить:
            </div>
            <div className="text-slate-200 whitespace-pre-line leading-relaxed">
              {step.howToPlace}
            </div>
          </div>

          {/* Card 3: КУДА ПОСТАВИТЬ */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              3. Куда поставить:
            </div>
            <div className="text-slate-200 whitespace-pre-line leading-relaxed">
              {step.whereToPlace}
            </div>
          </div>

          {/* Extra Rule / Battle Tip */}
          {step.extraRule && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 text-xs whitespace-pre-line leading-relaxed">
              {step.extraRule}
            </div>
          )}

          {/* Sample Placement CTA */}
          {step.sampleActionName && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">
                Хотите сразу увидеть как это выглядит на карте?
              </span>
              <button
                onClick={handleApplySample}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {step.sampleActionName}
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-t border-slate-700/80">
          <div className="flex items-center gap-2">
            <button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </button>

            {currentStep < TUTORIAL_STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
              >
                Следующий этап
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onStartPlay) onStartPlay();
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 animate-pulse"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Начать играть!
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step.tileId && (
              <button
                onClick={handleSelectTile}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all cursor-pointer"
              >
                Выбрать блок и закрыть
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
