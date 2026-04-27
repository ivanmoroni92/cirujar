# Proyecto Cirujar

Este es el repo del proyecto Cirujar. Tiene el front hecho con React Native (Expo) y el back con Node.js y Express.

## Requisito súper importante
**Necesitás Node.js v20 o superior.** Si usás `nvm`, corré esto:
```bash
nvm install 20
nvm use 20
```

## Cómo levantar el proyecto localmente

Simplemente párate en la carpeta del proyecto (`cirujar/`), abrí dos terminales y corré:

**En la Terminal 1 (Backend):**
```bash
npm run dev:back
```
Esto levanta el servidor de Node.

**En la Terminal 2 (Frontend):**
```bash
npm run start:front
```
Esto levanta Expo. Te va a mostrar un QR en la consola que podés escanear con el celu, o podés apretar la `a` para abrirlo en el emulador.

¡Y listo!