# Motion language

How Maker Faire Kochi pieces move. These rules come from the motion posters (`workflows/motion-posters`) and apply to any short, silent, social story.

## Story

**Hook → beats → payoff → sign-off.** One beat per idea, usually one carousel slide each.
- Every beat says a **complete sentence** (see [copy.md](copy.md)).
- Every beat shows **one object event that acts the sentence out**. No filler: if an object doesn't mean something in the beat, it isn't there. The storyboard records what each beat's objects mean (`means`), and reviewers read it.
- The payoff is the topic's last slide. Then comes the sign-off: COMING SOON over the beam kit's open gesture, with the blue beam opening its joint. No date.
- Length: 12–18 s at 30 fps, silent (music is added on the platform).

## Timing

| Phase | Time |
|---|---|
| Letters in (per row, staggered across its letters) | 0.45 s, with a soft overshoot |
| Next row | after max(0.4 s, 0.24 s × words in the row before) |
| Hold for reading | 0.3 s a word over the sentence, at least 1.2 s after the last row |
| Letters out (together) | 0.35 s |
| Sign-off | 2.6 s |

A story shorter than 12 s holds longer. A longer one tightens, to no less than 0.85× pace.

## Letters

- **Faces:** the Poster Studio's own letters, laid out by its `layoutTreatment` (air mode) and drawn by its `drawPosterScene`, used unmodified. General and Colour use Studio Sans ([type/studio-sans.md](type/studio-sans.md)); both Noise looks use Dela Gothic One.
- **Sizing:** one type size per sentence, as large as the band allows. Carousel lines are the rows. A long line re-breaks at the word boundary that balances it whenever that makes the type at least 8% larger (reading order kept). A stat row is set 1.7× larger.
- **Movement:** rows squash up into place one after another and all squash out together. The letters keep their elastic studio motion while they hold.
- **Punctuation** (. , : ; ’ “ ”) is drawn as fixed marks a letter stroke wide, never stretched to the row height.

## Objects

- Each beat's objects come from the library ([3d/STANDARD.md](3d/STANDARD.md)) or the website's actors.
- By default an object pops in as its beat starts and shrinks away 0.3 s before the beat ends. A beat can `keep` an object from the one before.
- Object events are timed to the words. A motion can start when a given row of the lettering comes in (`"r1+0.3"`), so the fan spins on "Fixed a fan?" and the bag is stitched on "Stitched a bag?".
- Motions: drop, pop, rise, slide, shrink, sink, move, spin, turntable, turn, swing, shake, bob, recolor, glow.
- Effects: spark (red: a fault; cyan: a connection made), smoke, seam, cable, pages, link, ripple.
- Everything is a pure function of time, so renders repeat exactly.

## Camera

**Every text change moves the camera.** A move starts displaced from the beat's framing and settles into it over 0.9 s (quintic), then keeps drifting the same way slowly while the beat holds. The moves:

| Move | Starts as | Drift |
|---|---|---|
| `push-in` / `pull-out` | 0.7× / 1.45× zoom | slowly closer / further |
| `orbit-l` / `orbit-r` | ±0.55 rad round the look point | ∓0.035 rad/s |
| `crane-up` / `crane-down` | ∓0.28 / +0.24 rad pitch | slow |
| `truck-l` / `truck-r` | ±0.32 view-heights sideways | slow |

The default rotation never repeats a move twice in a row. A storyboard can set `cam` per beat. The moves work on any scene, ours or the website's: the move is laid on top of the scene's own camera, then lifted off.

## Placement

A poster sets its letters on top with the model below (`text-top`), or the model on top with the letters below (`model-top`). By default the placement alternates by topic. The storyboard can set it with `place`, and the command line can force it with `--place=`. The letters never leave their band, and the footer (logo and labels) stays clear of both.
