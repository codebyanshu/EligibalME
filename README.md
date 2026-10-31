# EligibalME

EligibalME helps people explore government schemes, compare published eligibility criteria, and privately track applications. The web app is built with React and Vite. Its account API uses Express and PostgreSQL, and an optional FastAPI service provides catalogue search and web discovery.

## Run locally

### Frontend

```powershell
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default. Create `.env.local` and set `VITE_APP_API_URL` and `VITE_SCHEME_API_URL` to connect the APIs.

### PostgreSQL account API

1. Create a PostgreSQL database.
2. Copy `server/.env.example` to `server/.env`; set `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, and `FRONTEND_URL` (normally `http://localhost:5173`).
3. From `server/`, run `npm install`, `npm run db:init`, and `npm run dev`. The API listens on port 3001 by default.
4. Set `VITE_APP_API_URL=http://localhost:3001/api` in the frontend `.env.local`.
5. Configure SMTP values in `server/.env` if password-reset email delivery is needed.

Registration and sign-in use PostgreSQL-backed email/password accounts, bcrypt password hashes, and short-lived HttpOnly cookie sessions. New and reset passwords must be 12–128 characters. Application tracker records and profile data are scoped to the signed-in account. Write requests must come from the configured frontend origin.

### Scheme retrieval service (optional)

The bundled rule-based catalogue works without the retrieval service. To enable broader CSV catalogue search and optional live web discovery, install `recommendation_api/requirements.txt` and start the FastAPI service from the repository root:

```powershell
python -m pip install -r recommendation_api/requirements.txt
Copy-Item recommendation_api/.env.example recommendation_api/.env
python -m uvicorn recommendation_api.main:app --reload --port 8000
```

Set `VITE_SCHEME_API_URL=http://localhost:8000` in `.env.local`. See [recommendation API details](./recommendation_api/README.md).

Scheme coverage depends on the bundled records and optional imported catalogue; it is not a complete or continuously updated inventory of every national and state program. Search matches and eligibility guidance are informational. Confirm current rules, deadlines, and application details with the responsible government department.

## Telegram notifications (optional)

Configure `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (without `@`), and a random `TELEGRAM_WEBHOOK_SECRET` of at least 32 characters in `server/.env`. Set `API_PUBLIC_URL` to the public HTTPS origin of the account API, then register the webhook:

```powershell
curl.exe -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" `
  --data-urlencode "url=${API_PUBLIC_URL}/api/telegram/webhook" `
  --data-urlencode "secret_token=${TELEGRAM_WEBHOOK_SECRET}"
```

Run `npm run db:init` from `server/` to create the Telegram tables. Signed-in users can connect Telegram from **My applications**. Pairing links are single-use and expire after 10 minutes. Changes users make to tracked application statuses are sent to their linked chat.

Personalized scheme alerts require separate consent to store age, gender, occupation, category, income band, and state in the account's PostgreSQL profile. Telegram receives only matching scheme names and official links, never those profile details. Turning off scheme alerts deletes the saved profile and match preferences. Alerts are based on the app's catalogue and are not official eligibility decisions or government status updates.

## Checks

```powershell
npm run lint
npm run build
Push-Location server; npm test; Pop-Location
```
