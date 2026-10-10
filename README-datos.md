# Contrato de datos — Alertas Perú (demo)

El app es estático (GitHub Pages, sin build). `js/app.js` consume tres archivos
JSON vía `fetch()` desde `data/`. Reemplazar los archivos de EJEMPLO por los
datos oficiales manteniendo EXACTAMENTE estas claves.

Reglas:
- Valores numéricos como número (no string). Usar `null` cuando no haya dato (el app muestra "—" / "s/d").
- `fuente_url` por fila siempre que sea posible (cada cifra debe poder enlazar su fuente).
- `departamento` debe coincidir con los 25 departamentos del Perú. El app normaliza
  (minúsculas, sin tildes) para cruzar con las capitales en `CAPITALES` dentro de `app.js`.
  Nombres compuestos esperados: "La Libertad", "Madre de Dios", "San Martín".

---

## data/dit.json — Desarrollo Infantil Temprano

```jsonc
{
  "meta": {
    "titulo": "string",
    "anio": "string",            // se muestra en "Actualizado: ..."
    "fuente": "string",          // etiqueta del enlace de fuente
    "fuentes_url": ["string"]    // primer item = enlace principal
  },
  "nacional": {
    "anemia": 43.6,              // % anemia infantil (6-35 meses)
    "dci": 11.7,                 // % desnutrición crónica (<5 años)
    "bajo_peso": 8.2             // % bajo peso al nacer
  },
  "departamentos": [
    {
      "departamento": "Puno",
      "anemia": 69.0,
      "dci": 13.5,
      "bajo_peso": 11.1,
      "fuente_url": "https://..."
    }
    // ... idealmente los 25 departamentos
  ]
}
```

Uso en el app:
- KPIs nacionales (anemia, dci, bajo_peso) con semáforo.
- Mapa: marcador por capital, color/tamaño según `anemia`.
- Ranking: ordenado desc. por `anemia`.
- "Mapa de la distancia": brecha de `anemia` de cada depto. vs. un referente
  (selector: "Mejor del país" o un departamento, p.ej. Lima).

Umbrales del semáforo (editables en `UMBRALES` dentro de `app.js`):
- anemia: crítico ≥ 40, alerta ≥ 25
- dci: crítico ≥ 20, alerta ≥ 12
- bajo_peso: crítico ≥ 10, alerta ≥ 7

---

## data/nino.json — Fenómeno El Niño

```jsonc
{
  "meta": { "titulo": "string", "anio": "string", "fuente": "string", "fuentes_url": ["string"] },
  "estado_actual": {
    "condicion": "string",           // ej. "Condiciones neutras..."
    "alerta_enfen": "string",        // ej. "Vigilancia" | "Alerta amarilla" | "Alerta roja"
    "pronostico_verano": "string",
    "fuente_url": "https://..."
  },
  "regiones_riesgo": [
    { "region": "Piura", "riesgo": "string", "nivel": "Alto|Medio|Bajo", "fuente_url": "https://..." }
  ],
  "antecedentes": [
    { "evento": "El Niño Costero 2017", "impacto": "string", "fuente_url": "https://..." }
  ]
}
```

Uso: tarjeta de estado actual (chip según `alerta_enfen`: "roj*"→crítico,
"amar*"/"vigil*"→alerta), tabla de regiones (chip según `nivel`), timeline de antecedentes.

---

## data/glaciares.json — Lagunas glaciares peligrosas

```jsonc
{
  "meta": { "titulo": "string", "anio": "string", "fuente": "string", "fuentes_url": ["string"] },
  "resumen": {
    "lagunas_peligrosas": 201,       // total priorizadas
    "lagunas_con_sensores": 24       // con monitoreo; el app calcula "sin monitoreo" = total - con_sensores
  },
  "por_region": [
    { "region": "Áncash", "lagunas_peligrosas": 96, "con_sensores": 14 }
  ],
  "antecedentes": [
    { "anio": 1941, "lugar": "Huaraz (Áncash)", "evento": "string", "victimas": "miles|null" }
  ]
}
```

Uso: 3 KPIs (peligrosas / con monitoreo / sin monitoreo), gráfico apilado por
región (con vs sin monitoreo), timeline de aluviones.

---

## CDNs usados

- **Leaflet 1.9.4** (mapa) — `https://unpkg.com/leaflet@1.9.4/dist/leaflet.{css,js}` con SRI.
  - CSS integrity: `sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=`
  - JS integrity: `sha256-20nQCchB9co0qIjJ4iI8iD+xeBuj9hJX1j/T+D1r3V6s=`  ← **VERIFICAR** antes de producción.
- **Chart.js 4.4.1** (gráficos) — `https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`
  - **TODO SRI**: falta añadir `integrity="sha384-..."` + `crossorigin="anonymous"` (team-lead).
- Tiles del mapa: CARTO dark basemap (`basemaps.cartocdn.com`).
- Fuente Inter: Google Fonts.

## TODO (para el team-lead)

1. **SRI**: completar el hash de Chart.js y verificar el de Leaflet JS.
2. **GeoJSON real**: reemplazar los marcadores por polígonos departamentales.
   Punto de inyección marcado en `app.js` → `renderDITMap()` ("PLACEHOLDER GeoJSON").
3. **Datos reales**: reemplazar `data/*.json` (vienen de los otros agentes:
   alertas-dit, alertas-nino, alertas-glaciares). Mantener el contrato de arriba.
4. Ajustar `UMBRALES` según criterios oficiales si corresponde.
