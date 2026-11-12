// Script para generar dist/client/index.html a partir de la compilación SSR
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

async function main() {
  try {
    const serverPath = pathToFileURL(path.resolve("dist/server/server.js")).href;
    const serverModule = await import(serverPath);
    const server = serverModule.default;
    
    const res = await server.fetch(new Request("http://localhost:3000/"));
    const html = await res.text();
    const outPath = path.resolve("dist/client/index.html");
    fs.writeFileSync(outPath, html, "utf8");
    console.log("Generado con éxito dist/client/index.html (" + html.length + " bytes)");
    process.exit(0);
  } catch (err) {
    console.error("Error al pre-renderizar index.html:", err);
    process.exit(1);
  }
}

main();
