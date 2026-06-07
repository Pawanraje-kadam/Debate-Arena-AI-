export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return Response.json({ error: { message: "Method Not Allowed" } }, { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: { message: "Invalid JSON body" } }, { status: 400 });
  }

  const { url, model, max_tokens, messages } = body;

  if (!url) {
    return Response.json({ error: { message: "Missing url parameter" } }, { status: 400 });
  }

  let apiKey;
  if (url.includes("anthropic.com")) {
    apiKey = process.env.ANTHROPIC_API_KEY;
  } else if (url.includes("groq.com")) {
    apiKey = process.env.GROQ_API_KEY;
  } else if (url.includes("openrouter.ai")) {
    apiKey = process.env.OPENROUTER_API_KEY;
  } else if (url.includes("googleapis.com")) {
    apiKey = process.env.GEMINI_API_KEY;
  } else {
    return Response.json({ error: { message: "Unknown API provider" } }, { status: 400 });
  }

  if (!apiKey) {
    return Response.json({ error: { message: `API key not configured for this provider` } }, { status: 500 });
  }

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, max_tokens, messages }),
    });

    const data = await upstream.json();
    return Response.json(data, {
      status: upstream.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return Response.json({ error: { message: `Proxy error: ${err.message}` } }, { status: 502 });
  }
};

export const config = { path: "/api/proxy" };
