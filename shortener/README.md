# urogyn.click

Link shortener for the patient education catalogue. Replaces a PHP redirector
that ran on shared hosting at DreamHost.

## Why it works this way

Every card in `books.json` carries a `short_url` (`urogyn.click/<code>`) and a
QR code that encodes it. Those QR codes are printed on handouts already given
to patients, so:

- **codes are permanent.** `generate_map.py` refuses to drop or reuse one.
- **the destination is indirection.** Repointing a code is how the catalogue
  moved from DigitalOcean Spaces to R2 without reissuing a single QR code.
- **it does not depend on our own hardware.** A handout printed today has to
  resolve years from now. Serving these from the API would put them behind a
  home server and a tunnel; a power cut would break paper in patients' hands.
  So the redirects run at Cloudflare's edge instead.

## Layout

| Path | What |
|---|---|
| `generate_map.py` | Derives `src/redirects.json` from `../src/libs/books.json` |
| `src/redirects.json` | Generated. `{ code: destination }`, 483 entries |
| `src/worker.js` | The Worker. Bundles the map at build time |
| `wrangler.toml` | Routes for `urogyn.click/*` and `www.urogyn.click/*` |

## Behaviour

Matched deliberately against what DreamHost served:

```
GET /            301 -> https://yourpelvicfloor.org
GET /<known>     302 -> https://files.urogy.in/...
GET /<unknown>   404
```

Codes are 6 characters of `23456789abcdefghijkmnpqrstuvwxyz` — base32 without
the glyphs that are ambiguous in print (`0/O`, `1/l/I`). Matching is
case-insensitive, and a trailing slash is tolerated; DreamHost 404'd on the
latter, which was never a useful behaviour.

Redirects are 302, not 301. Catalogue documents get revised (IUGA moved Sacral
Neuromodulation RV2 to RV4 while this was being written) and a permanently
cached redirect would pin patients to a superseded leaflet.

## Working on it

```bash
python3 generate_map.py            # rebuild the map after editing books.json
python3 generate_map.py --check    # CI: fail if the committed map has drifted
python3 generate_map.py --mint     # allocate codes for cards that lack one
wrangler dev --port 8787 --local   # run it locally
wrangler deploy                    # ship it
```

`--mint` writes new `short_url` values back into `books.json`. New cards also
need a QR code generated and uploaded to `files.urogy.in/qrcodes/<code>.png`
to match the existing 483.

## Cutting over from DreamHost

1. Add `urogyn.click` as a site in Cloudflare and confirm the imported records
   match what DreamHost serves. There is no MX on this domain, so no mail to
   preserve.
2. Move the nameservers off `ns1-3.dreamhost.com`.
3. `wrangler deploy`.
4. Verify a sample of codes resolve to `files.urogy.in`, then retire the
   DreamHost site.

Until step 2 the Worker cannot take the route, because Cloudflare will not
attach a Worker to a zone it is not authoritative for.
