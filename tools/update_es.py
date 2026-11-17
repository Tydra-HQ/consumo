"""Descarga las estaciones de servicio de España con sus precios del día (Ministerio para la
Transición Ecológica, Geoportal de Gasolineras) y genera estaciones-ES.json para la app.
Lo ejecuta GitHub Actions todas las mañanas. Solo usa la biblioteca estándar de Python."""
import json, sys, unicodedata, urllib.request, datetime

URL = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/"
# combustibles de la app (en orden) -> campos posibles del ministerio
FUELS = [
    ("g95", ["Precio Gasolina 95 E5"]),
    ("g98", ["Precio Gasolina 98 E5"]),
    ("dsl", ["Precio Gasoleo A"]),
    ("dslp", ["Precio Gasoleo Premium"]),
    ("glp", ["Precio Gases licuados del petróleo"]),
]

def norm(s):
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower().strip()

def num(v, dec=3):
    v = (v or "").strip().replace(",", ".")
    try:
        return round(float(v), dec)
    except ValueError:
        return None

def title(s):
    s = " ".join((s or "").split()).title()
    for w in (" De ", " Del ", " La ", " Las ", " Los ", " Y ", " El "):
        s = s.replace(w, w.lower())
    return s

BRANDS = {"repsol": "Repsol", "cepsa": "Cepsa", "moeve": "Moeve", "bp": "BP", "shell": "Shell", "galp": "Galp",
          "petronor": "Petronor", "campsa": "Campsa", "ballenoil": "Ballenoil", "plenoil": "Plenoil",
          "petroprix": "Petroprix", "avia": "Avia", "carrefour": "Carrefour", "alcampo": "Alcampo",
          "eroski": "Eroski", "disa": "Disa", "meroil": "Meroil"}

def brand(rotulo):
    n = norm(rotulo)
    for k, v in BRANDS.items():
        if n.startswith(k):
            return v
    return title(rotulo)[:24] or "Otra"

def main(out):
    req = urllib.request.Request(URL, headers={"Accept": "application/json", "User-Agent": "MiConsumo/1.0 (+https://tydra-hq.github.io/consumo/)"})
    raw = urllib.request.urlopen(req, timeout=120).read().decode("utf-8-sig")
    data = json.loads(raw)
    lista = data.get("ListaEESSPrecio") or []
    if len(lista) < 5000:  # protección: si el servicio devuelve algo raro, no pisar el archivo bueno
        sys.exit(f"Respuesta sospechosa: {len(lista)} estaciones")
    keymap = {norm(k): k for k in lista[0].keys()}
    def get(e, *names):
        for n in names:
            k = keymap.get(norm(n))
            if k and e.get(k) not in (None, ""):
                return e[k]
        return ""
    rows = []
    for e in lista:
        lat, lon = num(get(e, "Latitud"), 5), num(get(e, "Longitud (WGS84)", "Longitud"), 5)
        if lat is None or lon is None:
            continue
        prices = [num(get(e, *f[1])) for f in FUELS]
        rows.append(["es-" + str(get(e, "IDEESS")), brand(get(e, "Rótulo")), title(get(e, "Dirección")),
                     title(get(e, "Localidad", "Municipio")), title(get(e, "Provincia")), round(lat, 5), round(lon, 5), prices])
    fecha = data.get("Fecha", "")
    out_obj = {"version": datetime.date.today().isoformat(), "pricesDate": fecha, "country": "ES", "currency": "EUR",
               "fuels": [f[0] for f in FUELS], "fields": ["id", "brand", "address", "city", "province", "lat", "lon", "prices"], "rows": rows}
    with open(out, "w", encoding="utf-8") as f:
        json.dump(out_obj, f, ensure_ascii=False, separators=(",", ":"))
    print(f"OK: {len(rows)} estaciones, precios del {fecha}")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "estaciones-ES.json")
