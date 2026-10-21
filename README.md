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

| Demo | What | Run |
| --- | --- | --- |
| [aeg-stage-studio](demos/aeg-stage-studio) | AEG generative stage design prototype (mocked) | `pnpm stage-studio` |

## Setup

```bash
git clone https://github.com/dawidmlynarz-zazmic/anvil-ui.git ../anvil-ui && (cd ../anvil-ui && pnpm install)
pnpm install
```
