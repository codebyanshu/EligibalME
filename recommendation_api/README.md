# Scheme retrieval API

This read-only FastAPI service builds a hybrid search index from the root `updated_data.csv` at startup. It removes blank columns and exact duplicate scheme rows in memory; it never loads `scheme_vector_index.pkl`.

## Run locally

From the repository root, install the small CPU-friendly dependencies and start the service:

```powershell
python -m pip install -r recommendation_api/requirements.txt
Copy-Item recommendation_api/.env.example recommendation_api/.env
python -m uvicorn recommendation_api.main:app --reload --port 8000
```

Set `VITE_SCHEME_API_URL=http://localhost:8000` in the frontend's `.env.local`, then restart Vite. The UI falls back to its bundled catalogue and local rule-based answers when this variable is absent or the service is unavailable.

The default retriever combines word and character TF-IDF, which handles spelling variations and mixed scripts without downloading a model. To add multilingual semantic embeddings, install `recommendation_api/requirements-embeddings.txt` and set `USE_MULTILINGUAL_EMBEDDINGS=true`. The first run downloads `intfloat/multilingual-e5-small`; keep the model and index on the server.

For state-specific live web discovery, install Agent Reach on the API host using its [official installation guide](https://github.com/Panniantong/agent-reach/blob/main/docs/install.md) and ensure its `web` channel is available. `POST /discover` calls `agent-reach web search` with the selected state and returns HTTPS search results. The UI requests these leads during profile results and after catalogue-backed follow-up answers. Agent Reach is read-only web search/read tooling, not an exhaustive crawler; results are labeled as unverified leads. If the CLI is absent or unavailable, catalogue recommendations continue to work and live discovery is skipped. Legacy URLs embedded in the CSV are not used as application links; add a verified `official_source_url` to show a source link on a catalogue card.

To generate answers from retrieved passages, set `OPENAI_API_KEY`, `OPENAI_MODEL`, and `ENABLE_LLM_GENERATION=true` in the API process environment. Without all three, `/ask` returns extractive passages from the retrieved scheme record. Never expose the model key in a `VITE_` variable. Put an LLM-enabled API behind an authenticated proxy with rate limiting before public deployment; CORS alone is not authentication.

## Endpoints

- `GET /health`: index size, duplicate count, and active retrieval method.
- `POST /recommend`: top content matches for a question and optional profile. Every catalogue match is explicitly marked as needing official eligibility verification.
- `POST /ask`: retrieves scheme passages, then generates an answer if configured; otherwise returns source text. Citation URLs are included only when the CSV application instructions contain an HTTPS URL.
- `POST /discover`: optional Agent Reach web search for public scheme information scoped to an Indian state or union territory.

The CSV has no dedicated state-name or official-source column. State-level records are included for a profile only when the requested state appears in the record text; this conservative rule can omit valid schemes. Add verified state metadata and official source URLs to the data before using this catalogue for definitive eligibility or application guidance. Scores are relevance signals, not probabilities of eligibility.

Optional enrichment columns can be added to `updated_data.csv` without changing the API architecture: `applicable_states`, `districts`, `department` (or `ministry`), `official_source_url`, `application_steps`, `application_status`, `deadline`, and `last_verified_at`. The loader accepts common spacing/case variants for these headers. Use ISO dates (`YYYY-MM-DD`), HTTPS source URLs, and statuses `open` or `closed`; blank or unrecognized values remain unknown. Keep the existing descriptive columns. State/district names and source URLs should be checked against the issuing authority before adding them.

`GET /filters` returns the available category, department, state, and status facets. `GET /schemes` supports `query`, `state`, `category`, `department`, `applicationStatus`, `offset`, and `limit`. When explicit state metadata is absent, state filtering falls back to text matching; the response marks that match type so it is not mistaken for verified geographic applicability. Central schemes are treated as applicable across selected states.
