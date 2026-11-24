# Trace pipeline (planned)

Small open models are run once on a developer machine and their JSON output is committed to `packages/content/lessons/<module>/<lesson>/trace.json`, so the deployed site needs no model, GPU or API key.

Planned scripts (Python 3.12, `uv`): `tokenize.py`, `next_token.py`, `attention.py`, `embed.py`. This folder is never imported by the web app and is excluded from the Vercel build (the Vercel root directory is `apps/web`).

Until then the Foundations lessons ship hand-written traces marked `"source": "illustrative"`.
