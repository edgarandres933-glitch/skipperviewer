import fallbackHtml from "./index-fallback.html?raw";

export function renderErrorPage(): string {
  if (fallbackHtml && fallbackHtml.length > 500) {
    return fallbackHtml;
  }

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
