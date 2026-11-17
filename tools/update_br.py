"""Descarga las estaciones de servicio de Brasil (ANP, API Revendedores) y genera estaciones-BR.json.
Primera versión: solo estaciones con coordenadas (sin precios). Además guarda una muestra cruda en
reportes/br-muestra.json para ver qué campos devuelve la API. Solo usa la biblioteca estándar."""
import json, ssl, sys, time, unicodedata, urllib.request, datetime, os

BASE = "https://revendedoresapi.anp.gov.br/v1/combustivel"

def norm(s):
    return unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower().strip()

def legacy_context():
    ctx = ssl.create_default_context()
    ctx.set_ciphers("DEFAULT:@SECLEVEL=1")
    ctx.options |= getattr(ssl, "OP_LEGACY_SERVER_CONNECT", 0x4)
    return ctx

def get(url):
    last = None
    for ctx in (None, legacy_context()):
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "MiConsumo/1.0 (github.com/Tydra-HQ/consumo)", "Accept": "application/json"})
                with urllib.request.urlopen(req, timeout=120, context=ctx) as r:
                    return json.loads(r.read().decode("utf-8-sig"))
            except Exception as e:  # noqa
                last = e
                print(f"  intento {attempt + 1} falló: {e!r}")
                time.sleep(5)
    raise last

def flat(d, pre=""):
    out = {}
    if isinstance(d, dict):
        for k, v in d.items():
            if isinstance(v, (dict, list)):
                out.update(flat(v if isinstance(v, dict) else (v[0] if v and isinstance(v[0], dict) else {}), pre + k + "."))
            else:
                out[pre + k] = v
    return out

def pick(f, *names, avoid=()):
    for n in names:
        for k, v in f.items():
            kk = norm(k)
            if n in kk and not any(a in kk for a in avoid) and v not in (None, ""):
                return v
    return None

def num(v):
    try:
        return float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return None

def title(s):
    s = " ".join(str(s or "").split()).title()
    for w in (" De ", " Do ", " Da ", " Dos ", " Das ", " E "):
        s = s.replace(w, w.lower())
    return s

BRANDS = [("petrobras", "Petrobras"), ("vibra", "Petrobras"), ("br distribuidora", "Petrobras"), ("ipiranga", "Ipiranga"),
          ("raizen", "Shell"), ("shell", "Shell"), ("ale ", "ALE"), ("alesat", "ALE"), ("branca", "Bandeira branca")]

def brand(dist):
    n = norm(dist) + " "
    for k, v in BRANDS:
        if k in n:
            return v
    return title(dist)[:24] or "Bandeira branca"

def in_brazil(lat, lon):
    return -34.0 < lat < 5.5 and -74.5 < lon < -28.5

def items_of(page):
    if isinstance(page, list):
        return page
    for k in ("data", "dados", "items", "itens", "result", "resultado", "registros", "revendedores"):
        if isinstance(page.get(k), list):
            return page[k]
    for v in page.values():
        if isinstance(v, list) and v and isinstance(v[0], dict):
            return v
    return []

def main(out):
    print("Probando la API de la ANP…")
    first = get(BASE + "?numeropagina=1")
    os.makedirs("reportes", exist_ok=True)
    rows = items_of(first)
    meta = {k: v for k, v in first.items() if not isinstance(v, list)} if isinstance(first, dict) else {}
    print("Metadatos:", meta, "| registros en la página 1:", len(rows))
    with open("reportes/br-muestra.json", "w", encoding="utf-8") as fh:
        json.dump({"meta": meta, "muestra": rows[:3]}, fh, ensure_ascii=False, indent=1)
    pages = int(pick(meta, "pagina", "pages", "totalpag") or 1) if meta else 1
    pages = max(1, min(pages, 40))
    for p in range(2, pages + 1):
        print("Página", p, "de", pages)
        rows += items_of(get(BASE + f"?numeropagina={p}"))
    st, seen, bad = [], set(), 0
    for r in rows:
        f = flat(r)
        lat = num(pick(f, "latitude", avoid=("anp4c",)))
        lon = num(pick(f, "longitude", avoid=("anp4c",)))
        if lat is None or lon is None:
            lat, lon = num(pick(f, "latitude")), num(pick(f, "longitude"))
        if lat is None or lon is None or not in_brazil(lat, lon):
            bad += 1
            continue
        cnpj = str(pick(f, "cnpj") or "").strip()
        sid = "BR" + (cnpj or str(pick(f, "simp", "autoriz") or len(st)))
        if sid in seen:
            continue
        seen.add(sid)
        addr = " ".join(str(x) for x in (pick(f, "endereco", "logradouro"), pick(f, "numero")) if x)
        st.append([sid, brand(pick(f, "distribuidora", "bandeira") or ""), title(addr)[:60],
                   title(pick(f, "municipio") or ""), str(pick(f, "uf") or "").upper(), round(lat, 5), round(lon, 5), []])
    print(f"Estaciones válidas: {len(st)} · sin coordenadas o fuera de Brasil: {bad}")
    if len(st) < 1000:
        print(f"::error::Muy pocas estaciones ({len(st)}); no se guarda el archivo.")
        sys.exit(1)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump({"version": datetime.date.today().isoformat(), "pricesDate": None, "source": "ANP – API Revendedores",
                   "stations": st}, fh, ensure_ascii=False, separators=(",", ":"))

if __name__ == "__main__":
    try:
        main(sys.argv[1] if len(sys.argv) > 1 else "estaciones-BR.json")
    except Exception as e:  # noqa
        print(f"::error::No se pudo descargar Brasil: {e!r}")
        raise
