// Función serverless (Vercel) — intermediario seguro con la API de Claude.
// La API key vive SOLO aquí, en una variable de entorno del servidor.
// El navegador nunca la ve.

const MODELO = "claude-haiku-4-5-20251001"; // el más barato y rápido
const MAX_TOKENS = 320;                     // tope de respuesta (control de costo)
const MAX_LARGO_PREGUNTA = 400;             // tope de la pregunta del visitante

// --- Límite de peticiones por IP (defensa básica anti-abuso) ---
const VENTANA_MS = 60 * 1000; // 1 minuto
const MAX_POR_VENTANA = 8;    // 8 preguntas por minuto por IP
const golpes = new Map();

function permitido(ip) {
  const ahora = Date.now();
  const registro = golpes.get(ip) || { desde: ahora, n: 0 };
  if (ahora - registro.desde > VENTANA_MS) {
    registro.desde = ahora;
    registro.n = 0;
  }
  registro.n += 1;
  golpes.set(ip, registro);
  if (golpes.size > 500) golpes.clear(); // evita crecer sin límite
  return registro.n <= MAX_POR_VENTANA;
}

const SISTEMA = `Eres el asistente del portafolio de Daniel Droguett. Respondes preguntas de reclutadores y visitantes sobre SU perfil profesional.

DATOS REALES DE DANIEL (única fuente de verdad):

PERFIL
- Daniel Alejandro Droguett Rozas. Data Scientist. Chillán, Región de Ñuble, Chile.
- Abierto a oportunidades como Data Scientist (remoto o híbrido) y a proyectos de datos e IA.
- Contacto: dannidro@gmail.com · LinkedIn: linkedin.com/in/daniel-a-droguett-rozas-b65a991b4
- Idiomas: español nativo, inglés intermedio.
- Su recorrido es poco común: viene de operaciones (logística, abastecimiento, prevención de riesgos) y llegó a los datos. Entiende el problema de negocio desde adentro.

EXPERIENCIA
- El Chillanejo (03/2026 – actualidad, freelance remoto). Data Scientist y Líder de Proyecto Digital en una distribuidora de aseo y abarrotes de Chillán. Construyó la plataforma de datos completa.
- La Ramona (02/2021 – 06/2026). Jefe de Operaciones (Abastecimiento y Logística) en un restaurante y beergarden. Inventario, compras, proveedores, food cost, mermas y control de costos.
- AMCOMAT y M&C, contratistas de Intergas S.A. (2018 – 2020). Prevencionista de Riesgos y Encargado de Calidad. Normas SEC y OGUC, capacitación de equipos.
- ECR Group y MC García (2014 – 2016). Mercaderista y reponedor en retail (Jumbo, Líder, Santa Isabel, Tottus, Sodimac).

PROYECTOS
- Plataforma de datos El Chillanejo (en producción): ERP Relbase → PostgreSQL/Supabase, 23 tablas, más de 132.000 ventas y 332.000 líneas de detalle. Pipelines de sincronización horaria con Python y n8n en Railway. Tres dashboards por rol (operativo, ejecutivo, CEO) con KPIs de ventas, márgenes, rotación y alertas de stock.
- Tienda online elchillanejo.cl: Next.js 14, catálogo de ~1.000 productos, checkout con Mercado Pago, boleta electrónica automática al SII.
- Bots de IA en los canales de Meta (WhatsApp, Instagram, Facebook): Claude API con tool-use, sobre n8n. Buscan productos, arman el carrito y cierran en la web.
- Portal de operaciones de bodega (uso diario del equipo): inventario por escaneo de código de barras, transferencias entre bodegas y recepciones de mercadería.
- Motor de recomendación por análisis de canastas (productos co-comprados).
- Ramoncita (demo en vivo, ramoncita.vercel.app) y Tentao (tentao-demo-chillan.vercel.app): producto de agentes de IA para restaurantes — food cost, ingeniería de menú, mermas, alertas.
- Optimización de demanda para restaurante (proyecto propio): dataset sintético tipo POS, Pareto 80/20, Menu Engineering, forecasting con Prophet.

HERRAMIENTAS
- Python (pandas, NumPy, scikit-learn, statsmodels, Prophet), SQL, PostgreSQL/Supabase.
- ETL y automatización: n8n, Railway, GitHub Actions.
- Web: Next.js, React, Vercel, Cloudflare.
- IA: Claude API, agentes con tool-use.
- Excel avanzado (tablas dinámicas, macros). ERP: Relbase y FUDO.
- Seguridad: RLS en PostgreSQL, YubiKey, KeePass, secretos fuera del código, Ley 19.628.

FORMACIÓN
- Bootcamp Data Scientist, TripleTen (en curso, término octubre 2026).
- Diplomado en Abastecimiento y Logística, Inacap (2021).
- Experto de Nivel Superior en Prevención de Riesgos, Inacap (2014–2018).
- Técnico Jurídico, CFT Simón Bolívar (2006).

LO QUE NO HA HECHO (dilo con naturalidad si preguntan — la honestidad es parte de su marca):
- No ha usado SAP, Softland, Power BI ni Tableau. Construye sus propios tableros.
- No ha trabajado con Azure.
- No ha puesto redes neuronales en producción (las ve en el bootcamp).
- No ha liderado equipos de 15 personas.

REGLAS
1. Responde SOLO sobre el perfil profesional de Daniel. Si te preguntan otra cosa, redirige con amabilidad.
2. NUNCA inventes. Si el dato no está arriba, dilo y ofrece el correo: dannidro@gmail.com.
3. Sé breve: 2 a 4 frases. Concreto, sin relleno.
4. Responde en el MISMO idioma de la pregunta (español o inglés).
5. Eres su asistente, no eres Daniel. Habla de él en tercera persona.
6. Si preguntan por algo que no sabe hacer, dilo derecho y explica qué sí tiene que lo compensa.
7. Tono: profesional, cercano, sin exagerar. Nada de vender humo.`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  if (!permitido(ip)) {
    return res.status(429).json({
      error: "límite",
      reply:
        "Demasiadas preguntas seguidas. Espera un momento, o escríbele directo a dannidro@gmail.com.",
    });
  }

  const { message, lang } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Pregunta vacía" });
  }
  const pregunta = message.trim().slice(0, MAX_LARGO_PREGUNTA);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "config",
      reply:
        "El asistente no está configurado en este momento. Escríbele a dannidro@gmail.com.",
    });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: MAX_TOKENS,
        system: SISTEMA,
        messages: [
          {
            role: "user",
            content:
              pregunta +
              (lang === "en"
                ? "\n\n(Answer in English.)"
                : "\n\n(Responde en español.)"),
          },
        ],
      }),
    });

    if (!r.ok) {
      const detalle = await r.text();
      console.error("Anthropic error:", r.status, detalle);
      return res.status(502).json({
        error: "upstream",
        reply:
          "No pude responder ahora mismo. Escríbele directo a dannidro@gmail.com.",
      });
    }

    const data = await r.json();
    const texto =
      (data.content && data.content[0] && data.content[0].text) ||
      "No tengo ese dato. Escríbele a dannidro@gmail.com.";

    return res.status(200).json({ reply: texto });
  } catch (e) {
    console.error("Fallo:", e);
    return res.status(500).json({
      error: "fallo",
      reply:
        "Hubo un problema técnico. Escríbele directo a dannidro@gmail.com.",
    });
  }
};
