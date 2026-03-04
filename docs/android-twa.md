# Android (TWA)

## Resumen
El frontend incluye `manifest.webmanifest`, `sw.js` y `assetlinks.json` para ser instalable como PWA y empaquetable como Trusted Web Activity (TWA).

## Requisitos
- JDK 17+.
- Android SDK (platform-tools y build-tools).
- Node.js.
- Dominio con HTTPS para el `manifest.webmanifest`.

## Pasos basicos
1. Compilar el frontend.
```bash
cd frontend
npm install
npm run build
```

2. Actualizar `frontend/public/.well-known/assetlinks.json` con tu `package_name` y el SHA-256 del certificado.

3. Generar el proyecto Android y APK con Bubblewrap.
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://TU_DOMINIO/manifest.webmanifest
bubblewrap build
```

## Artefactos
- El APK queda en `app/build/outputs/apk/release/` dentro del proyecto generado por Bubblewrap.
- En este repo existen ejemplos de artefactos de salida (`app-release-*.apk`, `app-release-bundle.aab`).

## Notas
- El archivo `twa-manifest.json` en la raiz puede usarse como base para Bubblewrap.
- Asegura que el dominio HTTPS sirva `/.well-known/assetlinks.json`.
