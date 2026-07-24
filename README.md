# Daniel Droguett — Data Scientist · Portfolio

Personal portfolio: a terminal-style, bilingual (ES/EN) single-page site showcasing
data platforms, dashboards and AI agents in production.

**Language / Idioma:** English | [Español](README.es.md)

**🔗 Live:** https://daniel-droguett-ds.vercel.app

---

## About

Static single-page site with a small serverless backend. Sections: **Projects**,
**KPIs & analysis**, **Skills**, **Education**, an **AI assistant** you can chat with,
and **Contact**.

## Highlights

- **AI assistant** — ask about my work; answered by **Claude (Anthropic)** through a
  Vercel serverless function. The API key lives **only** in a server-side environment
  variable (`ANTHROPIC_API_KEY`), never in the client.
- **Real dashboard screenshots** from a data platform running in production.
- Downloadable CV.

## Tech

HTML · CSS · JavaScript · React (via CDN) · Vercel Serverless Functions · Anthropic API.

## Run locally

It's a static site with one serverless function (`/api/chat`):

```bash
# Static parts: just open index.html
# Full site (incl. the AI assistant) with the Vercel CLI:
vercel dev
```

Set `ANTHROPIC_API_KEY` in the Vercel project (Settings → Environment Variables).

## Structure

```
index.html      # the whole site
api/chat.js      # serverless chat endpoint (Claude)
*.png            # dashboard & KPI screenshots
cv.pdf           # résumé
```

---

Chillán, Chile.
