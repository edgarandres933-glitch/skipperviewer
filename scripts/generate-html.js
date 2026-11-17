import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

async function main() {
  try {
    const serverPath = pathToFileURL(path.resolve("dist/server/server.js")).href;
    const serverModule = await import(serverPath);
    const server = serverModule.default;
    
    // Invocamos SSR para capturar el HTML
    console.log("Invocando SSR para capturar HTML con hidratación TanStack...");
    const res = await server.fetch(new Request("http://localhost:3000/"));
    let html = await res.text();
    
    if (!html || html.length < 500) {
      throw new Error("El SSR retornó HTML vacío o insuficiente: " + html);
    }

    // Detectar archivo real generado en dist/client/assets/
    const assetsDir = path.resolve("dist/client/assets");
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      const realIndexJs = files.find(f => /^index-.*\.js$/.test(f));
      const realStylesCss = files.find(f => /^styles-.*\.css$/.test(f));
      
      if (realIndexJs) {
        console.log(`Detectado bundle principal: ${realIndexJs}`);
        // Reemplazar cualquier referencia previa a index-*.js por el hash real actual
        html = html.replace(/\/assets\/index-[A-Za-z0-9_-]+\.js/g, `/assets/${realIndexJs}`);
      }
      if (realStylesCss) {
        console.log(`Detectado CSS principal: ${realStylesCss}`);
        html = html.replace(/\/assets\/styles-[A-Za-z0-9_-]+\.css/g, `/assets/${realStylesCss}`);
      }
    }

    const outPath = path.resolve("dist/client/index.html");
    fs.writeFileSync(outPath, html, "utf8");
    console.log(`Generado con éxito dist/client/index.html (${html.length} bytes)`);

    // Sincronizar fallback interno y public
    fs.writeFileSync(path.resolve("src/lib/index-fallback.html"), html, "utf8");
    fs.writeFileSync(path.resolve("public/index.html"), html, "utf8");
    console.log("Sincronizado public/index.html y src/lib/index-fallback.html");

    process.exit(0);
  } catch (err) {
    console.error("Error al pre-renderizar index.html:", err);
    process.exit(1);
  }
}

main();
