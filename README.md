# Anvil sandbox

Client demos built with [Anvil UI](https://github.com/dawidmlynarz-zazmic/anvil-ui). One folder per demo under `demos/`.

> This repo may be public. Keep real client data, names of people, and confidential figures out; use placeholders.

## Layout

```
anvil-sandbox/
  demos/<demo-name>/     # one Vite app per demo (pnpm workspace)
~/anvil-ui/              # sibling clone of Anvil, READ-ONLY (never edit, branch or commit in it)
```

Each demo consumes Anvil through aliases to `../anvil-ui/src` (override with `ANVIL_PATH`) and records the Anvil
commit it was built against in its own README.

## Demos

| Demo | What | Run | Hosted preview |
| --- | --- | --- | --- |
| [aeg-stage-studio](demos/aeg-stage-studio) | AEG generative stage design prototype (mocked) | `pnpm stage-studio` | [Open](https://dawidmlynarz-zazmic.github.io/anvil-sandbox/aeg-stage-studio/) |

## Hosted previews (GitHub Pages)

Every push to `main` builds the demos and publishes them to https://dawidmlynarz-zazmic.github.io/anvil-sandbox/
(`.github/workflows/pages.yml`). The build pins Anvil to the commit in `ANVIL_REF`; update it deliberately.

**Password screen (optional).** Set a repository secret named `DEMO_PASSWORD` (Settings → Secrets and variables →
Actions, or `gh secret set DEMO_PASSWORD`), then re-run the Pages workflow. Only the password's SHA-256 goes into the
build; viewers enter it once per browser. It keeps casual visitors and search engines out, but it is not access
control: the site and this repo are public. For real access control, host behind a sign-in (e.g. Cloudflare Access).

## Setup

```bash
git clone https://github.com/dawidmlynarz-zazmic/anvil-ui.git ../anvil-ui && (cd ../anvil-ui && pnpm install)
pnpm install
```
