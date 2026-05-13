# Guía de Despliegue — daval-app

Stack: React/Vite → Vercel · Node/Express → Railway (o Render) · PostgreSQL → Supabase

---

## Arquitectura de producción

```
Browser
  └─→ Vercel (frontend estático — React/Vite)
          │  VITE_API_URL
          └─→ Railway / Render (API Express — puerto dinámico)
                    │  DATABASE_URL (SSL)
                    └─→ Supabase PostgreSQL
```

---

## 1. Supabase — base de datos

### 1.1 Obtener la cadena de conexión

1. Ir a **Project Settings → Database → Connection string → URI**
2. Seleccionar modo **"Session mode" (puerto 5432)** — NO usar el pooler 6543 con `pg.Pool` propio
3. Copiar la URL. Tendrá este formato:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 1.2 Ejecutar migraciones

Desde la carpeta raíz del proyecto:

```bash
# Requiere psql instalado localmente o usar la SQL Editor de Supabase
psql "$DATABASE_URL" -f database/migrations/001_initial.sql
psql "$DATABASE_URL" -f database/migrations/002_siigo.sql
psql "$DATABASE_URL" -f database/migrations/003_promotions.sql
psql "$DATABASE_URL" -f database/migrations/004_routes.sql
psql "$DATABASE_URL" -f database/migrations/005_uploads.sql
```

O pegar cada archivo en **Supabase → SQL Editor** y ejecutar en orden.

### 1.3 Configuración de seguridad en Supabase

- **Row Level Security (RLS)**: Deshabilitarlo en todas las tablas si no lo usas — la API ya controla acceso con JWT propio.
- **Pooler**: No usar. El servidor Express tiene su propio `pg.Pool`.
- **SSL**: Ya habilitado en `db.js` con `rejectUnauthorized: false`.

---

## 2. Backend — Railway

### 2.1 Crear proyecto en Railway

```bash
# Instalar CLI (opcional)
npm install -g @railway/cli
railway login
railway init      # dentro de la carpeta raíz
railway up        # primer deploy
```

O desde el dashboard: **New Project → Deploy from GitHub repo**.

### 2.2 Variables de entorno en Railway

En **Settings → Variables**, agregar:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `TZ` | `America/Bogota` |
| `PORT` | (Railway lo inyecta automáticamente — no configurar) |
| `DATABASE_URL` | URL de Supabase (paso 1.1) |
| `JWT_SECRET` | Generar: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Generar: `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `8h` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `CORS_ORIGIN` | URL de Vercel (se obtiene en paso 3) |

### 2.3 Verificar deploy

```bash
curl https://[tu-api].up.railway.app/health
# Esperado: {"ok":true,"ts":"...","db":"connected"}
```

---

## 3. Frontend — Vercel

### 3.1 Importar proyecto

1. Ir a [vercel.com](https://vercel.com) → **New Project → Import Git Repository**
2. Seleccionar este repositorio
3. Framework: **Vite** (Vercel lo detecta automáticamente)
4. Root Directory: **dejar vacío** (la raíz tiene `vite.config.js`)

### 3.2 Variable de entorno en Vercel

En **Settings → Environment Variables**:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | URL del backend Railway, ej: `https://daval-api.up.railway.app` |

> **Importante**: `VITE_API_URL` se bake en el bundle al momento del build. Cualquier cambio requiere re-deploy del frontend.

### 3.3 SPA routing

El archivo `vercel.json` ya está configurado para redirigir todas las rutas a `index.html`. No requiere acción adicional.

### 3.4 Actualizar CORS en Railway

Una vez obtenida la URL de Vercel (ej: `https://daval-app.vercel.app`), actualizar la variable `CORS_ORIGIN` en Railway:

```
CORS_ORIGIN=https://daval-app.vercel.app
```

Si tienes dominio propio:
```
CORS_ORIGIN=https://daval-app.vercel.app,https://tudominio.com
```

---

## 4. Alternativa — Backend en Render

Si prefieres Render sobre Railway:

1. En Render: **New → Web Service → Connect GitHub**
2. Root Directory: `api`
3. Build Command: `npm install`
4. Start Command: `node src/index.js`
5. Agregar las mismas variables de entorno del paso 2.2

El archivo `render.yaml` en la raíz automatiza esta configuración si usas **Blueprint**.

---

## 5. Checklist de despliegue

### Antes de deploy

- [ ] Migraciones ejecutadas en Supabase
- [ ] `DATABASE_URL` probada localmente (`node -e "import('./api/src/config/db.js').then(m => m.query('SELECT 1')).then(console.log)"`)
- [ ] `JWT_SECRET` y `JWT_REFRESH_SECRET` generados con `openssl rand -base64 32`
- [ ] `.env` no commiteado (verificar `.gitignore`)
- [ ] Sin credenciales hardcodeadas en el código

### Deploy backend

- [ ] Build sin errores en Railway/Render
- [ ] `/health` responde `{"ok":true,"db":"connected"}`
- [ ] `POST /auth/login` funciona con usuario de prueba
- [ ] Endpoints `/auth/debug/*` retornan 404 (bloqueados en producción)

### Deploy frontend

- [ ] `VITE_API_URL` apunta al backend de producción
- [ ] Build sin errores en Vercel
- [ ] Login funciona desde la URL de Vercel
- [ ] CORS configurado en el backend con la URL de Vercel

### Post-deploy

- [ ] Rutas del SPA (ej: `/admin`, `/quotations/123`) funcionan al recargar
- [ ] Imágenes de productos cargan desde `/uploads/*`
- [ ] Integración SIIGO funciona (si aplica)

---

## 6. Variables de entorno — resumen completo

### `api/.env` (backend)

```env
PORT=3000
NODE_ENV=production
TZ=America/Bogota

DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

JWT_SECRET=[openssl rand -base64 32]
JWT_REFRESH_SECRET=[openssl rand -base64 32]
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=30d

CORS_ORIGIN=https://[tu-app].vercel.app
```

### `.env` (frontend)

```env
VITE_API_URL=https://[tu-api].up.railway.app
```

---

## 7. Desarrollo local con Supabase

Para desarrollar contra la BD de Supabase en lugar de PostgreSQL local:

```bash
# En api/.env, descomentar DATABASE_URL y comentar DB_HOST/DB_PORT/etc.
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Levantar solo el frontend + API (sin PostgreSQL local)
npm run dev:all
```

---

## 8. Seguridad — recomendaciones

| Riesgo | Acción |
|---|---|
| Secretos en git | Confirmar que `.env` y `api/.env` están en `.gitignore` |
| Debug endpoints abiertos | Ya bloqueados en `NODE_ENV=production` — verificar con `/auth/debug/hash` en prod (debe ser 404) |
| CORS wildcard | Nunca usar `CORS_ORIGIN=*` en producción |
| JWT secrets débiles | Usar `openssl rand -base64 32` — mínimo 32 bytes |
| Supabase RLS | Desactivar si toda la autorización es server-side |
| `rejectUnauthorized: false` | Necesario para Supabase/Railway — aceptable en producción con `pg` |

---

## 9. Comandos de referencia rápida

```bash
# Dev local completo
npm run dev:all

# Build frontend
npm run build

# Verificar build localmente
npm run preview

# Probar conexión a Supabase desde Node
node --input-type=module <<'EOF'
import 'dotenv/config';
import pool from './api/src/config/db.js';
const r = await pool.query('SELECT NOW() AS ts');
console.log('Conectado:', r.rows[0].ts);
process.exit(0);
EOF

# Health check del backend en producción
curl https://[tu-api].up.railway.app/health
```
