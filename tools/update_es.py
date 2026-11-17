"""Descarga las estaciones de servicio de España con sus precios del día (Ministerio para la
Transición Ecológica, Geoportal de Gasolineras) y genera estaciones-ES.json para la app.
Lo ejecuta GitHub Actions todas las mañanas. Solo usa la biblioteca estándar de Python."""
import json, ssl, sys, unicodedata, urllib.request, datetime

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
          "eroski": "Eroski", "disa": "Disa", "meroil": "Meroil", "plenergy": "Plenergy", "q8": "Q8", "esclatoil": "Esclatoil"}

def in_spain(lat, lon):  # península + Baleares, Canarias, Ceuta y Melilla: descarta coordenadas erróneas
    return ((35.8 < lat < 43.9 and -9.5 < lon < 4.4) or (27.5 < lat < 29.5 and -18.3 < lon < -13.3)
            or (35.1 < lat < 35.95 and -5.5 < lon < -2.8))

def brand(rotulo):
    n = norm(rotulo)
    if not n or n.startswith("n") and any(ch.isdigit() for ch in n[:6]) or n[0].isdigit() or n in ("sin rotulo", "s/r"):
        return "Independiente"
    for k, v in BRANDS.items():
        if n.startswith(k):
            return v
    return title(rotulo)[:24] or "Otra"

def fixed_context():
    """El servidor del ministerio no envía el certificado intermedio (los navegadores lo buscan solos; Python no).
    Lo descargamos desde la dirección que indica el propio certificado (AIA) y lo agregamos a los de confianza."""
    from cryptography import x509
    from cryptography.x509.oid import AuthorityInformationAccessOID, ExtensionOID
    from cryptography.hazmat.primitives.serialization import Encoding
    import certifi
    host = URL.split("/")[2]
    leaf = x509.load_pem_x509_certificate(ssl.get_server_certificate((host, 443)).encode())
    aia = leaf.extensions.get_extension_for_oid(ExtensionOID.AUTHORITY_INFORMATION_ACCESS).value
    ctx = ssl.create_default_context(cafile=certifi.where())
    for d in aia:
        if d.access_method == AuthorityInformationAccessOID.CA_ISSUERS:
            der = urllib.request.urlopen(d.access_location.value, timeout=60).read()
            try:
                cert = x509.load_der_x509_certificate(der)
            except ValueError:
                cert = x509.load_pem_x509_certificate(der)
            ctx.load_verify_locations(cadata=cert.public_bytes(Encoding.PEM).decode())
            print("Certificado intermedio agregado:", cert.subject.rfc4514_string())
    return ctx

def legacy_context(base=None):
    """Algunos servidores públicos solo aceptan configuraciones TLS antiguas que OpenSSL 3 rechaza por defecto."""
    ctx = base or ssl.create_default_context()
    ctx.set_ciphers("DEFAULT:@SECLEVEL=1")
    ctx.options |= getattr(ssl, "OP_LEGACY_SERVER_CONNECT", 0x4)
    ctx.minimum_version = ssl.TLSVersion.TLSv1_2
    return ctx

def fetch():
    req = urllib.request.Request(URL, headers={"Accept": "application/json", "User-Agent": "Mozilla/5.0 (compatible; MiConsumo/1.0; +https://tydra-hq.github.io/consumo/)"})
    tries = [("normal", lambda: None), ("TLS compatible", legacy_context)]
    errors = []
    for name, mk in tries:
        try:
            ctx = mk()
            return urllib.request.urlopen(req, timeout=180, **({"context": ctx} if ctx else {})).read()
        except urllib.error.URLError as e:
            errors.append(f"{name}: {e.reason}")
            if isinstance(getattr(e, "reason", None), ssl.SSLCertVerificationError):
                try:
                    return urllib.request.urlopen(req, timeout=180, context=legacy_context(fixed_context())).read()
                except Exception as e2:
                    errors.append(f"cadena completa: {e2}")
    raise RuntimeError(" | ".join(errors))

def main(out):
    try:
        raw = fetch().decode("utf-8-sig")
    except Exception as e:  # el error queda visible como anotación en GitHub
        print(f"::error::No se pudo descargar: {type(e).__name__}: {e}")
        raise
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
    rows, skipped = [], 0
    for e in lista:
        lat, lon = num(get(e, "Latitud"), 5), num(get(e, "Longitud (WGS84)", "Longitud"), 5)
        if lat is None or lon is None or not in_spain(lat, lon):
            skipped += 1
            continue
        prices = [num(get(e, *f[1])) for f in FUELS]
        rows.append(["es-" + str(get(e, "IDEESS")), brand(get(e, "Rótulo")), title(get(e, "Dirección")),
                     title(get(e, "Localidad", "Municipio")), title(get(e, "Provincia")), round(lat, 5), round(lon, 5), prices])
    fecha = data.get("Fecha", "")
    out_obj = {"version": datetime.date.today().isoformat(), "pricesDate": fecha, "country": "ES", "currency": "EUR",
               "fuels": [f[0] for f in FUELS], "fields": ["id", "brand", "address", "city", "province", "lat", "lon", "prices"], "rows": rows}
    with open(out, "w", encoding="utf-8") as f:
        json.dump(out_obj, f, ensure_ascii=False, separators=(",", ":"))
    print(f"OK: {len(rows)} estaciones ({skipped} descartadas por coordenadas), precios del {fecha}")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "estaciones-ES.json")
