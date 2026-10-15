/**
 * Super Pixel World - Interactive Guide & Step-by-Step Instructions Modal
 */

import React, { useState } from 'react';
import { BookOpen, CheckCircle, ChevronLeft, ChevronRight, Gamepad2, Hammer, Sparkles, Trophy, X } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: 'Добро пожаловать в Super Pixel World!',
    icon: Sparkles,
    badge: 'Основы',
    content: (
      <div className="space-y-3 text-slate-200 text-sm">
        <p>
          Перед вами полноценный <strong>конструктор 2D-платформеров</strong> в классическом стиле.
          Вы можете построить огромный мир, расставить препятствия, монстров и секреты, а затем нажать
          <span className="text-emerald-400 font-bold ml-1">«Играть»</span> и сразу пройти свой шедевр!
        </p>
        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5 text-xs text-slate-300">
          <div className="font-semibold text-amber-400">⚡ Быстрый старт:</div>
          <div>1. Выберите блок во вкладке <strong>Платформы</strong> справа.</div>
          <div>2. Кликните или протяните мышь по игровому полю.</div>
          <div>3. Нажмите зелёную кнопку <strong>«Играть»</strong> для тестирования.</div>
        </div>
      </div>
    ),
  },
  {
    title: 'Как строить платформы и уровни',
    icon: Hammer,
    badge: 'Редактор',
    content: (
      <div className="space-y-3 text-slate-200 text-sm">
        <p>
          Строить так же просто, как рисовать карандашом!
        </p>
        <ul className="space-y-2 text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold">ЛКМ</span>
            <span><strong>Размещение:</strong> кликните по клетке для установки выбранного блока или предмета.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">Протяжка</span>
            <span><strong>Длинные мосты:</strong> зажмите ЛКМ и потяните мышь вправо или влево — платформы соединятся с аккуратными краями!</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono font-bold">ПКМ</span>
            <span><strong>Быстрое удаление:</strong> клик правой кнопкой мыши моментально удаляет любой объект под курсором.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">Скролл</span>
            <span><strong>Прокрутка мира:</strong> перетаскивайте нижнюю мини-карту или крутите колесико мыши для перемещения вдоль длинного уровня.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: 'Управление героем в игре',
    icon: Gamepad2,
    badge: 'Игра',
    content: (
      <div className="space-y-3 text-slate-200 text-sm">
        <p>
          Физика платформера плавная и отзывчивая — персонаж обладает приятной инерцией и регулируемой высотой прыжка.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-amber-400 font-bold mb-1">A / D или ⬅ / ➡</div>
            <div className="text-slate-300">Движение влево и вправо с плавным разгоном</div>
          </div>
          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-emerald-400 font-bold mb-1">Пробел или ⬆ / W</div>
            <div className="text-slate-300">Прыжок (чем дольше держите, тем выше прыгает!)</div>
          </div>
          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-cyan-400 font-bold mb-1">Батут-пружина</div>
            <div className="text-slate-300">Прыгните сверху на пружину для супер-взлёта</div>
          </div>
          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-rose-400 font-bold mb-1">Esc / Пауза</div>
            <div className="text-slate-300">Пауза или быстрый возврат в редактор</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Секреты, враги и победа',
    icon: Trophy,
    badge: 'Механики',
    content: (
      <div className="space-y-3 text-slate-200 text-sm">
        <ul className="space-y-2 text-xs text-slate-300">
          <li>
            <strong className="text-amber-400">Блок с вопросом (?)</strong> — ударьте снизу головой в прыжке, чтобы выбить золотую монету!
          </li>
          <li>
            <strong className="text-orange-400">Кирпичный блок</strong> — разбивается на осколки при ударе головой снизу.
          </li>
          <li>
            <strong className="text-red-400">Грибы-враги</strong> — прыгните на голову сверху, чтобы победить врага и отскочить!
          </li>
          <li>
            <strong className="text-rose-400">Шипы и колючки</strong> — опасные ловушки, отнимающие жизнь.
          </li>
          <li>
            <strong className="text-emerald-400">Чекпоинт</strong> — сохраняет место возрождения при касании флага.
          </li>
          <li>
            <strong className="text-yellow-300">Финишные ворота</strong> — поставьте их в конце уровня для праздничной победы с салютом и статистикой!
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: 'Сохранение и автономность',
    icon: BookOpen,
    badge: 'Файлы',
    content: (
      <div className="space-y-3 text-slate-200 text-sm">
        <p>
          Все ваши уровни работают полностью автономно и сохраняются прямо в браузере:
        </p>
        <ul className="space-y-2 text-xs text-slate-300">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Автосохранение:</strong> игра автоматически помнит ваш последний уровень при перезагрузке страницы.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Скачать JSON:</strong> кнопка «Сохранить» скачивает файл уровня на ваш компьютер, чтобы делиться с друзьями.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Загрузить JSON:</strong> кнопка «Загрузить» позволяет открыть любой сохранённый уровень за секунду.</span>
          </li>
        </ul>
      </div>
    ),
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/90 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Инструкция · {step.badge} ({currentStep + 1}/{STEPS.length})
              </div>
              <h3 className="font-bold text-white text-base leading-tight">
                {step.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 min-h-[200px]">
          {step.content}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/70 border-t border-slate-700/60">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === currentStep ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Назад
              </button>
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                Далее
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                Понятно, начать игру!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
