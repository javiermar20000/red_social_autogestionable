# Android (TWA)

## Resumen
El frontend incluye `manifest.webmanifest`, `sw.js` y `assetlinks.json` para ser instalable como PWA/TWA. Para generar un APK se utiliza Bubblewrap.

## Requisitos
- JDK 17+
- Android SDK (platform-tools y build-tools)
- Node.js

## Pasos
1) Compilar el frontend:
```bash
cd frontend
npm install
npm run build
```

2) Actualizar `frontend/public/.well-known/assetlinks.json` con el `package_name` y el SHA-256 del certificado.

3) Generar el proyecto Android y APK:
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://TU_DOMINIO/manifest.webmanifest
bubblewrap build
```

## Notas
- El APK queda en el proyecto generado por Bubblewrap, en `app/build/outputs/apk/release/`.
