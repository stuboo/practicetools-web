/**
 * urogyn.click — replaces the PHP redirector that ran on DreamHost.
 *
 * Behaviour is a deliberate match for what DreamHost served, because printed
 * QR codes in patients' hands encode these URLs and cannot be reissued:
 *
 *   GET /             301 -> https://yourpelvicfloor.org
 *   GET /<known>      302 -> the catalogue PDF on files.urogy.in
 *   GET /<unknown>    404
 *
 * The one intentional difference: codes are matched case-insensitively. Every
 * issued code is lowercase, so this cannot collide, and it means a code typed
 * off a handout in caps still resolves.
 *
 * The map is bundled at build time rather than read from KV. It is ~480
 * entries, it changes only when the catalogue does, and bundling makes each
 * deploy atomic with no second system to keep in sync.
 */
import redirects from "./redirects.json";

const HOME = "https://yourpelvicfloor.org";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const code = url.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();

    if (code === "") {
      return Response.redirect(HOME, 301);
    }

    const target = redirects[code];
    if (!target) {
      return new Response("Not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    // 302 rather than 301: these point at catalogue documents whose revision
    // can change (see the IUGA RV2 -> RV4 updates). A permanently cached
    // redirect would pin patients to a superseded leaflet.
    return new Response(null, {
      status: 302,
      headers: {
        Location: target,
        "cache-control": "public, max-age=300",
      },
    });
  },
};
