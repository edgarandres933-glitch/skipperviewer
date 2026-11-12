import server from "../dist/server/server.js";
import fs from "fs";
import path from "path";

// Función auxiliar para determinar la URL original de la solicitud
function getTargetUrl(req) {
  try {
    const headers = req.headers;
    const proto = headers?.get ? (headers.get("x-forwarded-proto") || "https") : (headers?.["x-forwarded-proto"] || "https");
    const host = headers?.get ? (headers.get("x-forwarded-host") || headers.get("host") || "localhost") : (headers?.["x-forwarded-host"] || headers?.["host"] || "localhost");
    const matchedPath = headers?.get ? headers.get("x-matched-path") : headers?.["x-matched-path"];
    
    // Si Vercel nos da x-matched-path (ej. "/", "/advisors", "/_serverFn/..."), reconstruimos con ese path exacto
    if (matchedPath) {
      const parsed = new URL(req.url, `${proto}://${host}`);
      return `${proto}://${host}${matchedPath}${parsed.search}`;
    }
    
    if (typeof req.url === "string" && req.url.startsWith("/")) {
      return `${proto}://${host}${req.url}`;
    }
    
    return req.url;
  } catch {
    return req.url;
  }
}

// Cargar fallback HTML pre-generado si existe
let cachedHtml = null;
function getFallbackHtml() {
  if (!cachedHtml) {
    try {
      const htmlPath = path.resolve("dist/client/index.html");
      if (fs.existsSync(htmlPath)) {
        cachedHtml = fs.readFileSync(htmlPath, "utf8");
      }
    } catch {}
  }
  return cachedHtml;
}

export default async function handler(req, res) {
  const targetUrl = getTargetUrl(req);

  // Runtime Bun o Web Standard (Request -> Response)
  if (req instanceof Request || (!res && req?.url && req?.headers)) {
    try {
      const webReq = (targetUrl !== req.url) ? new Request(targetUrl, req) : req;
      const response = await server.fetch(webReq);
      
      // Si falló el SSR con 500 y no es una llamada RPC a serverFn, retornamos el shell estático 200
      if (response.status >= 500 && !targetUrl.includes("/_serverFn/")) {
        const fallback = getFallbackHtml();
        if (fallback) {
          return new Response(fallback, {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }
      }
      return response;
    } catch (err) {
      console.error("Error en SSR Web Standard:", err);
      if (!targetUrl.includes("/_serverFn/")) {
        const fallback = getFallbackHtml();
        if (fallback) {
          return new Response(fallback, {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }
      }
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  // Runtime Node.js clásico (req, res)
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers || {})) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }

    const init = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = req;
      init.duplex = "half";
    }

    const webRequest = new Request(targetUrl, init);
    let webResponse = await server.fetch(webRequest);

    if (webResponse.status >= 500 && !targetUrl.includes("/_serverFn/")) {
      const fallback = getFallbackHtml();
      if (fallback) {
        res.statusCode = 200;
        res.setHeader("content-type", "text/html; charset=utf-8");
        res.end(fallback);
        return;
      }
    }

    res.statusCode = webResponse.status;
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const arrayBuffer = await webResponse.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("Vercel SSR Error:", error);
    if (!targetUrl.includes("/_serverFn/")) {
      const fallback = getFallbackHtml();
      if (fallback && res && !res.headersSent) {
        res.statusCode = 200;
        res.setHeader("content-type", "text/html; charset=utf-8");
        res.end(fallback);
        return;
      }
    }
    if (res && !res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Internal Server Error");
    }
  }
}
