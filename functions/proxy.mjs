export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { url, model, max_tokens, messages } = body;

  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  // Pick the right API key based on the target URL
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
    return new Response("Unknown API provider", { status: 400 });
  }

  if (!apiKey) {
    return new Response(`API key not configured for this provider`, { status: 500 });
  }

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, max_tokens, messages }),
    });

    const data = await upstream.json();
    return Response.json(data, { status: upstream.status });
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
};

export const config = { path: "/api/proxy" };
