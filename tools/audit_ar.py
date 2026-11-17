"""Auditoría de la base oficial argentina de estaciones (Secretaría de Energía, ex Res. 314/2016).
NO modifica la base de la app (stations.json la prepara Leonardo a mano). Solo compara y escribe un informe:
  reportes/auditoria-AR.md   (resumen legible)
  reportes/auditoria-AR.json (listas de diferencias, para revisar o aplicar a mano)
Solo usa la biblioteca estándar de Python."""
import csv, io, json, math, os, ssl, sys, unicodedata, urllib.request, datetime, collections

HOSTS = ["http://datos.energia.gob.ar", "https://datos.energia.gob.ar", "https://datos.gob.ar"]
UA = {"User-Agent": "Mozilla/5.0 (compatible; MiConsumo-auditoria/1.0; +https://tydra-hq.github.io/consumo/)"}

def ctx():
    c = ssl.create_default_context(); c.set_ciphers("DEFAULT:@SECLEVEL=1")
    c.options |= getattr(ssl, "OP_LEGACY_SERVER_CONNECT", 0x4)
    return c

def get(url, timeout=300):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout, context=ctx() if url.startswith("https") else None).read()

def norm(s):
    return unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower().strip()

def dist(a, b):
    r = math.pi / 180
    x = math.sin((b[0] - a[0]) * r / 2) ** 2 + math.cos(a[0] * r) * math.cos(b[0] * r) * math.sin((b[1] - a[1]) * r / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(x))

def fnum(v):
    try:
        return float(str(v).strip().replace(",", "."))
    except ValueError:
        return None

def find_dataset(log):
    for host in HOSTS:
        for q in ("precios en surtidor", "surtidor 314"):
            try:
                url = f"{host}/api/3/action/package_search?q={urllib.parse.quote(q)}&rows=10"
                res = json.loads(get(url, 60))["result"]["results"]
            except Exception as e:
                log.append(f"{host} búsqueda '{q}': {type(e).__name__}: {e}")
                continue
            for p in res:
                if "surtidor" in norm(p.get("title")):
                    return host, p
    return None, None

def main():
    log, notes = [], []
    host, pkg = find_dataset(log)
    os.makedirs("reportes", exist_ok=True)
    md = ["# Auditoría de la base oficial de estaciones (Argentina)", "", f"Generado: {datetime.datetime.utcnow():%Y-%m-%d %H:%M} UTC", ""]
    if not pkg:
        md += ["**No se pudo acceder al portal de datos.**", "", *[f"- {l}" for l in log]]
        open("reportes/auditoria-AR.md", "w").write("\n".join(md))
        print("::error::No se encontró el dataset: " + " | ".join(log)[:900]); sys.exit(1)
    md += [f"## Dataset: {pkg.get('title')}", f"- Portal: {host}", f"- Última modificación declarada del dataset: **{pkg.get('metadata_modified', '?')}**", "", "### Recursos"]
    best = None
    for r in pkg.get("resources", []):
        md.append(f"- {r.get('name')} · formato {r.get('format')} · modificado {r.get('last_modified') or r.get('created')} · {r.get('url')}")
        if (r.get("format") or "").lower() == "csv" and (best is None or "vigente" in norm(r.get("name")) or "314" in norm(r.get("url"))):
            best = r
    if not best:
        md.append("\nNo hay un recurso CSV."); open("reportes/auditoria-AR.md", "w").write("\n".join(md)); sys.exit(1)
    # Guardar ya lo que se sabe del dataset (por si la descarga falla)
    open("reportes/auditoria-AR.md", "w", encoding="utf-8").write("\n".join(md) + "\n")
    print(f"::notice::Dataset '{pkg.get('title')}' en {host}, modificado {pkg.get('metadata_modified')}; archivo: {best.get('name')} ({best.get('last_modified') or best.get('created')}) {best.get('url')}"[:1000])
    raw, errs = None, []
    u = best["url"]
    variants = [u, u.replace("http://", "https://"), u.replace("https://", "http://")]
    if "datos.energia.gob.ar" in u:
        variants.append(u.replace("datos.energia.gob.ar", "datos.gob.ar"))
    for v in dict.fromkeys(variants):
        for attempt in range(2):
            try:
                raw = get(v, 600); break
            except Exception as e:
                errs.append(f"{v} intento {attempt + 1}: {type(e).__name__}: {e}")
        if raw: break
    if raw is None:
        md += ["", "**No se pudo descargar el archivo:**"] + [f"- {e}" for e in errs]
        open("reportes/auditoria-AR.md", "w", encoding="utf-8").write("\n".join(md) + "\n")
        print("::error::Descarga fallida: " + " | ".join(errs)[:900]); sys.exit(1)
    text = raw.decode("utf-8-sig", errors="replace")
    if text.count("�") > 50:
        text = raw.decode("latin-1")
    delim = ";" if text[:2000].count(";") > text[:2000].count(",") else ","
    rows = list(csv.DictReader(io.StringIO(text), delimiter=delim))
    cols = {norm(c): c for c in rows[0].keys()}
    C = lambda *names: next((cols[n] for n in names if n in cols), None)
    c_id, c_emp, c_band, c_dir, c_loc, c_prov = C("idempresa"), C("empresa"), C("empresabandera", "bandera"), C("direccion"), C("localidad"), C("provincia")
    c_lat, c_lon, c_fecha, c_prod, c_precio = C("latitud", "lat"), C("longitud", "lon"), C("fecha_vigencia", "indice_tiempo"), C("producto"), C("precio")
    md += ["", f"### Archivo analizado: {best.get('name')}", f"- Filas: {len(rows):,} · columnas: {', '.join(rows[0].keys())}"]

    # Agrupar por estación: la fecha de precio más reciente indica si sigue informando
    st = {}
    for r in rows:
        k = str(r.get(c_id, "")).strip()
        if not k: continue
        s = st.setdefault(k, {"id": k, "brand": r.get(c_band, ""), "company": r.get(c_emp, ""), "address": r.get(c_dir, ""), "city": r.get(c_loc, ""),
                              "province": r.get(c_prov, ""), "lat": fnum(r.get(c_lat)), "lon": fnum(r.get(c_lon)), "last": ""})
        f = str(r.get(c_fecha, ""))[:10]
        if f > s["last"]: s["last"] = f
    today = datetime.date.today()
    def age(d):
        try: return (today - datetime.date.fromisoformat(d)).days
        except ValueError: return None
    ages = [age(s["last"]) for s in st.values()]
    buckets = collections.Counter("≤30 días" if a is not None and a <= 30 else "31-90 días" if a is not None and a <= 90 else "91-365 días" if a is not None and a <= 365 else "más de 1 año" if a is not None else "sin fecha" for a in ages)
    newest = max((s["last"] for s in st.values()), default="")
    md += ["", "## ¿Se sigue actualizando?", f"- Estaciones en la base oficial: **{len(st):,}**", f"- Precio más reciente informado por alguna estación: **{newest or '—'}**",
           "- Antigüedad del último precio informado por cada estación:"] + [f"  - {k}: {v:,}" for k, v in sorted(buckets.items())]

    # Comparación con la base de la app
    mine = json.load(open("stations.json", encoding="utf-8"))
    my = {str(r[0]): r for r in mine["rows"]}
    only_off = [s for k, s in st.items() if k not in my]
    only_mine = [{"id": k, "brand": r[1], "address": r[2], "city": r[3]} for k, r in my.items() if k not in st]
    moved, bad_coords, brand_diff = [], [], []
    for k, s in st.items():
        if s["lat"] is None or s["lon"] is None or not (-56 < s["lat"] < -21 and -74 < s["lon"] < -53):
            bad_coords.append({k_: s[k_] for k_ in ("id", "brand", "address", "city", "province", "lat", "lon")})
        if k in my:
            r = my[k]
            if s["lat"] is not None and s["lon"] is not None:
                d = dist((r[5], r[6]), (s["lat"], s["lon"]))
                if d > 300:
                    moved.append({"id": k, "brand": r[1], "address": r[2], "city": r[3], "mine": [r[5], r[6]], "official": [s["lat"], s["lon"]], "meters": round(d)})
            if norm(s["brand"])[:4] and norm(r[1])[:4] and norm(s["brand"])[:4] != norm(r[1])[:4]:
                brand_diff.append({"id": k, "mine": r[1], "official": s["brand"], "address": r[2], "city": r[3], "last": s["last"]})
    moved.sort(key=lambda x: -x["meters"])
    md += ["", "## Comparación con la base de la app (stations.json)", f"- En la app: {len(my):,} · en la base oficial: {len(st):,}",
           f"- **Nuevas** en la oficial (no están en la app): {len(only_off):,}",
           f"- En la app pero ya no en la oficial (¿cerradas?): {len(only_mine):,}",
           f"- **Ubicación distinta** (> 300 m): {len(moved):,} — más de 5 km: {sum(1 for m in moved if m['meters'] > 5000):,}",
           f"- Coordenadas vacías o fuera de Argentina en la oficial: {len(bad_coords):,}",
           f"- Bandera distinta: {len(brand_diff):,}", "", "### Las 15 mayores diferencias de ubicación"]
    md += [f"- {m['brand']} · {m['address']}, {m['city']}: {m['meters']:,} m" for m in moved[:15]]
    md += ["", "### Nuevas en la oficial (primeras 15)"] + [f"- {s['brand']} · {s['address']}, {s['city']} ({s['province']}) · último precio {s['last']}" for s in only_off[:15]]
    open("reportes/auditoria-AR.md", "w", encoding="utf-8").write("\n".join(md) + "\n")
    json.dump({"generated": str(today), "dataset_modified": pkg.get("metadata_modified"), "newest_price": newest, "freshness": buckets,
               "new_in_official": only_off, "missing_in_official": only_mine, "moved": moved, "bad_coords_official": bad_coords, "brand_diff": brand_diff},
              open("reportes/auditoria-AR.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"::notice::AR oficial {len(st)} estaciones, precio más reciente {newest}; nuevas {len(only_off)}, movidas {len(moved)}, bandera distinta {len(brand_diff)}")

if __name__ == "__main__":
    import urllib.parse
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        print(f"::error::{type(e).__name__}: {e}"[:1000]); raise
