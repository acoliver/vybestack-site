# Vybestack Site

Static marketing site for vybestack.dev plus the `vybescore/` dashboard that visualizes LLxprt evaluation results.

## Structure

- `index.html`, `vybestack.css`, `assets/`: main landing page
- `blog/`: markdown posts + rendered HTML (kept up to date via `.github/workflows/build-blog.yml`)
- `vybescore/`: published VybeScore dashboard generated from the `acoliver/evals` repo

## Publishing the VybeScore Dashboard

The workflow in `.github/workflows/publish-vybescore.yml` runs every 6 hours (and on manual dispatch) to:

1. Check out this repo and `acoliver/evals`
2. Install the latest `@vybestack/llxprt-code` CLI plus evaluation dependencies
3. Run `npm run eval:all` inside the evals repo using env-driven LLxprt configs
4. Build the dashboard artifacts via `npm run build:vybes`
5. Merge the previously published dashboard (copied from `vybescore/`) with the new results, ensuring historical runs stay in `vybes-*.json`, and sync the refreshed `public/` folder to `vybescore/` before committing

### Required Secrets

Configure these repository secrets before enabling the workflow:

| Secret | Purpose |
| --- | --- |
| `SYNTHETIC_KEY` | API key for the Synthetic GLM 4.6 provider (fed to `llxprt --key`) |
| `CEREBRAS_KEY` | API key for the Cerebras Qwen 3 provider |
| `ZAI_KEY` | API key for the ZAI GLM 4.6 provider |

### Optional Variables

Custom `Repository variables` can override non-sensitive CLI args, e.g. `SYNTHETIC_BASEURL`, `CEREBRAS_MODEL`, etc. Defaults mirror the values described in `acoliver/evals/README.md`.

### Manual publish

Kick off `Publish VybeScore` from the Actions tab (workflow_dispatch) after updating evals or secrets. The dispatch form lets you choose a single LLxprt config if you need to re-run a specific provider.

### Local publish helper

Use `scripts/publish-vybescore.sh` to run the same sequence locally:

```bash
export SYNTHETIC_KEY=...
export CEREBRAS_KEY=...
export ZAI_KEY=...

# assumes acoliver/evals is checked out at ../doevals/evals
./scripts/publish-vybescore.sh
```

Environment variables:

| Variable | Description |
| --- | --- |
| `EVALS_DIR` | Path to the `acoliver/evals` checkout (defaults to `../doevals/evals`) |
| `LLXPRT_CONFIGS` | Comma-separated config list (defaults to all LLxprt profiles) |
| `LLXPRT_EVAL_ARGS` | Extra flags appended to `npm run eval:all` (e.g. `--max-passes 1`) |
| `SKIP_EVALS` | Set to `1` to skip running `npm run eval:all` and only rebuild/publish |

After the script finishes, review and commit the refreshed `vybescore/` artifacts.
