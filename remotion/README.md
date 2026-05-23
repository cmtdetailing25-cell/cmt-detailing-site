# CMT Remotion Render Service

Express server that renders CMT before/after reels and uploads them to Vercel Blob. Designed to be deployed on Railway so n8n can trigger renders from anywhere.

---

## Endpoints

### `GET /health`
Liveness check.

```json
{ "ok": true, "renderInProgress": false }
```

### `POST /render`
Render a campaign video and upload it to Vercel Blob.

**Headers**
```
Content-Type: application/json
x-render-secret: <RENDER_SERVICE_SECRET>
```

**Body** — same shape as the n8n campaign payload:
```json
{
  "campaignId": "mustang-detail-001",
  "workflowRunId": "run-abc123",
  "campaignTitle": "2022 Mustang GT Full Detail",
  "approvedCaption": "This Mustang GT came in covered in swirl marks...",
  "approvedCreativeNotes": "Book your mobile detail",
  "media": {
    "before":    [{ "url": "https://...", "type": "image" }],
    "process":   [],
    "after":     [{ "url": "https://...", "type": "image" }],
    "thumbnail": []
  }
}
```

**Response**
```json
{
  "ok": true,
  "campaignId": "mustang-detail-001",
  "workflowRunId": "run-abc123",
  "renderId": "34cd780d-...",
  "videoUrl": "https://saqi6hmtnfm6ddet.public.blob.vercel-storage.com/automation/renders/...",
  "thumbnailUrl": null,
  "duration": 15
}
```

Concurrent renders return `503` with `retryAfter: 60`.

---

## Local development

```bash
cd remotion
npm install

# Copy env from parent project (or set variables directly)
cp ../.env .env   # optional — server.ts loads ../.env automatically

# Start the server
npm run server
# → Listening on port 3001

# Health check
curl http://localhost:3001/health

# Test render (no real media — uses placeholder panels)
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -H "x-render-secret: dev-secret" \
  -d @input/sample-campaign.json
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob write token (from Vercel dashboard) |
| `RENDER_SERVICE_SECRET` | Yes (prod) | Shared secret validated in `x-render-secret` header |
| `PORT` | No | HTTP port (default `3001`) |

---

## Deploy to Railway

1. Create a new Railway project → **Deploy from GitHub repo**
2. Set the **Root Directory** to `remotion`
3. Railway detects the `Dockerfile` automatically
4. Add environment variables in Railway dashboard:
   - `BLOB_READ_WRITE_TOKEN`
   - `RENDER_SERVICE_SECRET`
5. Deploy → copy the Railway public URL

---

## n8n HTTP Request node

- **Method**: POST
- **URL**: `https://<railway-url>/render`
- **Headers**: `x-render-secret: {{ $env.RENDER_SERVICE_SECRET }}`
- **Body** (JSON): map from n8n campaign payload fields
- **Response**: capture `videoUrl` for the next workflow step

Set a **timeout of 300 seconds** — renders typically take 30–90 seconds.
