# Alertas Perú — demo

**Prototipo** de tablero de alertas para la toma de decisiones del Estado peruano. Muestra pocas **señales clave** que "chocan el día a día", con datos oficiales y su fuente. No reemplaza los sistemas oficiales de alerta (SENAMHI / INDECI-SINAGERD / INAIGEM).

**En vivo:** https://unimauro.github.io/alertas-peru/

## Módulos

1. **Desarrollo Infantil Temprano** — anemia (6–35 meses), desnutrición crónica y bajo peso al nacer por departamento (INEI-ENDES 2024), con mapa, ranking, semáforo de alerta y un **"mapa de la distancia"** (brecha de cada departamento frente a un referente, p. ej. Lima o el mejor del país).
2. **Fenómeno El Niño** — estado actual del ENOS según el ENFEN, regiones en riesgo y antecedentes (1982-83, 1997-98, Niño Costero 2017).
3. **Lagunas glaciares peligrosas** — inventario INAIGEM: 8,466 lagunas de origen glaciar, 152 de riesgo elevado y solo 3 con monitoreo en tiempo real; antecedentes de aluviones (Huaraz 1941, Yungay 1970).

## Datos (fuentes oficiales, sin cifras inventadas)

- **DIT:** INEI — ENDES 2024, Indicadores de Resultados de los Programas Presupuestales (cuadros 04A, 06A/6.1A, 09A). Anemia en dos definiciones: RM 363-2022 (nacional 43.7%) y OMS 2024 / RM 251-2024 (35.3%).
- **El Niño:** Comisión Multisectorial ENFEN (IMARPE/SENAMHI/IGP), comunicados oficiales.
- **Glaciares:** INAIGEM/MINAM — Inventario Nacional de Glaciares (INGLOG 2023) y Evaluación Nacional de Lagunas Glaciares con Riesgo de Desborde 2024.

Cada cifra enlaza a su fuente. Lo no publicado oficialmente se marca `s/d` (no se interpola ni inventa).

## Stack

Estático (GitHub Pages): HTML + CSS + JavaScript vanilla. Leaflet 1.9.4 y Chart.js 4.4.1 por CDN con SRI. Sin build.

```bash
# correr local (fetch requiere servidor, no file://)
python3 -m http.server 8770   # luego http://127.0.0.1:8770
```

## Roadmap

- GeoJSON de departamentos (hoy marcadores por capital).
- Alertas por correo (suscripción) — sustentable a bajo volumen.
- Fenómeno El Niño: ingesta de avisos SENAMHI / comunicados ENFEN (hoy sin API REST oficial → requiere convenio para tiempo real).
- Desarrollo infantil: bajar a provincia/distrito.
- Glaciares: integrar el monitoreo de lagunas de muy alto riesgo.

---

*Prototipo demostrativo · Comisión del CIP · datos oficiales con fuente. No es una fuente oficial de alerta.*
