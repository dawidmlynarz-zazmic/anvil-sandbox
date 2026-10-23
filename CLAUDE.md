# Anvil sandbox — guide for Claude Code

Clickable client demos built with Anvil UI (Zazmic's design system), one Vite app per folder under `demos/`. Demos are
mocked: no real model calls. The repo is public, and so are the hosted previews.

- Repo: https://github.com/dawidmlynarz-zazmic/anvil-sandbox · Previews: https://dawidmlynarz-zazmic.github.io/anvil-sandbox/
- Anvil: https://github.com/dawidmlynarz-zazmic/anvil-ui, cloned at `~/anvil-ui` (sibling of this repo). Storybook
  there is the reference for every component (`pnpm storybook` in `~/anvil-ui`). Its `docs/using-anvil-in-another-repo.md`
  is the original consumption guide.
- Reference demo: `demos/aeg-stage-studio` (AEG generative stage design). Copy its setup, not its product code.

## Hard rules

- **Never edit, branch or commit in `~/anvil-ui`.** It is read-only from here. Reading, and `git ls-remote`, are fine.
- **Commit or push only when asked.** Pushing to `main` redeploys every hosted preview.
- **No real people, clients' confidential data or real figures.** Use fictional names (e.g. artists) and placeholders
  in `[brackets]` for numbers only the client has. Real names would put words in real people's mouths.
- Never paste API keys or passwords in chat. `.env*` is gitignored; the preview password is a GitHub secret.

## Starting a new demo

1. `demos/<client>-<idea>/` with the same shape as `demos/aeg-stage-studio`: `package.json` (React 19, Vite 8,
   TypeScript 6 strict, Tailwind v4, react-router-dom), `vite.config.ts`, `tsconfig.app.json`, `index.html`,
   `src/main.tsx`, `src/styles/app.css`. Pin exact versions. The workspace (`pnpm-workspace.yaml`) picks it up.
2. Keep these from the reference demo, they each fix a real problem:
   - `vite.config.ts`: aliases `@anvil` and `@` → `../../../anvil-ui/src` (overridable with `ANVIL_PATH`), `~` → own
     `src`; `dedupe: ['react', 'react-dom']`; `base: process.env.BASE_PATH ?? '/'`; `server.fs.allow` the parent folder.
   - `tsconfig.app.json`: pin `react` / `react-dom` types to the demo's own `node_modules` (two `@types/react` copies
     break typechecking).
   - `src/styles/app.css`: `@import '@anvil/styles/globals.css'` and `@source '../../../../../anvil-ui/src'`, so
     Tailwind generates the classes Anvil's components use.
   - `index.html`: `<meta name="robots" content="noindex, nofollow">`.
   - Router: `createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })`, and never
     read `window.location.pathname` by position (the app is served from a sub-folder on Pages).
   - `src/app/Gate.tsx`: the optional password screen (on only when `VITE_DEMO_GATE` is set at build).
   - Wrap the app in Anvil's `TooltipProvider`.
3. Add a root script (`"<name>": "pnpm --filter <package> dev"`), a row in `README.md`, a launch config in
   `.claude/launch.json` (local only, gitignored) and a link in `site/index.html`.
4. Hosting: in `.github/workflows/pages.yml`, build the demo with `BASE_PATH=/<repo>/<folder>/` and copy its `dist`
   into `_site/<folder>`. Deep links only work for the demo whose `index.html` is copied to `_site/404.html`; with
   more than one SPA, switch to a 404 redirect script (spa-github-pages pattern).
5. `pnpm install`, then `pnpm --filter <package> typecheck` and `build` before saying something is done.

## Building with Anvil

- Use Anvil's exact components and fill their slots (e.g. Dialog = `DialogHeader` → `DialogBody` with form fields →
  `DialogFooter`, as direct children). Check the component's story before composing.
- Missing pieces go in `src/components/local/<Name>/` with a story, marked `// ANVIL-CANDIDATE`, and an entry in the
  demo's `docs/anvil-upgrade-candidates.md` (type, closest Anvil option checked, proposed API, a11y, recommendation).
- Map wireframe/brief elements to Anvil components in `docs/anvil-component-map.md` before building.
- Hosted previews follow Anvil `main` (daily rebuild + on push); a failing build keeps the last good version live.

## How the user likes to work

- Light mode by default; dark mode must work too.
- One primary button per screen, bottom-right in the step footer.
- A persistent agent chat on the left (always open), the work in the middle (shared max width, responsive below it),
  progress on the right. Agent messages must match what the screen shows: never claim what the mock doesn't do.
- UX writing: plain, specific, active voice; name things as users know them; no em-dash asides; proper plurals.
- Verify changes in the browser (Claude Browser pane) at 1440px and narrower, then report plainly what was checked.
- For bigger reviews: an end-to-end walkthrough as a persona, findings with severity, published as a shared report.

## Lessons from Stage Studio

- WebGL renders (three.js / react-three-fiber) load lazily, render off-screen to a cached data URL, and show a
  placeholder while pending (never stand-in art, it flashes).
- Smooth scrolling can stall in throttled windows: scroll smoothly, then jump if it hasn't arrived (`src/lib/reveal.ts`).
- Demo state lives in `sessionStorage` behind one store; "Reset the demo" restores the seeded start. Start the demo on
  the first use case (an empty new project), with sample projects further along.
- Mock the "agent" honestly: drive visible changes from the words used, and say plainly when the preview can't show
  something ("the pilot model applies it").
