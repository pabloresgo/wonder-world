# Wonder World 🌈

A learning-and-creating website for a 4-year-old. It's plain HTML, CSS and JavaScript, so there's nothing to install or build.

## Live site

**https://pabloresgo.github.io/wonder-world/**, hosted free on GitHub Pages from the `main` branch of
github.com/pabloresgo/wonder-world.

To update it after a change:

```bash
git add -A
git commit -m "Describe the change"
git push
```

GitHub rebuilds the site in about a minute. If the tablet still shows the old version, reload the page.

## How to open it locally

Run a tiny local server from this folder (Python is already installed):

```bash
python -m http.server 8080
```

Then open http://localhost:8080 in a browser. On a tablet on the same Wi-Fi, use the computer's IP address
instead, for example `http://192.168.1.20:8080`.

> Opening `index.html` by double-clicking also mostly works, but the server is more reliable.

## What's inside

| Path | What it is |
|---|---|
| `index.html` | Home page ("world map") with Math Island and Create Studio |
| `css/style.css` | Shared colors, buttons and home-page styles |
| `css/game.css` | Shared game layout: top bar, level buttons, big buttons, answer choices, Play screen |
| `js/common/` | Shared helpers: `storage.js` (saved stars), `speech.js` (voice), `sounds.js` (beeps), `ui.js` (confetti, star counter, sound toggle, break reminder), `game.js` (level buttons, Play screen, answer choices), `catalog.js` (math games and level names), `progress.js` (progress tracking), `creature-art.js` (draws creatures) |
| `parent/` | Grown-ups Corner: progress and settings |
| `games/ten-frame/` | The Ten-Frame Builder game |
| `games/hopper/` | Hop the Line (number line) game |
| `games/balance/` | Balance It (balance scale) game |
| `games/letters/` | Letter Land |
| `games/words/` | Word Builder |
| `games/rhyme/` | Rhyme Time |
| `games/animals/` | Animal World |
| `games/space/` | Space Explorer |
| `games/weather/` | Weather Watch |
| `js/common/quiz.js`, `css/quiz.css` | Small engine for picture games (pick, sort, put in order, explore), used by Science Island |
| `css/reading.css`, `js/common/reading-data.js` | Shared look, letters, letter sounds and picture words for Reading Island |
| `games/draw/` | Drawing studio |
| `games/creature/` | Make a Creature |
| `games/story/` | Story Maker |

## Ten-Frame Builder levels

1. **Count**: put in N counters (1–10)
2. **Add**: red counters are given, add the blue ones, then pick how many in all
3. **Make 10**: fill the frame and find the missing number (8 + ? = 10)
4. **Tens**: build 11–30; each full frame turns green and becomes a "10"
5. **Big + −**: two-digit add and take away (e.g. 16 + 6, 23 − 4)

Wrong answers never buzz loudly. The owl counts along out loud and says "more" or "too many", so he can
work out the fix himself.

## Hop the Line levels

A frog hops along a number line and draws an arc for every hop, so + and − become movement.

1. **Hop +**: 0–10, hop forward (3 + 4)
2. **Hop −**: 0–10, hop back (7 − 3)
3. **Guess**: tap the lily pad where the frog *will* land, then watch it hop to check
4. **To 20**: 0–20, often crossing 10 (8 + 5, 14 − 6)
5. **To 100**: split numbers into big jumps of 10 and small hops (24 + 13 = one big jump and three small hops)

A wrong answer makes the frog hop again from the start while the owl counts on out loud ("3… 4, 5, 6, 7").

## Balance It levels

The left pan holds the question. He loads the right pan until the beam is level. The beam always tilts
toward the heavier side, so he can see "too heavy" or "too light" and fix it himself. This builds the idea
that "=" means "the same on both sides".

1. **Same**: make the right side equal the left (5 = 5)
2. **Missing**: some blocks are already on the right; add the missing ones (7 = 3 + ?)
3. **Weights**: pick the one numbered weight that balances 4 + 3 (too heavy means pick smaller, too light means pick bigger)
4. **Tens**: build 12–49 with 10-bars and 1-blocks; ten 1-blocks automatically turn into a 10-bar
5. **Big +**: balance two-digit sums like 24 + 15 with tens and ones

Tap a blue block on the scale to take it off, or ↺ to clear the right pan.

## Reading Island

### Letter Land levels

1. **ABC**: hear a letter name, tap the capital letter
2. **abc**: see a capital letter, find its little letter
3. **First sound**: see a picture (🐝), pick the letter it starts with
4. **Pictures**: see a letter, pick the picture that starts with it
5. **What next?**: A B C … which letter comes next?

After two wrong taps, the right answer glows.

### Word Builder levels

Three-letter picture words like cat, dog, sun, bus and box.

1. **_at**: pick the first letter
2. **ca_**: pick the last letter
3. **c_t**: pick the middle (vowel) sound
4. **Build**: put the three letters in order
5. **Spell**: spell the word with two extra letters mixed in

Each tile says its sound when tapped. A finished word is sounded out ("kuh… ah… tuh… cat!"). 👄 **Sound it
out** plays the sounds at any time, and tapping the picture says the word.

> Letter sounds come from the browser's voice, which can't say pure sounds, so they're spelled the way
> they sound ("buh", "mmm", "ah"). They are close but not perfect. Saying them yourself while playing helps.

### Rhyme Time levels

1. **Rhyme?**: two pictures (cat, hat). Do they rhyme? 👍 or 👎
2. **Find it**: pick the picture that rhymes with the big one
3. **Odd one**: three pictures, two rhyme. Tap the one that doesn't
4. **Finish it**: finish a little rhyme ("The frog sat on a… log!")
5. **Collect**: find every picture that rhymes with the big one (2–3 to find among 6)

Every picture says its word when tapped. After two wrong taps, the answer glows.
The rhyme words and little rhymes are in `js/common/reading-data.js` (`RHYMES`, `COUPLETS`), so it's easy to add more.

## Science Island

### Animal World levels (nature)

1. **Homes**: where does the animal live? (ocean, farm, forest, snow and ice, desert, jungle)
2. **Food**: what does it eat? (rabbit → carrots, panda → bamboo)
3. **Sort**: put each animal in a group: *fly or swim*, or *fur or feathers*
4. **Grow up**: put the stages in order (egg → hatching → chick → hen, seed → sprout → plant → flower)
5. **Alive?**: alive or not alive (a robot moves, but is it alive?)

### Space Explorer levels

1. **Day/Night**: sort things into day or night (Sun, owl, stars, rooster)
2. **Explore**: tap all eight planets to hear a fact about each one
3. **Clues**: find the planet from a clue ("the red planet", "the planet with big rings")
4. **Bigger?**: which of two planets is bigger or smaller
5. **In order**: put the planets in order from the Sun (the four rocky ones, or the four giants after Mars)

A wrong sort always says *why* ("Penguins can't fly, but they swim really well!"). The planet pictures are
not to scale, but a bigger planet is always drawn bigger.

### Weather Watch levels

1. **Sky**: look at the picture clues (☔💦🐸) and pick the weather: sunny, rainy, snowy, windy, cloudy, stormy
2. **Dress**: what should we take for this weather? (umbrella, mittens, sunglasses)
3. **Hot/Cold**: sort things into hot days and cold days (ice cream, sled, hot cocoa)
4. **In order**: the water cycle (water → Sun warms it → clouds → rain), the seasons, or a day from sunrise to night
5. **What next?**: cause and effect ("It is very cold. What happens to the pond?" → ice)

## Create Studio

- **Draw**: brush, 🌈 rainbow brush, ⭐ stamps (drag to make a trail), 🪣 paint bucket, eraser, three sizes,
  ↩️ undo and 🆕 new picture. 💾 saves the picture to the 🖼️ gallery (the newest 12 are kept). Tap a saved
  picture to keep drawing on it. Deleting needs two taps so nothing is lost by accident.
- **Make a Creature**: choose body, eyes, mouth, head, arms, legs, color and pattern. Every option button
  shows the creature with that part already on it. 🎲 gives a silly new name, **Surprise!** makes a random
  creature, and tapping the creature makes it say hello in its own voice. 💾 saves it to "My creatures".
- **Story Maker**: pick a hero, a place, a friend and what happens. The owl reads back a six-page picture
  book. Saved creatures show up as heroes, and some stories have a little math in them (counting to ten,
  3 apples and 2 cookies).

Each saved drawing, saved creature or finished story earns a star.

Stars, drawings and creatures are saved in the browser on each device (localStorage), so clearing the
browser's site data erases them.

## Grown-ups Corner

Open it from the small **👪 Grown-ups corner** link at the bottom of the home page. To get in, you answer
a multiplication question on a number pad. It stays unlocked until the browser tab is closed.

- **Summary**: stars, math problems solved, how many were right the first time, days played, things made.
- **What to try next**: suggests the next level when he's doing well (8 of his last 10 right first time),
  and flags levels that are tricky (fewer than half right first time) as good ones to play together.
- **Last 14 days**: activity per day. Hover or tab to a bar for details, or open it as a table.
- **Learning games**: every level of every Math, Reading and Science Island game, with a bar for "right first try"
  over the last 10 problems.
  "First try" means no wrong answer and no hint on that problem.
- **Create Studio**: how many drawings, creatures and stories he has made.
- **Settings**: his name (shown on the home page and as a "Me!" hero in Story Maker), slower voice,
  sound on/off, and a break reminder after 15–45 minutes of play.
- **Reset progress** clears stars and progress but keeps drawings and creatures. It needs two taps.

## Adding a new activity

1. Make a folder `games/<name>/` with an `index.html`. Copy the `<head>` and `<script>` lines from
   `games/hopper/index.html` so it gets the shared look, voice, sounds, level buttons and stars
   (`KW.game.levelPicker`, `KW.game.onStart`, `KW.game.nearChoices`).
   For a learning game, add it to `js/common/catalog.js` (with its island) and call `picker.addStar(firstTry)` when a problem is
   solved, so it shows up in the Grown-ups Corner.
2. Add a card for it in `index.html`, under one of the islands or Create Studio.

A picture game (choose, sort, order, explore) is quickest with `js/common/quiz.js`. See
`games/animals/animals.js`: it only describes the questions, and the engine does the rest.
