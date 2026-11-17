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

        // Parchear con seguridad los accesos a stores en el bundle del cliente para prevenir TypeError (reading 'get')
        const clientBundlePath = path.join(assetsDir, realIndexJs);
        let bundleCode = fs.readFileSync(clientBundlePath, "utf8");
        let patched = false;

        // 1. Parche en bootstrap de TanStack: e.stores.matchesId.get() -> (e?.stores?.matchesId?.get?.() || [])
        if (bundleCode.includes("e.stores.matchesId.get()")) {
          bundleCode = bundleCode.replaceAll("e.stores.matchesId.get()", "(e?.stores?.matchesId?.get?.() || [])");
          patched = true;
          console.log("Parcheado bootstrap hydration: e.stores.matchesId.get()");
        } else if (bundleCode.includes("e?.stores?.matchesId?.get() || []")) {
          bundleCode = bundleCode.replaceAll("e?.stores?.matchesId?.get() || []", "(e?.stores?.matchesId?.get?.() || [])");
          patched = true;
          console.log("Parcheado bootstrap hydration existente con paréntesis seguros");
        }

        // 2. Parche en listener pagehide: e.stores.resolvedLocation.get() -> e?.stores?.resolvedLocation?.get()
        if (bundleCode.includes("e.stores.resolvedLocation.get()")) {
          bundleCode = bundleCode.replaceAll(
            "e.stores.resolvedLocation.get()??e.stores.location.get()",
            "e?.stores?.resolvedLocation?.get?.()??e?.stores?.location?.get?.()"
          );
          patched = true;
          console.log("Parcheado scroll restoration listener: e.stores.resolvedLocation.get()");
        }

        // 3. Parche en resolución de rutas: e.router.stores.matchesId.get() y e.router.stores.matches.get()
        const targetRouterMatchesId = "r=e.router.stores.matchesId.get()[n]";
        const patchRouterMatchesId = "r=(e?.router?.stores?.matchesId?.get?.() || [])[n]";
        if (bundleCode.includes(targetRouterMatchesId)) {
          bundleCode = bundleCode.replace(targetRouterMatchesId, patchRouterMatchesId);
          patched = true;
          console.log("Parcheado router resolution: r=e.router.stores.matchesId.get()[n]");
        }

        const targetRouterMatches = "e.router.stores.matches.get()";
        if (bundleCode.includes(targetRouterMatches)) {
          bundleCode = bundleCode.replaceAll(targetRouterMatches, "(e?.router?.stores?.matches?.get?.() || [])");
          patched = true;
          console.log("Parcheado router matches: e.router.stores.matches.get()");
        }

        const targetRouterMatchStores = "e.router.stores.matchStores";
        if (bundleCode.includes(targetRouterMatchStores)) {
          bundleCode = bundleCode.replaceAll(targetRouterMatchStores, "(e?.router?.stores?.matchStores || new Map())");
          patched = true;
          console.log("Parcheado router matchStores: e.router.stores.matchStores");
        }

        const targetStoresMatchStores = "e.stores.matchStores";
        if (bundleCode.includes(targetStoresMatchStores)) {
          bundleCode = bundleCode.replaceAll(targetStoresMatchStores, "(e?.stores?.matchStores || new Map())");
          patched = true;
          console.log("Parcheado stores matchStores: e.stores.matchStores");
        }

        // 4. Parche en inicialización de router: asegurar stores siempre disponible
        const targetInit = "if(!this.stores&&this.latestLocation){";
        const targetInitPatch = "if(!this.stores){if(!this.latestLocation&&this.history)this.updateLatestLocation();";
        if (bundleCode.includes(targetInit)) {
          bundleCode = bundleCode.replace(targetInit, targetInitPatch);
          patched = true;
          console.log("Parcheado Router.stores eager initialization");
        }

        if (patched) {
          fs.writeFileSync(clientBundlePath, bundleCode, "utf8");
          console.log(`Bundle del cliente ${realIndexJs} protegido y guardado.`);
        }
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
