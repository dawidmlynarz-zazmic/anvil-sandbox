# HR Mate prototype

A clickable prototype of the redesigned HR Mate admin panel, plus the Google Chat bot's cards. Built with **shadcn/ui** (not Anvil), on fictional data (Northwind Labs). No backend, no auth, no real integrations.

```bash
pnpm hr-mate        # from the repo root, http://localhost:5173
pnpm --filter hr-mate typecheck
pnpm --filter hr-mate build
```

## Click-through script

1. Open the app. It starts as a **fresh workspace**: Home shows the setup checklist.
2. **Connect directory**: pick Zoho People, allow access, wait for the sync, map the missing field (or continue), confirm.
3. **Add knowledge**: create the collection, upload sample files, wait for "Ready to use".
4. **Test the assistant**: ask the suggested questions. Answers only appear for documents you uploaded; others say what is missing.
5. **Turn on a workflow**: pick "End-of-trial review", step through the six steps, open "Instruction that will be sent to the AI", turn it on.
6. **Invite your HR team**: send an invite, finish setup, see the success state, then the dashboard.
7. Open **Demo controls** (sidebar, bottom) and switch to **Established**. Visit Home, Workflows (grid and list), a workflow detail, Runs (Issues and All runs, retry the timed-out cause), Knowledge (unanswered questions), Connections (manage field mapping, disconnect), Settings (Assistant, Team & roles, Workspace) and Chat preview.
8. In Demo controls, set **Lists show** to Loading, Empty or Error to see those states on any list.

Also: `⌘K` searches screens, workflows and people; `/styleguide` shows tokens and live contrast checks.

## Where things are

| Path | What |
|---|---|
| `src/index.css` | Brand tokens (Forward navy and coral), light by default and dark via the theme switcher |
| `src/components/ui` | shadcn components (lightly adjusted: destructive contrast, `DialogBody`) |
| `src/components/hr` | Shared pieces: status badges, schedule picker, audience builder, workflow wizard, assistant tester |
| `src/mocks` | Typed seed data. "Today" is fixed to 12 Nov 2026 (`src/lib/dates.ts`) |
| `src/lib/demo-state.tsx` | One reducer for all demo state, kept in `sessionStorage` |
| `src/chat-cards` | Cards v2-shaped JSON and the mock Chat renderer |
| `src/copy/onboarding.ts` | Onboarding strings and role descriptions (other screens still hold strings inline) |

## Known gaps

`HANDOFF.md` and `BACKEND_NOTES.md` from the plan are not written yet. Copy strings are only extracted for onboarding. Keyboard and focus order have had one pass, not an audit.
