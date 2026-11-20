import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { KIT_ROOT } from "./paths.mjs";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".txt": "text/plain; charset=utf-8",
};

function inside(root, candidate) {
  const full = path.resolve(root, "." + candidate);
  const prefix = path.resolve(root) + path.sep;
  if (full !== path.resolve(root) && !full.startsWith(prefix)) return null;
  return full;
}

export function startServer(project, { port = 0 } = {}) {
  const mounts = [
    ["/kit/", KIT_ROOT],
    ["/project/", project.explainer],
    ["/build/", project.build],
  ];

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (pathname === "/" || pathname === "/index.html") {
      res.writeHead(200, { "content-type": MIME[".html"], "cache-control": "no-store" });
      fs.createReadStream(path.join(KIT_ROOT, "render", "index.html")).pipe(res);
      return;
    }

    for (const [prefix, root] of mounts) {
      if (!pathname.startsWith(prefix)) continue;
      const file = inside(root, pathname.slice(prefix.length - 1));
      if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404, { "content-type": "text/plain" });
        res.end("not found");
        return;
      }
      res.writeHead(200, {
        "content-type": MIME[path.extname(file)] ?? "application/octet-stream",
        "cache-control": "no-store",
      });
      fs.createReadStream(file).pipe(res);
      return;
    }

    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        port: address.port,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}
