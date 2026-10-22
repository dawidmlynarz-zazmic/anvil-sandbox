# Stage Studio · demo script (about 3 minutes)

Follows deck slide 6 (“Creative workflow, step by step”) and lands on slide 5’s value to prove. It is the first use
case end to end: one new show, from an empty brief to the production handoff. Before you start: open
http://localhost:5173 and click **Reset the demo** (bottom of the projects panel). The app opens on a new, empty project
brief. Set the window to 1440 px wide or more, and run it once on the presenting laptop: the previews are rendered live
and use its graphics card.

| Time | Step (slide 6) | Do | Say |
| --- | --- | --- | --- |
| 0:00 | Frame it | Open **Demo** in the header for a second. | “A working name for an AEG workspace on Gemini Enterprise Agent Platform. Nothing here calls a model yet; the previews are illustrative.” |
| 0:15 | **1 · Brief** | The app is on an empty **New project brief**. Answer the agent with the suggestion chips: **[Artist D] · Stagecoach 2027**, **Mane Stage**, **Saturday 7:10 pm, 75 min**, the visual direction, **No strobe above 3 Hz**, **Suggest from the setlist**. Point at the daylight timeline as it appears. | “The artist, or their team, describes the show. Gemini turns the venue, the slot, the look and the set list into a brief: watch it fill in. The slot sets the light: this set starts at golden hour and ends in the dark.” |
| 0:50 | | **Start project**. Open the agent’s reasoning in the chat. | “Gemini drafts the prompts. Here is exactly what it asked Nano Banana Pro for.” |
| 1:05 | **2 · Stills** | Round 1 arrives at golden hour, as the slot says. On B1, open the “1 to look at” badge, then **Annotate**: click the monolith, type “narrower, so the back can see the screen”, add “warmer overall”, **Apply 2 changes**. The monolith slims down and the light turns amber; the sightline flag clears. **Compare with v1**, then **Select** B1. | “Several concepts per round, lit for the moment the artist will actually play, like the Coachella prototype with DeepMind. The agent checks each against the venue and the brief; you mark what should change right on the image, and every version is kept.” |
| 1:35 | **3 · Motion** | **Put into motion**, pick song 14 (it plays after dark), play. Type “slower camera move” in the chat. | “Veo 3.1 for motion: lighting, LED content and the camera move per song, each in the light it plays in. Edits are in plain words, with Gemini Omni Flash.” |
| 2:05 | **4 · Review** | **Send to artist**. Turn on **Preview as artist** (the agent and internal notes disappear), click the image to pin a comment, then **Approve B1** and give 4 stars. | “The artist sees only the design and its motion, comments on both and signs off one design. Iterate until they do.” |
| 2:35 | **Handoff** | Land on Handoff. Point at *Value to prove*, then *Rights and provenance*. Ask the agent “What do we still need before production can build this?” | “The three measures we’d prove in the residency: concept rounds, time to an approved design, artist feedback. Artist owns the outputs; SynthID on everything; legal confirms C2PA and indemnity scope.” |
| 2:55 | Close | Open **[Artist B] · The O2** in the projects panel. | “And a service AEG Presents can run for many artists at once: festivals, arenas, tours.” |

If something stalls: every step can be opened directly from the progress rail on the right, and the three sample
projects are further along: [Artist A] at Stills, [Artist B] at Review with the artist’s comments, [Artist C] at
Handoff. To show the review loop, use [Artist B]: **Request changes** builds round 3 on the design the artist saw, and
sending it again gets the artist’s sign-off.
