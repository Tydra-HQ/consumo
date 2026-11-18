"""Baja hasta 6 candidatos de Commons para una búsqueda: python tools/logo_candidates.py shell "Shell logo" """
import json, os, sys, urllib.parse, urllib.request
UA = {"User-Agent": "MiConsumo/1.0 (https://github.com/Tydra-HQ/consumo; logos de marcas)"}
name, query = sys.argv[1], sys.argv[2]
q = urllib.parse.urlencode({"action": "query", "list": "search", "srnamespace": 6, "srlimit": 12, "format": "json", "srsearch": query})
hits = json.loads(urllib.request.urlopen(urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + q, headers=UA), timeout=60).read())["query"]["search"]
os.makedirs("logos/candidatos", exist_ok=True)
out = []
for h in hits:
    f = h["title"][5:]
    if not f.lower().endswith((".svg", ".png")):
        continue
    try:
        png = urllib.request.urlopen(urllib.request.Request("https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(f) + "?width=192", headers=UA), timeout=60).read()
    except Exception as e:  # noqa
        continue
    path = f"logos/candidatos/{name}-{len(out) + 1}.png"
    open(path, "wb").write(png); out.append({"file": path, "commons": f})
    if len(out) >= 6:
        break
json.dump(out, open(f"logos/candidatos/{name}.json", "w"), ensure_ascii=False, indent=1)
print(out)
