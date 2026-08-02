/* ============================================================
   Chirp — curriculum data
   w  = English word            t  = translations {es, fr}
   e  = picture (emoji)         ph = short phrase (2-4 words)
   s  = full sentence
   ============================================================ */

export const LANGS = [
  { id: 'es', name: 'Español',  flag: '🇪🇸' },
  { id: 'fr', name: 'Français', flag: '🇫🇷' },
  { id: 'en', name: 'English only', flag: '🌍' }
];

export const MOTIVATIONS = [
  { id: 'friends',  label: 'Friends',   emoji: '🤝', color: '#8DD54F', size: 118 },
  { id: 'school',   label: 'School',    emoji: '🎒', color: '#26C1FC', size: 96 },
  { id: 'games',    label: 'Games',     emoji: '🎮', color: '#BF8FFD', size: 104 },
  { id: 'travel',   label: 'Travel',    emoji: '✈️', color: '#FFB525', size: 92 },
  { id: 'cartoons', label: 'Cartoons',  emoji: '📺', color: '#FF8AD1', size: 110 },
  { id: 'family',   label: 'Family',    emoji: '🏡', color: '#FF7A6B', size: 88 }
];

export const GOALS = [
  { id: 'simple',    label: 'Simple',    mins: 5,  xp: 20, sub: '5 min/day'  },
  { id: 'normal',    label: 'Normal',    mins: 10, xp: 40, sub: '10 min/day' },
  { id: 'hard',      label: 'Hard',      mins: 15, xp: 70, sub: '15 min/day' },
  { id: 'intensive', label: 'Intensive', mins: 20, xp: 100, sub: '20 min/day' }
];

export const LEVELS = [
  { id: 'beginner',     label: 'Beginner',     sub: '0 – 300 words',    world: 0 },
  { id: 'intermediate', label: 'Intermediate', sub: '300 – 900 words',  world: 1 },
  { id: 'advanced',     label: 'Advanced',     sub: '900+ words',       world: 2 }
];

/* ---------------------------------------------------------- */

export const WORLDS = [
  { id: 'meadow', name: 'Meadow',  color: '#8DD54F', dark: '#5FB024', sky: '#C9F08D', label: 'World 1' },
  { id: 'desert', name: 'Desert',  color: '#FFB525', dark: '#E08A00', sky: '#FFE0A3', label: 'World 2' },
  { id: 'ocean',  name: 'Ocean',   color: '#26C1FC', dark: '#0A8FD0', sky: '#B6E9FF', label: 'World 3' }
];

export const LESSONS = [
  /* ============================ WORLD 1 — MEADOW ============================ */
  {
    id: 'weather', world: 0, title: 'Weather', icon: '⛅️', color: '#FFB525', mascot: 'fox',
    words: [
      { w:'sun',   t:{es:'sol',    fr:'soleil'}, e:'☀️', ph:'the warm sun',      s:'The sun is warm today.' },
      { w:'rain',  t:{es:'lluvia', fr:'pluie'},  e:'🌧️', ph:'a lot of rain',     s:'I like to jump in the rain.' },
      { w:'cloud', t:{es:'nube',   fr:'nuage'},  e:'☁️', ph:'a big white cloud', s:'That cloud looks like a sheep.' },
      { w:'wind',  t:{es:'viento', fr:'vent'},   e:'🌬️', ph:'the cold wind',     s:'The wind moves the trees.' },
      { w:'snow',  t:{es:'nieve',  fr:'neige'},  e:'❄️', ph:'soft white snow',   s:'We play in the snow in winter.' },
      { w:'storm', t:{es:'tormenta',fr:'orage'}, e:'⛈️', ph:'a loud storm',      s:'The storm is very loud tonight.' }
    ]
  },
  {
    id: 'clothes', world: 0, title: 'Clothes', icon: '👕', color: '#26C1FC', mascot: 'bunny',
    words: [
      { w:'shirt',  t:{es:'camisa',   fr:'chemise'},  e:'👕', ph:'a blue shirt',      s:'I wear a blue shirt to school.' },
      { w:'dress',  t:{es:'vestido',  fr:'robe'},     e:'👗', ph:'a red dress',       s:'She has a red dress for the party.' },
      { w:'shoes',  t:{es:'zapatos',  fr:'chaussures'},e:'👟', ph:'my new shoes',     s:'My new shoes are very fast.' },
      { w:'hat',    t:{es:'sombrero', fr:'chapeau'},  e:'🧢', ph:'a funny hat',       s:'Grandpa wears a funny hat.' },
      { w:'jacket', t:{es:'chaqueta', fr:'veste'},    e:'🧥', ph:'a warm jacket',     s:'Put on a warm jacket, it is cold.' },
      { w:'socks',  t:{es:'calcetines',fr:'chaussettes'},e:'🧦',ph:'two green socks', s:'I cannot find my two green socks.' }
    ]
  },
  {
    id: 'family', world: 0, title: 'Family', icon: '🏡', color: '#FF8AD1', mascot: 'bear',
    words: [
      { w:'mother',  t:{es:'madre',   fr:'mère'},    e:'👩', ph:'my kind mother',   s:'My mother makes the best soup.' },
      { w:'father',  t:{es:'padre',   fr:'père'},    e:'👨', ph:'my tall father',   s:'My father is very tall.' },
      { w:'sister',  t:{es:'hermana', fr:'sœur'},    e:'👧', ph:'my little sister', s:'My little sister likes to sing.' },
      { w:'brother', t:{es:'hermano', fr:'frère'},   e:'👦', ph:'my big brother',   s:'My big brother plays the guitar.' },
      { w:'baby',    t:{es:'bebé',    fr:'bébé'},    e:'👶', ph:'a sleepy baby',    s:'The sleepy baby is in the bed.' },
      { w:'grandma', t:{es:'abuela',  fr:'grand-mère'},e:'👵',ph:'my funny grandma',s:'My funny grandma tells good stories.' }
    ]
  },
  {
    id: 'nature', world: 0, title: 'Nature', icon: '🌿', color: '#8DD54F', mascot: 'deer',
    words: [
      { w:'tree',   t:{es:'árbol', fr:'arbre'},   e:'🌳', ph:'a tall tree',      s:'A bird sits in the tall tree.' },
      { w:'flower', t:{es:'flor',  fr:'fleur'},   e:'🌸', ph:'a pink flower',    s:'The pink flower smells nice.' },
      { w:'river',  t:{es:'río',   fr:'rivière'}, e:'🏞️', ph:'a cold river',     s:'The cold river runs very fast.' },
      { w:'stone',  t:{es:'piedra',fr:'pierre'},  e:'🪨', ph:'a round stone',    s:'I found a round stone by the river.' },
      { w:'grass',  t:{es:'hierba',fr:'herbe'},   e:'🌱', ph:'soft green grass', s:'We sit on the soft green grass.' },
      { w:'mountain',t:{es:'montaña',fr:'montagne'},e:'⛰️',ph:'a big mountain',  s:'The big mountain touches the clouds.' }
    ]
  },
  {
    id: 'animals', world: 0, title: 'Animals', icon: '🐾', color: '#BF8FFD', mascot: 'fox',
    words: [
      { w:'dog',    t:{es:'perro',  fr:'chien'},  e:'🐶', ph:'a happy dog',    s:'The happy dog runs to me.' },
      { w:'cat',    t:{es:'gato',   fr:'chat'},   e:'🐱', ph:'a sleepy cat',   s:'The sleepy cat sits on my book.' },
      { w:'bird',   t:{es:'pájaro', fr:'oiseau'}, e:'🐦', ph:'a small bird',   s:'A small bird sings in the morning.' },
      { w:'horse',  t:{es:'caballo',fr:'cheval'}, e:'🐴', ph:'a brown horse',  s:'The brown horse eats the grass.' },
      { w:'rabbit', t:{es:'conejo', fr:'lapin'},  e:'🐰', ph:'a fast rabbit',  s:'The fast rabbit jumps over the box.' },
      { w:'frog',   t:{es:'rana',   fr:'grenouille'},e:'🐸',ph:'a green frog', s:'The green frog jumps in the water.' }
    ]
  },
  {
    id: 'colors', world: 0, title: 'Colors', icon: '🎨', color: '#FF7A6B', mascot: 'frog',
    words: [
      { w:'red',    t:{es:'rojo',    fr:'rouge'}, e:'🔴', ph:'a red apple',     s:'I want to eat a red apple.' },
      { w:'blue',   t:{es:'azul',    fr:'bleu'},  e:'🔵', ph:'the blue sky',    s:'The blue sky is full of stars.' },
      { w:'green',  t:{es:'verde',   fr:'vert'},  e:'🟢', ph:'green leaves',    s:'The green leaves move in the wind.' },
      { w:'yellow', t:{es:'amarillo',fr:'jaune'}, e:'🟡', ph:'a yellow banana', s:'The monkey holds a yellow banana.' },
      { w:'purple', t:{es:'morado',  fr:'violet'},e:'🟣', ph:'purple grapes',   s:'These purple grapes are very sweet.' },
      { w:'orange', t:{es:'naranja', fr:'orange'},e:'🟠', ph:'an orange fish',  s:'An orange fish swims in the tank.' }
    ]
  },

  /* ============================ WORLD 2 — DESERT ============================ */
  {
    id: 'food', world: 1, title: 'Food', icon: '🍎', color: '#FF7A6B', mascot: 'bear',
    words: [
      { w:'bread',  t:{es:'pan',     fr:'pain'},    e:'🍞', ph:'fresh warm bread', s:'We buy fresh warm bread every morning.' },
      { w:'cheese', t:{es:'queso',   fr:'fromage'}, e:'🧀', ph:'a piece of cheese',s:'The mouse wants a piece of cheese.' },
      { w:'apple',  t:{es:'manzana', fr:'pomme'},   e:'🍏', ph:'a green apple',    s:'A green apple is my favourite snack.' },
      { w:'soup',   t:{es:'sopa',    fr:'soupe'},   e:'🍲', ph:'hot tomato soup',  s:'Hot tomato soup is good when I am sick.' },
      { w:'honey',  t:{es:'miel',    fr:'miel'},    e:'🍯', ph:'sweet golden honey',s:'The bear eats sweet golden honey.' },
      { w:'juice',  t:{es:'jugo',    fr:'jus'},     e:'🧃', ph:'cold orange juice',s:'I drink cold orange juice with breakfast.' }
    ]
  },
  {
    id: 'kitchen', world: 1, title: 'Kitchen', icon: '🍳', color: '#FFB525', mascot: 'bunny',
    words: [
      { w:'spoon', t:{es:'cuchara', fr:'cuillère'}, e:'🥄', ph:'a silver spoon',   s:'Stir the soup with a silver spoon.' },
      { w:'plate', t:{es:'plato',   fr:'assiette'}, e:'🍽️', ph:'a clean plate',    s:'Please put the clean plate on the table.' },
      { w:'cup',   t:{es:'taza',    fr:'tasse'},    e:'☕️', ph:'a small cup',      s:'She drinks tea from a small cup.' },
      { w:'knife', t:{es:'cuchillo',fr:'couteau'},  e:'🔪', ph:'a sharp knife',    s:'A sharp knife is only for grown ups.' },
      { w:'bowl',  t:{es:'tazón',   fr:'bol'},      e:'🥣', ph:'a blue bowl',      s:'My cereal is in the blue bowl.' },
      { w:'fridge',t:{es:'nevera',  fr:'frigo'},    e:'🧊', ph:'inside the fridge',s:'The milk is inside the fridge.' }
    ]
  },
  {
    id: 'body', world: 1, title: 'Body', icon: '🖐️', color: '#FF8AD1', mascot: 'rhino',
    words: [
      { w:'head',     t:{es:'cabeza', fr:'tête'},   e:'🧠', ph:'shake your head',  s:'Shake your head if you say no.' },
      { w:'hand',     t:{es:'mano',   fr:'main'},   e:'✋', ph:'wave your hand',   s:'Wave your hand and say hello.' },
      { w:'foot',     t:{es:'pie',    fr:'pied'},   e:'🦶', ph:'my left foot',     s:'My left foot is faster than my right one.' },
      { w:'eye',      t:{es:'ojo',    fr:'œil'},    e:'👁️', ph:'close your eyes',  s:'Close your eyes and count to ten.' },
      { w:'mouth',    t:{es:'boca',   fr:'bouche'}, e:'👄', ph:'open your mouth',  s:'Open your mouth wide and say ah.' },
      { w:'shoulder', t:{es:'hombro', fr:'épaule'}, e:'💪', ph:'a strong shoulder',s:'He carries the bag on a strong shoulder.' }
    ]
  },
  {
    id: 'actions', world: 1, title: 'Actions', icon: '🏃', color: '#8DD54F', mascot: 'fox',
    words: [
      { w:'run',   t:{es:'correr', fr:'courir'}, e:'🏃', ph:'run very fast',    s:'I can run very fast in the park.' },
      { w:'jump',  t:{es:'saltar', fr:'sauter'}, e:'🤸', ph:'jump up high',     s:'Watch me jump up high on the bed.' },
      { w:'swim',  t:{es:'nadar',  fr:'nager'},  e:'🏊', ph:'swim in the sea',  s:'We swim in the sea every summer.' },
      { w:'climb', t:{es:'trepar', fr:'grimper'},e:'🧗', ph:'climb the tree',   s:'Do not climb the tree without me.' },
      { w:'sing',  t:{es:'cantar', fr:'chanter'},e:'🎤', ph:'sing a song',      s:'Let us sing a song together now.' },
      { w:'sleep', t:{es:'dormir', fr:'dormir'}, e:'😴', ph:'sleep all night',  s:'The baby will sleep all night long.' }
    ]
  },
  {
    id: 'time', world: 1, title: 'Time', icon: '⏰', color: '#BF8FFD', mascot: 'deer',
    words: [
      { w:'morning',  t:{es:'mañana', fr:'matin'},   e:'🌅', ph:'early in the morning', s:'I brush my teeth early in the morning.' },
      { w:'night',    t:{es:'noche',  fr:'nuit'},    e:'🌙', ph:'late at night',        s:'The owl wakes up late at night.' },
      { w:'today',    t:{es:'hoy',    fr:'aujourd’hui'}, e:'📅', ph:'today is sunny', s:'Today is sunny and warm.' },
      { w:'week',     t:{es:'semana', fr:'semaine'}, e:'🗓️', ph:'next week',            s:'We go to the zoo next week.' },
      { w:'hour',     t:{es:'hora',   fr:'heure'},   e:'⏳', ph:'one more hour',        s:'Just one more hour and we arrive.' },
      { w:'birthday', t:{es:'cumpleaños',fr:'anniversaire'},e:'🎂',ph:'my birthday party',s:'My birthday party starts at four o clock.' }
    ]
  },
  {
    id: 'numbers', world: 1, title: 'Numbers', icon: '🔢', color: '#26C1FC', mascot: 'frog',
    words: [
      { w:'three',  t:{es:'tres',    fr:'trois'},  e:'3️⃣', ph:'three little pigs', s:'The three little pigs build a house.' },
      { w:'seven',  t:{es:'siete',   fr:'sept'},   e:'7️⃣', ph:'seven bright stars',s:'I can count seven bright stars.' },
      { w:'ten',    t:{es:'diez',    fr:'dix'},    e:'🔟', ph:'ten small fingers', s:'I have ten small fingers.' },
      { w:'twelve', t:{es:'doce',    fr:'douze'},  e:'🕛', ph:'twelve o clock',    s:'The clock says twelve o clock.' },
      { w:'twenty', t:{es:'veinte',  fr:'vingt'},  e:'💯', ph:'twenty green apples',s:'There are twenty green apples in the box.' },
      { w:'hundred',t:{es:'cien',    fr:'cent'},   e:'💯', ph:'one hundred steps', s:'I climbed one hundred steps to the top.' }
    ]
  },

  /* ============================ WORLD 3 — OCEAN ============================ */
  {
    id: 'sealife', world: 2, title: 'Sea Life', icon: '🐠', color: '#26C1FC', mascot: 'rhino',
    words: [
      { w:'fish',    t:{es:'pez',     fr:'poisson'}, e:'🐟', ph:'a shiny fish',     s:'A shiny fish swims near the rocks.' },
      { w:'whale',   t:{es:'ballena', fr:'baleine'}, e:'🐋', ph:'a huge blue whale',s:'A huge blue whale sings under the water.' },
      { w:'shell',   t:{es:'concha',  fr:'coquillage'},e:'🐚',ph:'a tiny shell',    s:'I keep a tiny shell in my pocket.' },
      { w:'turtle',  t:{es:'tortuga', fr:'tortue'},  e:'🐢', ph:'a slow turtle',    s:'The slow turtle walks along the beach.' },
      { w:'octopus', t:{es:'pulpo',   fr:'pieuvre'}, e:'🐙', ph:'a purple octopus', s:'A purple octopus hides behind the coral.' },
      { w:'dolphin', t:{es:'delfín',  fr:'dauphin'}, e:'🐬', ph:'a playful dolphin',s:'A playful dolphin jumps beside our boat.' }
    ]
  },
  {
    id: 'space', world: 2, title: 'Space', icon: '🚀', color: '#BF8FFD', mascot: 'bunny',
    words: [
      { w:'star',    t:{es:'estrella',fr:'étoile'},  e:'⭐️', ph:'a bright star',    s:'A bright star shines above the mountain.' },
      { w:'moon',    t:{es:'luna',    fr:'lune'},    e:'🌕', ph:'the round moon',   s:'The round moon lights the whole garden.' },
      { w:'planet',  t:{es:'planeta', fr:'planète'}, e:'🪐', ph:'a distant planet', s:'A distant planet has three orange rings.' },
      { w:'rocket',  t:{es:'cohete',  fr:'fusée'},   e:'🚀', ph:'a fast rocket',    s:'A fast rocket flies into the dark sky.' },
      { w:'comet',   t:{es:'cometa',  fr:'comète'},  e:'☄️', ph:'a burning comet',  s:'A burning comet crosses the night sky.' },
      { w:'astronaut',t:{es:'astronauta',fr:'astronaute'},e:'👩‍🚀',ph:'a brave astronaut',s:'A brave astronaut floats outside the station.' }
    ]
  },
  {
    id: 'travel', world: 2, title: 'Travel', icon: '🧳', color: '#FFB525', mascot: 'fox',
    words: [
      { w:'train',    t:{es:'tren',    fr:'train'},   e:'🚂', ph:'a long train',      s:'A long train leaves the station at nine.' },
      { w:'airport',  t:{es:'aeropuerto',fr:'aéroport'},e:'🛫',ph:'a busy airport',   s:'The busy airport is full of travellers.' },
      { w:'suitcase', t:{es:'maleta',  fr:'valise'},  e:'🧳', ph:'a heavy suitcase',  s:'My heavy suitcase has wheels on the bottom.' },
      { w:'ticket',   t:{es:'boleto',  fr:'billet'},  e:'🎫', ph:'a paper ticket',    s:'Keep your paper ticket in a safe place.' },
      { w:'bridge',   t:{es:'puente',  fr:'pont'},    e:'🌉', ph:'a stone bridge',    s:'We walked across the old stone bridge.' },
      { w:'island',   t:{es:'isla',    fr:'île'},     e:'🏝️', ph:'a quiet island',    s:'A quiet island waits on the horizon.' }
    ]
  },
  {
    id: 'school', world: 2, title: 'School', icon: '🎒', color: '#8DD54F', mascot: 'deer',
    words: [
      { w:'teacher', t:{es:'maestro', fr:'professeur'},e:'👩‍🏫',ph:'a friendly teacher',s:'Our friendly teacher explains the lesson slowly.' },
      { w:'pencil',  t:{es:'lápiz',   fr:'crayon'},   e:'✏️', ph:'a sharp pencil',    s:'I sharpen my pencil before the test.' },
      { w:'library', t:{es:'biblioteca',fr:'bibliothèque'},e:'📚',ph:'a quiet library',s:'The quiet library closes at six o clock.' },
      { w:'question',t:{es:'pregunta',fr:'question'}, e:'❓', ph:'a good question',   s:'That is a very good question, thank you.' },
      { w:'homework',t:{es:'tarea',   fr:'devoirs'},  e:'📝', ph:'finish my homework',s:'I must finish my homework before dinner.' },
      { w:'science', t:{es:'ciencia', fr:'science'},  e:'🔬', ph:'the science club',  s:'The science club meets on Thursday afternoon.' }
    ]
  },
  {
    id: 'feelings', world: 2, title: 'Feelings', icon: '😊', color: '#FF8AD1', mascot: 'bear',
    words: [
      { w:'happy',     t:{es:'feliz',    fr:'heureux'},   e:'😄', ph:'a happy smile',    s:'A happy smile makes everyone feel better.' },
      { w:'tired',     t:{es:'cansado',  fr:'fatigué'},   e:'🥱', ph:'so tired tonight', s:'I am so tired tonight after football.' },
      { w:'excited',   t:{es:'emocionado',fr:'excité'},   e:'🤩', ph:'excited about it', s:'She is excited about the school trip.' },
      { w:'nervous',   t:{es:'nervioso', fr:'nerveux'},   e:'😬', ph:'a little nervous', s:'I feel a little nervous before I sing.' },
      { w:'surprised', t:{es:'sorprendido',fr:'surpris'}, e:'😲', ph:'really surprised', s:'He was really surprised by the birthday cake.' },
      { w:'curious',   t:{es:'curioso',  fr:'curieux'},   e:'🤔', ph:'a curious mind',   s:'A curious mind asks a hundred questions.' }
    ]
  },
  {
    id: 'sports', world: 2, title: 'Sports', icon: '⚽️', color: '#FF7A6B', mascot: 'frog',
    words: [
      { w:'football',  t:{es:'fútbol',   fr:'football'},   e:'⚽️', ph:'play football',     s:'We play football in the park on Saturday.' },
      { w:'bicycle',   t:{es:'bicicleta',fr:'vélo'},       e:'🚲', ph:'ride a bicycle',    s:'I ride a bicycle to my grandma house.' },
      { w:'champion',  t:{es:'campeón',  fr:'champion'},   e:'🏆', ph:'the young champion',s:'The young champion lifted the golden trophy.' },
      { w:'practice',  t:{es:'práctica', fr:'entraînement'},e:'🎯', ph:'practice every day',s:'If you practice every day you will improve.' },
      { w:'stadium',   t:{es:'estadio',  fr:'stade'},      e:'🏟️', ph:'a huge stadium',    s:'A huge stadium can hold sixty thousand people.' },
      { w:'skateboard',t:{es:'monopatín',fr:'skateboard'}, e:'🛹', ph:'a wooden skateboard',s:'He balances on a wooden skateboard downhill.' }
    ]
  }
];

/* Achievement definitions -------------------------------------------------- */
export const ACHIEVEMENTS = [
  { id:'first_word',  name:'First Word',    icon:'🐣', desc:'Say your very first word',            test:s => s.stats.spoken >= 1 },
  { id:'ten_words',   name:'Chatterbox',    icon:'💬', desc:'Speak 10 words out loud',             test:s => s.stats.spoken >= 10 },
  { id:'hundred',     name:'Century',       icon:'💯', desc:'Speak 100 words out loud',            test:s => s.stats.spoken >= 100 },
  { id:'perfect',     name:'Perfect!',      icon:'🎯', desc:'Score 100% on a word',                test:s => s.stats.perfects >= 1 },
  { id:'five_perfect',name:'Sharp Shooter', icon:'🏹', desc:'Score 100% five times',               test:s => s.stats.perfects >= 5 },
  { id:'lesson_1',    name:'Getting Going', icon:'🌱', desc:'Finish your first lesson',            test:s => Object.keys(s.progress).length >= 1 },
  { id:'lesson_5',    name:'Explorer',      icon:'🧭', desc:'Finish five lessons',                 test:s => Object.keys(s.progress).length >= 5 },
  { id:'world_1',     name:'Meadow Master', icon:'🌳', desc:'Finish every Meadow lesson',          test:(s,h) => h.worldDone(0) },
  { id:'streak_3',    name:'On a Roll',     icon:'🔥', desc:'Practise 3 days in a row',            test:s => s.streak >= 3 },
  { id:'streak_7',    name:'Week Warrior',  icon:'⚡️', desc:'Practise 7 days in a row',            test:s => s.streak >= 7 },
  { id:'boss',        name:'Boss Beaten',   icon:'👑', desc:'Win a Speed Round',                   test:s => s.stats.bossWins >= 1 },
  { id:'gym_rat',     name:'Voice Trainer', icon:'🎙️', desc:'Do 25 reps in the Pronunciation Gym', test:s => s.stats.gymReps >= 25 }
];

/* Helpers ------------------------------------------------------------------ */
export const lessonById = id => LESSONS.find(l => l.id === id);
export const lessonsOfWorld = w => LESSONS.filter(l => l.world === w);
export const lessonIndex = id => LESSONS.findIndex(l => l.id === id);
export const allWords = () => LESSONS.flatMap(l => l.words.map(w => ({ ...w, lesson: l.id, color: l.color })));
