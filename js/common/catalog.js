// The list of learning games and their levels, shared by the games themselves
// and by the parent corner.
window.KW = window.KW || {};

KW.islands = [
  { key: 'math', name: 'Math Island', icon: '🏝️' },
  { key: 'reading', name: 'Reading Island', icon: '📚' },
  { key: 'science', name: 'Science Island', icon: '🔬' }
];

KW.catalog = [
  { key: 'tenframe', island: 'math', name: 'Ten Frames', icon: '🔟', href: 'games/ten-frame/index.html',
    levels: ['Count', 'Add', 'Make 10', 'Tens', 'Big + −'] },
  { key: 'hopper', island: 'math', name: 'Hop the Line', icon: '🐸', href: 'games/hopper/index.html',
    levels: ['Hop +', 'Hop −', 'Guess', 'To 20', 'To 100'] },
  { key: 'balance', island: 'math', name: 'Balance It', icon: '⚖️', href: 'games/balance/index.html',
    levels: ['Same', 'Missing', 'Weights', 'Tens', 'Big +'] },
  { key: 'letters', island: 'reading', name: 'Letter Land', icon: '🔤', href: 'games/letters/index.html',
    levels: ['ABC', 'abc', 'First sound', 'Pictures', 'What next?'] },
  { key: 'words', island: 'reading', name: 'Word Builder', icon: '🧩', href: 'games/words/index.html',
    levels: ['_at', 'ca_', 'c_t', 'Build', 'Spell'] },
  { key: 'rhyme', island: 'reading', name: 'Rhyme Time', icon: '🎵', href: 'games/rhyme/index.html',
    levels: ['Rhyme?', 'Find it', 'Odd one', 'Finish it', 'Collect'] },
  { key: 'animals', island: 'science', name: 'Animal World', icon: '🦁', href: 'games/animals/index.html',
    levels: ['Homes', 'Food', 'Sort', 'Grow up', 'Alive?'] },
  { key: 'space', island: 'science', name: 'Space Explorer', icon: '🚀', href: 'games/space/index.html',
    levels: ['Day/Night', 'Explore', 'Clues', 'Bigger?', 'In order'] },
  { key: 'weather', island: 'science', name: 'Weather Watch', icon: '⛅', href: 'games/weather/index.html',
    levels: ['Sky', 'Dress', 'Hot/Cold', 'In order', 'What next?'] }
];

// [{ id: 1, label: 'Count' }, ...] for the level buttons of one game
KW.levelsOf = key => KW.catalog.find(g => g.key === key).levels.map((label, i) => ({ id: i + 1, label }));
