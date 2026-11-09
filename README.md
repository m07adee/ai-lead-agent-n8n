# AI Lead Qualification & Auto-Reply Agent (n8n + Claude AI)

An n8n automation that turns every website inquiry into a qualified, scored, and answered lead — in seconds, with zero manual work.

## The problem
Small businesses and agencies lose deals because inbound requests sit unanswered for hours, and sales teams waste time on low-quality or spam leads.

## The solution
1. **Lead Form** – a hosted "Request a Quote" form (name, email, company, budget, message).
2. **AI Lead Analyst (Anthropic Claude Haiku 5.5)** – reads the request and returns structured JSON: intent, urgency, fit score, summary, key requirements, and a personalized reply.
3. **Structured Output Parser** – enforces a strict JSON schema, so the AI output is always reliable.
4. **Score & Enrich Lead (JavaScript)** – combines AI fit score + budget + urgency into a 0–100 lead score and a tier: Hot / Warm / Cold / Spam.
5. **Route by Lead Tier** – Hot leads trigger an instant sales alert, Warm/Cold leads go to a nurture path, spam is discarded.
6. **Personalized Reply** – the visitor instantly sees an AI-written reply tailored to their exact request.

## Results
- Response time: from hours to **under 10 seconds**
- Sales focuses only on high-value (Hot) leads
- Spam filtered automatically
- Model-agnostic: runs on Anthropic Claude, or on the free Google Gemini tier (`workflow-gemini.json`)

## Tech stack
n8n · Anthropic Claude API · Google Gemini API · LLM structured output (JSON Schema) · JavaScript · Docker

## Easy extensions
Gmail/Outlook auto-reply · Slack/WhatsApp/Telegram alerts for Hot leads · Google Sheets / HubSpot / GoHighLevel CRM logging · Calendly booking link

## Run it
1. Build the form: `cd web && npm install && npm run build && cd ..`
2. `docker compose up -d` → form at http://localhost:8090, n8n editor at http://localhost:5678
3. In n8n: **Workflows → Import from file → `workflow.json`**.
4. Add credentials: **Anthropic** (API key) on the Claude node, and **SMTP** (e.g. Gmail + App Password) on the two email nodes. Set your own email in the email nodes.
5. Publish the workflow, then open http://localhost:8090 and submit a request.
6. Go public: `docker compose --profile public up -d` and grab the `https://*.trycloudflare.com` link from `docker compose logs tunnel`.

No Claude key? Import `workflow-gemini.json` instead and use a free key from https://aistudio.google.com/apikey.

## v2 — Public multilingual lead system
- **Animated landing form** (`web/`, Next.js + Tailwind + [Vengeance UI](https://www.vengenceui.com/) + Framer Motion): aurora background, glowing animated card, liquid button, staggered text reveals, project-type chips, English / Arabic (RTL) / Turkish switcher, phone + WhatsApp field, client-side validation, honeypot anti-bot field, animated "AI is analyzing" state.
- **Webhook API** (`POST /webhook/lead`): validates and sanitizes input, then the AI replies in the visitor's chosen language.
- **Email alerts for every request** (spam is flagged, never silently dropped): the owner gets a color-coded HTML lead card (score, tier, summary, requirements, one-click Email / WhatsApp buttons), and the client gets the AI reply by email.
- **Secure exposure**: a Caddy reverse proxy (`site/Caddyfile`) publishes only the form and the lead endpoint, so the n8n editor is never public. A Cloudflare Tunnel provides the public HTTPS link.
