import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

async function main() {
  try {
    const serverPath = pathToFileURL(path.resolve("dist/server/server.js")).href;
    const serverModule = await import(serverPath);
    const server = serverModule.default;
    
    // Ejecutar SSR request para generar el HTML con los hashes frescos
    const res = await server.fetch(new Request("http://localhost:3000/"));
    let html = await res.text();
    
    // Script de resiliencia para el login:
    // 1. Si el usuario ya tiene sesión activa en localStorage, recarga o no estorba.
    // 2. Si el usuario envía el formulario antes de que carguen los módulos de JS,
    //    intercepta el submit, valida credenciales y guarda sesión en localStorage inmediatamente.
    const inlineAuthScript = `
<script>
(function() {
  function initLoginFormListener() {
    var form = document.querySelector('form');
    if (!form || form.__auth_bound) return;
    form.__auth_bound = true;

    form.addEventListener('submit', function(e) {
      // Si React o TanStack ya están activos y gestionan el estado, dejamos pasar
      if (window.__skipper_react_ready) return;

      e.preventDefault();
      var userInput = form.querySelector('input[type="text"]');
      var passInput = form.querySelector('input[type="password"]');
      var user = userInput ? userInput.value.trim() : '';
      var pass = passInput ? passInput.value.trim() : '';

      var VALID_USER = 'adminSCviewer';
      var VALID_PASS = 'SkipC@P@.%!1.';

      if (user === VALID_USER && pass === VALID_PASS) {
        localStorage.setItem('skipperview_auth_token', 'authenticated_session_active');
        localStorage.setItem('skipperview_auth_user', user);
        window.location.href = '/';
      } else {
        alert('Usuario o contraseña incorrectos. Verifica tus credenciales.');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginFormListener);
  } else {
    initLoginFormListener();
  }
})();
</script>
`;

    if (html.includes("</body>")) {
      html = html.replace("</body>", `${inlineAuthScript}</body>`);
    } else {
      html += inlineAuthScript;
    }

    const outPath = path.resolve("dist/client/index.html");
    fs.writeFileSync(outPath, html, "utf8");
    console.log("Generado con éxito dist/client/index.html con inlineAuthScript (" + html.length + " bytes)");
    process.exit(0);
  } catch (err) {
    console.error("Error al pre-renderizar index.html:", err);
    process.exit(1);
  }
}

main();
