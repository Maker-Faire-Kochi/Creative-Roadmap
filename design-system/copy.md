# Wording for motion

The rule: **every beat says a complete sentence someone can read once and understand.** The first motion posters threw out fragments ("DID NOT WORK", "MAKER?") with the real sentence in small type underneath, and they were rejected for it.

1. **The slide's own sentence.** A beat letters its carousel slide in full, one carousel line per row (`workflows/awareness-carousels/content/topics.mjs`, the single source of copy). The slide's `*accent*` and `~strike~` carry over.
2. **Exact punctuation.** Apostrophes, commas, colons and quotes are set as written ("DIDN’T WORK.", "MAKE: BROUGHT"). Nothing is paraphrased to dodge a missing glyph. "…" is set as three full stops.
3. **Rewrite only when a beat can't stand alone,** and always with a reason (`why` in the storyboard). A beat that leans on the slide before it gets its subject back ("Now Kerala’s making gets a stage."). A stat label becomes a phrase ("232 / Maker Faires / in 2025"). Every rewrite is listed in the wording table (`node src/wording.mjs`) and needs approval before a full render.
4. **The content rules still hold.**
   - No event date: the sign-off is COMING SOON.
   - No invented venues, deadlines, requirements or claims.
   - Clear words (CODING, not CODE).
   - Maker Stories isn't released yet, so copy says it is coming.
5. **Uppercase Latin.** The motion letters set A–Z, 0–9 and the punctuation above. There is no Manglish edition: Studio Sans and the studio's outlines have no Malayalam.
6. **Captions** follow the usual gate: the user approves every caption before scheduling. Stories have no caption.
