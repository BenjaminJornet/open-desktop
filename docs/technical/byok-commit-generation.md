# BYOK Commit Generation

Open Desktop can generate commit summaries and descriptions from the changes selected in the Changes view using an OpenAI-compatible Chat Completions endpoint.

This is an MVP developer configuration path. Values are read from environment variables when the app starts.

## Environment Variables

- `DESKTOP_BYOK_BASE_URL`: Required. OpenAI-compatible base URL such as `https://proxy.example.com/v1`, or a full Chat Completions URL such as `https://proxy.example.com/v1/chat/completions`.
- `DESKTOP_BYOK_API_KEY`: Optional. Sent as `Authorization: Bearer <value>` when non-empty.
- `DESKTOP_BYOK_MODEL`: Required. Model ID sent in the request body.
- `DESKTOP_BYOK_TEMPERATURE`: Optional. Defaults to `0.2`.
- `DESKTOP_BYOK_STYLE`: Optional. `conventional` or `simple`. Defaults to `conventional`.
- `DESKTOP_BYOK_LANGUAGE`: Optional. Defaults to `English`.
- `DESKTOP_BYOK_CUSTOM_INSTRUCTIONS`: Optional. Extra user instructions for the commit message.

## Local Development

Create an untracked `.env` from `.env.example`, then run:

```bash
make byok-dev
```

The `.env` file is ignored by Git and must not be committed.

## Privacy And Scope

BYOK generation uses the same selected changes that Desktop would commit. Unselected files are not included. Partial selections are represented through Desktop's existing selected-change diff path.

The app only fills the Summary and Description fields. It does not auto-stage, auto-commit, or auto-push.

Diffs longer than 60000 characters are truncated before being sent, and the prompt asks the model to mention that truncation in the generated description.
