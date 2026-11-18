"""Baja los logos de las marcas de estaciones desde Wikidata/Wikimedia Commons (propiedad P154 'logo').
Guarda PNG de 192 px de ancho en logos/<marca>.png y un reporte en logos/fuentes.json."""
import json, os, re, sys, time, urllib.parse, urllib.request

UA = {"User-Agent": "MiConsumo/1.0 (https://github.com/Tydra-HQ/consumo; logos de marcas)"}
BRANDS = {
    "YPF": [("enwiki", "YPF")], "Shell": [("enwiki", "Shell plc")], "Axion": [("enwiki", "Axion Energy"), ("eswiki", "Axion Energy")],
    "Puma": [("enwiki", "Puma Energy")], "Dapsa": [("eswiki", "DAPSA"), ("eswiki", "Destilería Argentina de Petróleo")],
    "Gulf": [("enwiki", "Gulf Oil")], "Refinor": [("eswiki", "Refinor")],
    "Repsol": [("enwiki", "Repsol")], "BP": [("enwiki", "BP")], "Moeve": [("enwiki", "Moeve"), ("enwiki", "Cepsa")],
    "Cepsa": [("eswiki", "Cepsa"), ("enwiki", "Cepsa")], "Galp": [("enwiki", "Galp Energia")], "Ballenoil": [("eswiki", "Ballenoil")],
    "Plenergy": [("eswiki", "Plenergy")], "Petroprix": [("eswiki", "Petroprix")], "Petronor": [("eswiki", "Petronor"), ("enwiki", "Petronor")],
    "Carrefour": [("enwiki", "Carrefour")], "Disa": [("eswiki", "Disa Corporación Petrolífera"), ("eswiki", "DISA (empresa)")],
    "Avia": [("enwiki", "AVIA International")], "Q8": [("enwiki", "Kuwait Petroleum International")],
    "Petrobras": [("enwiki", "Petrobras")], "Ipiranga": [("ptwiki", "Ipiranga Produtos de Petróleo"), ("ptwiki", "Grupo Ultra")],
    "ALE": [("ptwiki", "ALE Combustíveis")], "Esso": [("enwiki", "Esso")], "Campsa": [("eswiki", "CAMPSA")], "Alcampo": [("eswiki", "Alcampo")],
}

SEARCH = {"Axion": "Axion Energy logo", "Ipiranga": "Ipiranga logo posto", "ALE": "ALE Combustíveis logo", "Disa": "Disa logo gasolinera",
          "Cepsa": "Cepsa logo", "Carrefour": "Carrefour logo", "Avia": "Avia logo", "Ballenoil": "Ballenoil logo", "Plenergy": "Plenergy logo",
          "Dapsa": "Dapsa logo", "Refinor": "Refinor logo", "Campsa": "Campsa logo", "Alcampo": "Alcampo logo"}
ONLY = sys.argv[1:]  # opcional: solo estas marcas
FORCE = {"Shell": "Shell logo.svg"}  # archivo de Commons elegido a mano (la concha de Shell)

def get(url, raw=False):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    return data if raw else json.loads(data)

def slug(b):
    return re.sub(r"[^a-z0-9]+", "-", b.lower()).strip("-")

def logo_file(site, title):
    q = urllib.parse.urlencode({"action": "wbgetentities", "sites": site, "titles": title, "props": "claims", "format": "json"})
    d = get("https://www.wikidata.org/w/api.php?" + q)
    for ent in d.get("entities", {}).values():
        for c in ent.get("claims", {}).get("P154", []):
            v = c.get("mainsnak", {}).get("datavalue", {}).get("value")
            if v:
                return v, ent.get("id")
    return None, None

os.makedirs("logos", exist_ok=True)
report = json.load(open("logos/fuentes.json")) if os.path.exists("logos/fuentes.json") else {}
for brand, tries in BRANDS.items():
    if ONLY and brand not in ONLY:
        continue
    got = (FORCE[brand], None, "commons", FORCE[brand]) if brand in FORCE else None
    for site, title in ([] if got else tries):
        try:
            f, qid = logo_file(site, title)
        except Exception as e:  # noqa
            print(f"  {brand}: error {e!r}"); f = None
        if f:
            got = (f, qid, site, title); break
        time.sleep(0.5)
    if not got:
        # Plan B: buscar un archivo "<marca> logo" en Wikimedia Commons
        q = urllib.parse.urlencode({"action": "query", "list": "search", "srnamespace": 6, "srlimit": 5, "format": "json",
                                    "srsearch": SEARCH.get(brand, brand + " logo")})
        try:
            hits = [h["title"][5:] for h in get("https://commons.wikimedia.org/w/api.php?" + q)["query"]["search"]]
        except Exception as e:  # noqa
            hits = []
        hits = [h for h in hits if brand.lower()[:4] in h.lower() and "logo" in h.lower()]
        if hits:
            got = (hits[0], None, "commons-search", SEARCH.get(brand, brand + " logo"))
    if not got:
        print(f"{brand}: sin logo"); report[brand] = None; continue
    f, qid, site, title = got
    url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(f) + "?width=192"
    try:
        png = get(url, raw=True)
        path = f"logos/{slug(brand)}.png"
        open(path, "wb").write(png)
        report[brand] = {"file": path, "commons": f, "wikidata": qid, "bytes": len(png)}
        print(f"{brand}: {f} ({len(png)} bytes)")
    except Exception as e:  # noqa
        print(f"{brand}: no se pudo bajar {f}: {e!r}"); report[brand] = None
    time.sleep(0.5)
json.dump(report, open("logos/fuentes.json", "w"), ensure_ascii=False, indent=1)
