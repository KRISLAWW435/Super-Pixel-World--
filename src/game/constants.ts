/**
 * Super Pixel World - Constants & Catalog
 */

import { HeroConfig, HeroId, PaletteCategory, ThemeConfig, ThemeId, TileId } from '../types/game';

export const CELL_SIZE = 40; // 40px per tile
export const GRID_ROWS = 16; // Standard 16 cells high
export const DEFAULT_GRID_COLS = 160; // 160 cells long world (~6400px)

// High-resolution generated panoramic background images
export const THEMES: Record<ThemeId, ThemeConfig> = {
  green_islands: {
    id: 'green_islands',
    name: 'Зелёные острова',
    subtitle: 'Солнечные холмы, водопады и луга',
    image: '/src/assets/images/bg_green_islands_1792080621436.jpg',
    skyColor: '#63b3ed',
    accentColor: '#48bb78',
    particleColor: '#68d391',
  },
  candy_land: {
    id: 'candy_land',
    name: 'Конфетная страна',
    subtitle: 'Зефирные горы, леденцы и шоколад',
    image: '/src/assets/images/bg_candy_land_1792080622482.jpg',
    skyColor: '#fbb6ce',
    accentColor: '#ed64a6',
    particleColor: '#f687b3',
  },
  ice_world: {
    id: 'ice_world',
    name: 'Ледяной мир',
    subtitle: 'Снежные пики, ледники и сияние',
    image: '/src/assets/images/bg_ice_world_1792080624384.jpg',
    skyColor: '#76e4f7',
    accentColor: '#319795',
    particleColor: '#90cdf4',
  },
  alien_jungle: {
    id: 'alien_jungle',
    name: 'Инопланетные джунгли',
    subtitle: 'Светящиеся грибы и кольца планет',
    image: '/src/assets/images/bg_alien_jungle_1792080637269.jpg',
    skyColor: '#553c9a',
    accentColor: '#9f7aea',
    particleColor: '#b794f4',
  },
};

export const HEROES: Record<HeroId, HeroConfig> = {
  leo: {
    id: 'leo',
    name: 'Лео',
    title: 'Отважный исследователь',
    description: 'Классический искатель приключений в шляпе и походной куртке. Сбалансированная скорость и прыгучесть.',
    primaryColor: '#e53e3e',
    jumpPower: 12.8,
    speed: 5.6,
    perk: 'Сбалансированный герой',
  },
  bolt: {
    id: 'bolt',
    name: 'Болт',
    title: 'Робот-путешественник',
    description: 'Дружелюбный латунный робот с реактивными ботинками. Плавное планирование при удержании прыжка.',
    primaryColor: '#3182ce',
    jumpPower: 12.2,
    speed: 5.2,
    perk: 'Микро-зависание в воздухе',
  },
  pippin: {
    id: 'pippin',
    name: 'Пиппин',
    title: 'Забавный зверёк',
    description: 'Быстрый и юркий пушистый лисёнок-прыгун. Высокие отскоки от пружин и платформ.',
    primaryColor: '#dd6b20',
    jumpPower: 13.8,
    speed: 6.2,
    perk: 'Повышенная скорость и прыжок',
  },
  astro: {
    id: 'astro',
    name: 'Астро',
    title: 'Космонавт',
    description: 'Космический первопроходец в скафандре с подсветкой шлема. Мягкая гравитация.',
    primaryColor: '#805ad5',
    jumpPower: 13.2,
    speed: 5.0,
    perk: 'Мягкое приземление',
  },
};

export interface PaletteItemDef {
  id: TileId;
  name: string;
  category: PaletteCategory;
  solid: boolean;
  desc: string;
  hint: string;
}

export const PALETTE_ITEMS: PaletteItemDef[] = [
  // --- Platforms ---
  {
    id: 'grass_dirt',
    name: 'Трава и земля',
    category: 'platforms',
    solid: true,
    desc: 'Основной блок с сочной зелёной травой',
    hint: 'Тяните курсор, чтобы нарисовать длинную платформу с аккуратными краями!',
  },
  {
    id: 'stone',
    name: 'Каменный блок',
    category: 'platforms',
    solid: true,
    desc: 'Прочные замковые каменные плиты',
    hint: 'Отлично подходит для ступеней, колонн и башен.',
  },
  {
    id: 'wood',
    name: 'Деревянный мост',
    category: 'platforms',
    solid: true,
    desc: 'Деревянные доски и подвесные мостики',
    hint: 'Удобно строить подвесные мосты над пропастями.',
  },
  {
    id: 'brick',
    name: 'Кирпичный блок',
    category: 'platforms',
    solid: true,
    desc: 'Классический кирпич. Разрушается при ударе снизу!',
    hint: 'Прыгните снизу головой, чтобы расколоть блок на осколки!',
  },
  {
    id: 'ice',
    name: 'Ледяной блок',
    category: 'platforms',
    solid: true,
    desc: 'Скользкий ледник. Игрок плавно скользит!',
    hint: 'Персонаж скользит по поверхности льда.',
  },
  {
    id: 'cloud',
    name: 'Облачная платформа',
    category: 'platforms',
    solid: true,
    desc: 'Воздушное пушистое облако',
    hint: 'Легкие парящие островки высоко в небе.',
  },
  {
    id: 'mushroom',
    name: 'Платформа-гриб',
    category: 'platforms',
    solid: true,
    desc: 'Яркая шляпка волшебного гриба',
    hint: 'Слегка подбрасывает персонажа вверх.',
  },
  {
    id: 'candy',
    name: 'Сладкий бисквит',
    category: 'platforms',
    solid: true,
    desc: 'Полосатый вафельный торт с глазурью',
    hint: 'Яркая аппетитная платформа из Конфетной страны.',
  },
  {
    id: 'crystal_block',
    name: 'Кристальный камень',
    category: 'platforms',
    solid: true,
    desc: 'Светящийся монолит с неоновыми жилами',
    hint: 'Атмосферный блок для пещер и инопланетных миров.',
  },
  {
    id: 'pipe_green',
    name: 'Зелёная труба',
    category: 'platforms',
    solid: true,
    desc: 'Знаменитая труба-портал',
    hint: 'Позволяет строить узнаваемые входы и декорации.',
  },

  // --- Interactive Objects & Items ---
  {
    id: 'coin',
    name: 'Золотая монета',
    category: 'objects',
    solid: false,
    desc: 'Круглая сверкающая монета (+1)',
    hint: 'Размещайте дугами над прыжками и платформами.',
  },
  {
    id: 'star',
    name: 'Большая звезда',
    category: 'objects',
    solid: false,
    desc: 'Вращающаяся золотая звезда (+5)',
    hint: 'Прячьте в секретных местах уровня!',
  },
  {
    id: 'crystal',
    name: 'Магический кристалл',
    category: 'objects',
    solid: false,
    desc: 'Сияющий кристалл энергии (+10)',
    hint: 'Редкая драгоценность для самых внимательных игроков.',
  },
  {
    id: 'question_block',
    name: 'Блок с вопросом (?)',
    category: 'objects',
    solid: true,
    desc: 'Секретный блок с сокровищем внутри',
    hint: 'Ударьте снизу головой, чтобы выбить монету!',
  },
  {
    id: 'spring',
    name: 'Батут / Супер-пружина',
    category: 'objects',
    solid: false,
    desc: 'Мощный батут — подкидывает персонажа высоко в небо!',
    hint: 'Наступите или прыгните сверху на батут для взлёта на 8-10 блоков!',
  },
  {
    id: 'spikes',
    name: 'Опасные шипы',
    category: 'objects',
    solid: false,
    desc: 'Острые шипы ловушки',
    hint: 'Прикосновение наносит урон или возвращает к чекпоинту.',
  },
  {
    id: 'checkpoint',
    name: 'Флаг-чекпоинт',
    category: 'objects',
    solid: false,
    desc: 'Контрольная точка сохранения прогресса',
    hint: 'При касании флаг взвивается, запоминая место возрождения.',
  },
  {
    id: 'goal',
    name: 'Финишные ворота',
    category: 'objects',
    solid: false,
    desc: 'Золотой флагшток победы в конце уровня',
    hint: 'Коснитесь ворот, чтобы победить и завершить уровень!',
  },
  {
    id: 'player_spawn',
    name: 'Точка старта',
    category: 'objects',
    solid: false,
    desc: 'Место появления героя в начале игры',
    hint: 'На уровне может быть только одна точка старта.',
  },

  // --- Enemies (Враги и опасные существа) ---
  {
    id: 'enemy_walker',
    name: 'Гриб-бродяга',
    category: 'enemies',
    solid: false,
    desc: 'Патрулирует всю платформу от края до края',
    hint: 'Прыгните на шляпку сверху, чтобы победить его!',
  },
  {
    id: 'enemy_chaser',
    name: 'Зверь-охотник (Бегает за нами!)',
    category: 'enemies',
    solid: false,
    desc: 'Замечает героя и яростно бежит за ним!',
    hint: 'Если подойти близко, он бросается в погоню за игроком!',
  },
  {
    id: 'enemy_patrol',
    name: 'Охранник (Своя территория)',
    category: 'enemies',
    solid: false,
    desc: 'Ходит строго на 3 клетки вокруг своей зоны',
    hint: 'Охраняет свой пост и не уходит далеко от спавна.',
  },
  {
    id: 'enemy_spiky',
    name: 'Шипастый жук',
    category: 'enemies',
    solid: false,
    desc: 'Колючий панцирь — сверху прыгать нельзя!',
    hint: 'Опасный противник. Перепрыгивайте через него!',
  },
  {
    id: 'enemy_slime',
    name: 'Летучий слайм',
    category: 'enemies',
    solid: false,
    desc: 'Парит в воздухе вверх и вниз над пропастью',
    hint: 'Воздушная преграда. Можно сбить точным прыжком сверху.',
  },
  {
    id: 'enemy_jumper',
    name: 'Прыгучая квака',
    category: 'enemies',
    solid: false,
    desc: 'Неожиданно подпрыгивает в сторону героя',
    hint: 'Выжидает момент и совершает высокий прыжок!',
  },
];
