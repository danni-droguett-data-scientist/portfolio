# Daniel Droguett — Data Scientist · Portafolio

Portafolio personal: un sitio de una página, estilo terminal y bilingüe (ES/EN),
que muestra plataformas de datos, dashboards y agentes de IA en producción.

**Language / Idioma:** [English](README.md) | Español

**🔗 En vivo:** https://daniel-droguett-ds.vercel.app

---

## Sobre el sitio

Sitio estático de una página con un pequeño backend serverless. Secciones:
**Proyectos**, **KPIs y análisis**, **Skills**, **Educación**, un **asistente de IA**
con el que puedes conversar, y **Contacto**.

## Destacados

- **Asistente de IA** — pregunta sobre mi trabajo; responde **Claude (Anthropic)**
  a través de una función serverless de Vercel. La API key vive **solo** en una
  variable de entorno del servidor (`ANTHROPIC_API_KEY`), nunca en el cliente.
- **Capturas de dashboards reales** de una plataforma de datos en producción.
- CV descargable.

## Stack

HTML · CSS · JavaScript · React (vía CDN) · Vercel Serverless Functions · API de Anthropic.

## Correr localmente

Es un sitio estático con una sola función serverless (`/api/chat`):

```bash
# Solo la parte estática: abre index.html
# Sitio completo (incl. el asistente de IA) con la CLI de Vercel:
vercel dev
```

Configura `ANTHROPIC_API_KEY` en el proyecto de Vercel (Settings → Environment Variables).

## Estructura

```
index.html      # todo el sitio
api/chat.js      # endpoint serverless del chat (Claude)
*.png            # capturas de dashboards y KPIs
cv.pdf           # currículum
```

---

Chillán, Chile.
