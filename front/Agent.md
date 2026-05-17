# CirujAR Frontend - Documentación de Agente

## 📱 Visión General

**Proyecto**: CirujAR - Aplicación móvil React Native (Expo) para publicar y explorar objetos de calle.
**Framework**: React Native + Expo SDK 54.0.33
**Routing**: expo-router (file-based routing)
**Persistencia**: AsyncStorage (JWT token + user data)
**Autenticación**: JWT tokens + OAuth flow
**Backend**: Express.js + MongoDB (endpoints en `/api`)

---

## 🏗️ Arquitectura y Estructura

```
front/
├── app/                    # Rutas principales (expo-router)
│   ├── _layout.tsx        # Root layout - AUTH GUARD
│   ├── index.tsx          # Entry point (redirección)
│   ├── login.tsx          # Pantalla de login (redesignada)
│   ├── register.tsx       # Pantalla de registro
│   ├── add-post.tsx       # Crear publicación
│   ├── modal.tsx          # Modal overlay
│   ├── (tabs)/            # Stack con tabs navigation
│   │   ├── _layout.tsx    # Floating tab navigation premium (Home + Profile center action)
│   │   ├── home.jsx       # Feed de productos (grid 3 col)
│   │   └── profile.tsx    # Perfil usuario (CONTROL PRINCIPAL)
│   ├── edit/              # Stack dinámico
│   │   └── [id].tsx       # Editar producto por ID
│   └── product/           # Stack dinámico
│       └── [id].tsx       # Detalles producto por ID
│
├── _services/             # Lógica de negocio
│   ├── api.ts            # Llamadas HTTP (base + endpoints)
│   └── authToken.ts      # Gestión JWT + user data (CRÍTICO)
│
├── _config.js            # Config constants
├── _constants.ts         # TypeScript constants
├── _models.ts            # Type definitions (ApiUser, Product, etc)
├── constants/
│   └── theme.ts          # Colores y estilos globales
│
├── hooks/                # Custom React hooks
│   ├── use-color-scheme.ts
│   ├── use-color-scheme.web.ts
│   └── use-theme-color.ts
│
└── components/           # UI components
    ├── themed-*.tsx
    ├── external-link.tsx
    ├── haptic-tab.tsx
    ├── parallax-scroll-view.tsx
    └── ui/
        └── collapsible.tsx
```

---

## 🔐 Flujo de Autenticación

### 1. **Entrada Inicial (app/index.tsx)**
```
App inicia → index.tsx ejecuta async check de token
├─ Si token existe → redirect a "/(tabs)/home" (autenticado)
└─ Si no existe → redirect a "/login" (público)
```

### 2. **Root Guard (app/_layout.tsx)**
```
Cada navegación es interceptada por ROOT LAYOUT
├─ Si está en PUBLIC_ROUTES (['/login', '/register']) → permite
├─ Si tiene token válido → permite acceso a rutas protegidas
└─ Si no tiene token y NO está en pública → redirige a "/login"
```

### 3. **Login (app/login.tsx)**
```
Usuario ingresa email + password
  ↓
loginUser(email, password) → Backend POST /api/auth/login
  ↓
Backend retorna { token: JWT, user: ApiUser }
  ↓
setStoredToken(token) → AsyncStorage guarda JWT
  ↓
setStoredUser(user) → AsyncStorage guarda objeto usuario
  ↓
redirect "/(tabs)/home" → entra al tab navigation
```

### 4. **Tab Navigation (app/(tabs)/_layout.tsx)**
```
Dos tabs disponibles:
├─ Tab 1: "home" (icon: home-outline, lado izquierdo) → app/(tabs)/home.jsx
└─ Tab 2: "profile" (icon: person-outline, botón central elevado) → app/(tabs)/profile.tsx
```

---

## 📋 Componentes Principales

### **app/(tabs)/profile.tsx** - COMPONENTE CRÍTICO
**Propósito**: Mostrar perfil del usuario autenticado

**Estados**:
- `user`: ApiUser | null (datos usuario actual)
- `loading`: boolean (estado inicial mientras carga)
- `error`: string | null (errores en recuperación de datos)

**Ciclo de vida**:
1. `useFocusEffect()` se trigger cada vez que el tab es enfocado
2. Intenta recuperar usuario de AsyncStorage: `getStoredUser()`
3. Si no encuentra usuario pero hay token → fetch backend: `GET /api/users/:id`
4. Si no hay token → redirige a "/login"
5. Si hay error → muestra error UI + botón "Ir a Login"

**Funciones clave**:
```typescript
// Llamada al montar/enfocar
useFocusEffect(useCallback(() => {
  // 1. Lee AsyncStorage
  let storedUser = await getStoredUser();
  
  // 2. Si vacío, intenta fetch del backend
  if (!storedUser && token) {
    // Extrae userId del token JWT (decodificación)
    // Llamada: GET /api/users/:userId con headers auth
  }
  
  // 3. Renderiza según estado
}))

// Logout
const handleLogout = () => {
  clearAuth();  // Limpia token + user de AsyncStorage
  router.replace('/login');
}
```

**UI/UX**:
- Avatar: círculo azul 120px con icono persona
- Información: nombre, email, stats (publicaciones, seguidores, siguiendo)
- Card design: fondo blanco, sombra sutil, border radio
- Animaciones: scale entrada avatar, slide entrada contenido
- Botón Logout: gradiente azul, animación de presión

**Errores que maneja**:
- ✅ Usuario no encontrado en AsyncStorage
- ✅ Token expirado/inválido → redirige a login
- ✅ Error en fetch backend → muestra mensaje de error
- ✅ Sin token → redirige a login inmediatamente

---

### **app/login.tsx** - Pantalla de Login
**Propósito**: Autenticación de usuario

**Diseño**:
- Logo split: "Ciruj" (gris/oscuro) + "AR" (azul #2f89ff)
- Inputs: border azul redondeado, icono inline
- Validación inline: errores en rojo suave (#d4535f)
- Botón: gradiente azul (#1d63d8 → #2f89ff), animación scale en press

**Funciones**:
```typescript
const handleLogin = async () => {
  // 1. Validación: email + password requeridos
  
  // 2. Llamada: loginUser(email, password)
  //    POST /api/auth/login → { token, user }
  
  // 3. Guardado de datos:
  //    - setStoredToken(token)
  //    - setStoredUser(user)
  
  // 4. Redirección: router.replace('/(tabs)/home')
}
```

**Estados de validación**:
- Email vacío → "Email requerido"
- Password vacío → "Contraseña requerida"
- Email inválido → "Email inválido"
- Error backend → muestra mensaje del servidor

### **app/register.tsx** - Pantalla de Registro
**Propósito**: Alta de usuario

**Diseño**:
- Unificado con login: mismos blobs de fondo, card blanca, tipografía y jerarquía visual
- Inputs con íconos inline, bordes azules redondeados y errores inline en rojo suave
- Botón principal con gradiente azul y microinteracción de escala
- Logo y animaciones de entrada consistentes con login

**Flujo**:
- Validación de alias/email/contraseña
- `registerUser(...)` al backend
- Redirección a `/login` al registrarse correctamente

---

### **app/(tabs)/home.jsx** - Feed de Productos
**Propósito**: Mostrar grid de publicaciones (productos)

**Funcionalidad**:
```typescript
// 1. fetchProducts() → GET /api/products (todas las publicaciones)
//
// 2. Mapea a formato de UI: mapProductToPost()
//    Product → { id, image, title, description, location, time }
//
// 3. FlatList 3 columnas (scrollVertical)
//
// 4. Botón "Crear publicación" → navigate a "/add-post"
```

**Componentes en grid**:
- Imagen del producto
- Título + descripción (truncada)
- Ubicación + tiempo relativo
- Presión → navega a `/product/[id]`

---

### **app/(tabs)/_layout.tsx** - Tab Navigation
**Propósito**: Estructura de navegación con 2 tabs

```typescript
export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" ... />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" ... />
        }}
      />
    </Tabs>
  );
}
```

**Estilos**:
- Barra flotante con bordes muy redondeados (look iOS premium)
- Fondo claro con estilo glassmorphism suave (`rgba(248, 251, 255, 0.94)`)
- Sombras modernas para efecto de profundidad y estética tecnológica
- Solo 2 iconos visibles, sin labels (`tabBarShowLabel: false`)
- Home minimalista en la izquierda dentro de cápsula suave
- Botón de Profile central elevado, circular y más grande, color azul principal
- Estado activo con realce vertical: el tab seleccionado sobresale hacia arriba
- Microinteracciones: escalado suave + elevación para Home activo; glow, escala y elevación para Profile activo

---

### **app/index.tsx** - Entry Point
**Propósito**: Redirección inicial según estado de auth

```typescript
const [destination, setDestination] = useState<'/(tabs)/home' | '/login' | null>(null);

useEffect(() => {
  getStoredToken().then(token => {
    setDestination(token ? '/(tabs)/home' : '/login');
  });
}, []);

// Mientras destination es null → muestra LoadingIndicator
// Una vez resuelve → router.replace(destination)
```

---

### **app/_layout.tsx** - Root Layout (AUTH GUARD)
**Propósito**: Guardia de rutas global

```typescript
const pathname = usePathname();
const [isReady, setIsReady] = useState(false);
const [isSignedIn, setIsSignedIn] = useState(false);

const PUBLIC_ROUTES = ['/login', '/register'];

// 1. En mount: verifica token
useEffect(() => {
  getStoredToken().then(token => {
    setIsSignedIn(!!token);
    setIsReady(true);
  });
}, []);

// 2. Si no está listo → muestra LoadingIndicator
if (!isReady) return <LoadingIndicator />;

// 3. Si NO autenticado Y NO en ruta pública → redirige a login
if (!isSignedIn && !PUBLIC_ROUTES.includes(pathname)) {
  // Redirige a /login
}

// 4. Si autenticado Y en ruta pública → redirige a home
if (isSignedIn && PUBLIC_ROUTES.includes(pathname)) {
  // Redirige a /(tabs)/home
}
```

---

## 🔌 Servicios (_services/)

### **authToken.ts** - Gestión de Autenticación
**Archivo crítico para persistencia de datos**

```typescript
// ✅ GET TOKEN
export const getStoredToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('cirujar_auth_token');
    console.log('[getStoredToken] Token:', token ? 'found' : 'null');
    return token;
  } catch {
    return null;
  }
}

// ✅ SET TOKEN
export const setStoredToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('cirujar_auth_token', token);
    console.log('[setStoredToken] Token saved successfully');
  } catch (error) {
    console.error('[setStoredToken] Error:', error);
  }
}

// ✅ CLEAR TOKEN
export const clearStoredToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('cirujar_auth_token');
  } catch {
    // ignore
  }
}

// ✅ GET USER (IMPORTANTE)
export const getStoredUser = async (): Promise<ApiUser | null> => {
  try {
    const json = await AsyncStorage.getItem('cirujar_auth_user');
    console.log('[getStoredUser] Retrieved JSON:', json ? 'found' : 'null');
    if (!json) return null;
    
    const user = JSON.parse(json) as ApiUser;
    console.log('[getStoredUser] Parsed user:', user);
    return user;
  } catch (error) {
    console.error('[getStoredUser] Parse error:', error);
    return null;
  }
}

// ✅ SET USER (IMPORTANTE)
export const setStoredUser = async (user: ApiUser): Promise<void> => {
  try {
    const json = JSON.stringify(user);
    console.log('[setStoredUser] Saving user:', user);
    console.log('[setStoredUser] JSON string:', json);
    await AsyncStorage.setItem('cirujar_auth_user', json);
    console.log('[setStoredUser] User saved successfully');
  } catch (error) {
    console.error('[setStoredUser] Error:', error);
  }
}

// ✅ CLEAR AUTH (Logout)
export const clearAuth = async (): Promise<void> => {
  await clearStoredToken();
  await clearStoredUser();
}

// ✅ HEADERS CON BEARER TOKEN
export const getBearerAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getStoredToken();
  return {
    Authorization: `Bearer ${token || ''}`
  };
}
```

**Debugging**:
- Todos los métodos tienen `console.log()` para rastrear operaciones
- En `getStoredUser`: logs de JSON recuperado y objeto parseado
- En `setStoredUser`: logs del objeto guardado y string JSON

---

### **api.ts** - Llamadas HTTP
**Base URL y endpoints**

```typescript
import { API_URL } from '@/_config';

// ✅ LOGIN
export const loginUser = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  // Response: { token: JWT, user: ApiUser }
  return data;
}

// ✅ REGISTRO
export const registerUser = async (email: string, password: string, name: string) => {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  return response.json();
}

// ✅ GET USER BY ID
export const getUser = async (userId: string): Promise<ApiUser> => {
  const headers = await getBearerAuthHeaders();
  const response = await fetch(`${API_URL}/api/users/${userId}`, { headers });
  return response.json();
}

// ✅ FETCH PRODUCTS (Feed)
export const fetchProducts = async () => {
  const response = await fetch(`${API_URL}/api/products`);
  const data = await response.json();
  // Response: Product[]
  return data;
}

// ✅ CREATE PRODUCT
export const createProduct = async (payload: Omit<Product, 'id'>) => {
  const headers = await getBearerAuthHeaders();
  const response = await fetch(`${API_URL}/api/products`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return response.json();
}

// ✅ UPDATE PRODUCT
export const updateProduct = async (id: string, payload: Partial<Product>) => {
  const headers = await getBearerAuthHeaders();
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return response.json();
}

// ✅ DELETE PRODUCT
export const deleteProduct = async (id: string) => {
  const headers = await getBearerAuthHeaders();
  await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' });
}
```

**Tipos (en _models.ts)**:
```typescript
export interface ApiUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  createdAt: string;
  userId: string;
}

export interface LoginResponse {
  token: string;
  user: ApiUser;
}
```

---

## 💾 Persistencia y Estados

### **AsyncStorage Keys**:
```
'cirujar_auth_token'  → JWT string
'cirujar_auth_user'   → JSON stringified ApiUser object
```

### **Diagrama de Persistencia**:
```
Backend /api/auth/login
  ↓ Response: { token, user }
  ↓
setStoredToken(token)      → AsyncStorage 'cirujar_auth_token'
setStoredUser(user)        → AsyncStorage 'cirujar_auth_user'
  ↓
getStoredToken()           ← lee 'cirujar_auth_token'
getStoredUser()            ← lee 'cirujar_auth_user' (JSON.parse)
```

---

## 🔄 Flujos Principales

### **Flujo 1: Login → Home**
```
1. Usuario ve login.tsx (pantalla pública)
2. Ingresa email + password
3. handleLogin() → loginUser() → POST /api/auth/login
4. Backend retorna { token, user }
5. setStoredToken(token) + setStoredUser(user)
6. router.replace('/(tabs)/home')
7. Tab navigation renderiza Home + Profile tabs
8. Usuario ve grid de productos
```

### **Flujo 2: Home → Profile**
```
1. Usuario presiona tab "Perfil"
2. profile.tsx monta → useFocusEffect dispara
3. getStoredUser() → lee AsyncStorage 'cirujar_auth_user'
4. Si encontró user → renderiza perfil con datos
5. Si no encontró → intenta GET /api/users/:id (fallback)
6. Si error → muestra UI de error + botón "Ir a Login"
```

### **Flujo 3: Profile → Logout**
```
1. Usuario presiona botón "Cerrar Sesión"
2. handleLogout() → clearAuth()
3. clearAuth() → limpia token + user de AsyncStorage
4. router.replace('/login')
5. _layout.tsx detecta sin token → permite login.tsx
6. Usuario vuelve a pantalla de login
```

### **Flujo 4: Home → Crear Publicación**
```
1. Usuario presiona botón + en header de Home
2. router.push('/add-post')
3. add-post.tsx monta
4. Usuario rellena form (título, descripción, imagen)
5. handleSubmit() → createProduct(payload)
6. POST /api/products con headers auth
7. Éxito → router.back() vuelve a Home
8. Home re-renderiza con new product en feed
```

---

## 🎨 Estilos y Constantes

### **Colores Globales** (constants/theme.ts):
```typescript
export const COLORS = {
  primary: '#2a6fd6',      // Azul CirujAR
  primaryLight: '#2f89ff',
  primaryDark: '#1d63d8',
  secondary: '#f5a623',
  background: '#ffffff',
  surface: '#f9f9f9',
  error: '#d4535f',        // Rojo suave
  text: '#1a1a1a',
  textSecondary: '#666',
  border: '#e9f0fc'
}
```

### **Constantes** (_config.js):
```javascript
export const API_URL = 'http://localhost:3000'; // o tu IP/dominio
export const PAD = 24;                          // Padding estándar
export const BORDER_RADIUS = 12;                // Border radius
```

---

## 📱 Rutas Disponibles

```
PUBLIC (sin autenticación):
├─ /login           → app/login.tsx
└─ /register        → app/register.tsx

PROTECTED (requieren JWT):
├─ /(tabs)/home     → app/(tabs)/home.jsx (feed productos)
├─ /(tabs)/profile  → app/(tabs)/profile.tsx (perfil usuario)
├─ /add-post        → app/add-post.tsx (crear publicación)
├─ /product/[id]    → app/product/[id].tsx (detalle producto)
└─ /edit/[id]       → app/edit/[id].tsx (editar producto)

ROOT:
└─ /                → app/index.tsx (redirección)
```

---

## ⚡ Funciones Críticas para Recordar

| Función | Ubicación | Propósito |
|---------|-----------|----------|
| `getStoredToken()` | authToken.ts | Lee JWT de AsyncStorage |
| `setStoredToken(token)` | authToken.ts | Guarda JWT en AsyncStorage |
| `getStoredUser()` | authToken.ts | Lee usuario de AsyncStorage (JSON.parse) |
| `setStoredUser(user)` | authToken.ts | Guarda usuario en AsyncStorage (JSON.stringify) |
| `clearAuth()` | authToken.ts | Logout: limpia token + usuario |
| `loginUser(email, password)` | api.ts | POST /api/auth/login |
| `getUser(userId)` | api.ts | GET /api/users/:id (fallback en profile) |
| `fetchProducts()` | api.ts | GET /api/products (feed) |
| `createProduct(payload)` | api.ts | POST /api/products (nueva publicación) |
| `useFocusEffect()` en profile.tsx | profile.tsx | Trigger cuando tab Perfil es enfocado |
| `handleLogout()` en profile.tsx | profile.tsx | Logout + redirige a /login |

---

## 🚀 Backend Endpoints (No Modificar)

```
POST   /api/auth/login          → { email, password } → { token, user }
POST   /api/auth/register       → { email, password, name } → { token, user }
GET    /api/users/:id           → { headers: Authorization } → ApiUser
PATCH  /api/users/:id           → { updates } → ApiUser
GET    /api/products            → Product[]
POST   /api/products            → { title, description, image, location } → Product
PATCH  /api/products/:id        → { updates } → Product
DELETE /api/products/:id        → 204 No Content
```

---

## ✅ Incidencias Resueltas

### **Resuelto**: Profile mostraba "Cargando..." infinito
**Resultado actual**:
- ✅ Perfil funcional y estable en navegación por tabs
- ✅ Persistencia de usuario en AsyncStorage operativa
- ✅ Carga de perfil correcta al enfocar tab
- ✅ Manejo de error y fallback implementado

### **En progreso**: Upload de avatar en Profile
**Estado técnico actual**:
- ✅ Selección de imagen desde galería implementada
- ✅ Flujo de persistencia implementado: `POST /api/storage/imagen` + `PATCH /api/users/:id`
- ✅ Actualización local de estado y AsyncStorage implementada
- ✅ Transporte de multipart ajustado a Axios para mejorar compatibilidad en Expo/Android
- ✅ Ajuste Web: se envía `File` real del navegador (no descriptor `uri`) para evitar `No se recibió ningún archivo`
- ✅ Tabs muestran el avatar subido en el icono de Perfil y se refrescan al cambiar la foto
- ✅ Alias editable en Profile: lápiz habilita edición inline y check guarda en backend + AsyncStorage

---

## 📝 TODOs y Próximos Pasos

- [ ] **Validar AsyncStorage**: Correr app en emulador/device y revisar console logs
- [ ] **Stats en Profile**: Implementar conteos (publicaciones, seguidores, siguiendo) desde backend
- [x] **Avatar Upload**: Permitir usuario cambiar avatar (multipart form)
- [ ] **Edición Perfil**: Pantalla para editar nombre, email, bio
- [x] **Edición Perfil**: Alias editable inline en profile.tsx
- [ ] **Imagen Productos**: Implementar upload en add-post.tsx (camera/gallery)
- [ ] **Detalles Producto**: Completar product/[id].tsx con opciones editar/eliminar
- [ ] **Búsqueda**: Implementar filtro/búsqueda en home.jsx
- [ ] **Paginación**: Agregar infinite scroll o "Load More" en feed
- [ ] **Notificaciones**: Push notifications para likes, comments
- [ ] **Testing**: Tests unitarios para api.ts, authToken.ts
- [ ] **Manejo Errores**: Mejorar error boundaries y retry logic global

---

## 🔍 Cómo Retomar Este Proyecto

1. **Lee este archivo** primero para contexto arquitectónico
2. **Revisa app/_layout.tsx** para entender guard de rutas
3. **Ve a app/(tabs)/profile.tsx** si trabajas en perfil/auth
4. **Ve a _services/authToken.ts** si trabajas en persistencia
5. **Ve a _services/api.ts** si agregas nuevos endpoints
6. **Verifica los console.log()** para debugging

### Comandos útiles de arranque (Expo)
- `npm run start:tunnel`: recomendado para probar en celular físico con Expo Go cuando LAN falla
- `npm run start:lan`: usar solo si PC y celular están en la misma Wi-Fi sin VPN/datos móviles

### Error frecuente en Expo Go
**Mensaje**: `Uncaught Error: java.io.IOException: Failed to download remote update`

**Causa típica**:
- Expo Go no logra descargar el bundle JS desde el host local (red, firewall o modo LAN)

**Resolución recomendada**:
1. Cerrar Expo Go
2. Ejecutar `npm run start:tunnel`
3. Escanear el nuevo QR en Expo Go
4. Si persiste: actualizar Expo Go desde Play Store y limpiar cache de la app

---

**Última Actualización**: 17 Mayo 2026 (estilo de register unificado con login)  
**Estado**: Autenticación + Login/Register visualmente unificados + Profile estable + Avatar upload + Alias editable + Avatar visible en tabs + Feed + Tab bar premium flotante implementados  
**Próximo Check**: Validación E2E de subida de avatar en Expo Go (dispositivo físico)
