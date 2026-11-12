import fs from "fs";
import path from "path";

export function renderErrorPage(): string {
  try {
    const indexPath = path.resolve("dist/client/index.html");
    if (fs.existsSync(indexPath)) {
      return fs.readFileSync(indexPath, "utf8");
    }
  } catch {}

  return `<!doctype html>
<html lang="es" class="dark">
  <head>
    <meta charset="utf-8" />
    <title>Skipper View — Panel de administración</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
}
