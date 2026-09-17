# NutriCompra — Backend (Etapa 2.1-B)

Este documento describe la base de backend creada en la Etapa 2.1-B: NestJS +
Prisma + PostgreSQL para el dominio nutricional. **No incluye** seed del CSV,
importación de alimentos, endpoints de negocio, ni nada relacionado con
productos, tiendas, precios, ofertas, recetas, menús, recomendaciones o IA.
Eso corresponde a etapas posteriores.

## 1. Arquitectura general

```
Next.js (frontend existente, sin cambios)
   ↓  (HTTP, en una etapa futura)
NestJS REST API   ← backend/
   ↓
Prisma (ORM)      ← backend/prisma/schema.prisma
   ↓
PostgreSQL
```

- El **frontend** (`app/`, `components/`, `data/`, `lib/`, `services/`,
  `store/`, `types/` en la raíz del repo) no fue modificado.
- El **backend** vive completamente aislado en `backend/`, con su propio
  `package.json`, `node_modules` y lockfile (npm), independiente del
  workspace pnpm del frontend. Esto es intencional: "el backend debe ser
  independiente del frontend".
- No existen rutas dentro de `app/api/*`. NestJS es una aplicación HTTP
  separada que en una etapa futura será consumida por Next.js vía `fetch`/
  cliente HTTP, no vía imports directos de Prisma dentro de componentes
  React.

## 2. Ubicación del backend

```
backend/
├── .env.example          # variables de entorno de ejemplo (sin credenciales reales)
├── .gitignore             # ignora node_modules, dist, .env
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── docs/
│   └── ARCHITECTURE.md    # este archivo
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20260916200000_init_nutrition_domain/
│           └── migration.sql
└── src/
    ├── main.ts             # bootstrap de NestJS
    ├── app.module.ts        # módulo raíz (importa PrismaModule)
    ├── app.controller.ts    # controlador mínimo (health-check por defecto)
    ├── app.service.ts
    └── prisma/
        ├── prisma.module.ts  # módulo global que expone PrismaService
        └── prisma.service.ts # wrapper de PrismaClient con lifecycle de Nest
```

Se eligió `backend/` (en la raíz del repositorio, junto a `app/`,
`components/`, etc.) porque:

- Es el patrón más común para monorepos frontend+backend simples y no
  requiere reconfigurar el workspace de pnpm del frontend (que no declara
  `packages:` en `pnpm-workspace.yaml`, así que `backend/` no se integra
  automáticamente a ese workspace — sigue siendo independiente).
  independiente).
- No colisiona con ninguna carpeta existente ni con la convención de
  Next.js App Router (`app/`).
- Es la sugerencia explícita del enunciado de la tarea.

No se creó ningún módulo de negocio (`foods/`, `nutrition/`, etc.) todavía;
solo la base mínima para que NestJS pueda arrancar y conectarse a
PostgreSQL a través de Prisma.

## 3. Modelo de datos

Tres modelos, dentro del alcance exacto solicitado:

### `Food`
Alimento normalizado de NutriCompra (p. ej. "Arroz blanco").

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` (UUID) | Generado por la aplicación (`@default(uuid())`). **Nunca** es el id numérico 1–78 del CSV ni el `sourceCode` del TPCA. |
| `name` | `String` | `@unique` — evita duplicados dentro de NutriCompra. |
| `category` | `String` | Una de las 11 categorías del TPCA (ver sección 4). Indexada (`@@index([category])`). |
| `type` | `String` | Por ahora siempre `"basic"` (`@default("basic")`). |
| `createdAt` / `updatedAt` | `DateTime` | Automáticos (`@default(now())` / `@updatedAt`). |

Relación 1:1 con `NutritionalProfile` (`Food.nutritionalProfile?`).

### `NutritionalProfile`
Composición nutricional de un `Food`, por cantidad de referencia.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` (UUID) | — |
| `foodId` | `String` | `@unique` → relación 1:1 con `Food`, `onDelete: Cascade`. |
| `referenceAmount` | `Decimal(8,2)` | Por ahora siempre `100`. |
| `referenceUnit` | `String` | Por ahora siempre `"g"`. |
| `energyKcal`, `proteinG`, `carbohydrateG`, `fatG`, `fiberG`, `sodiumMg`, `calciumMg`, `ironMg` | `Decimal(10,3)?` | **Todos opcionales, sin default.** |
| `dataSourceId` | `String` | Relación N:1 con `DataSource`. |
| `createdAt` / `updatedAt` | `DateTime` | Automáticos. |

**Significado de `NULL` (crítico):** si un nutriente es `NULL`, significa
*"la fuente no proporciona ese dato"* (en TPCA, el marcador original era
`"•"`). **`NULL` nunca debe convertirse en `0`** en ninguna capa de la
aplicación — son hechos distintos (dato ausente vs. valor medido en cero).
Por eso ningún campo nutricional tiene `@default(0)` ni `@default`.

### `DataSource`
Procedencia de los valores de un `NutritionalProfile`.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` (UUID) | — |
| `name` | `String` | P. ej. `"TPCA"`. Fuentes futuras (no insertadas aún): `"USDA"`, `"Open Food Facts"`, `"FAO/INFOODS"`, `"LATINFOODS"`. |
| `version` | `String` | P. ej. `"2023"`. |
| `sourceCode` | `String` | Código original en la fuente (p. ej. `"A3"`). **Nunca se usa como `Food.id`.** |
| `sourceName` | `String` | Nombre original exacto en la fuente (p. ej. `"Arroz blanco corriente"`). |
| `sourceUrl` | `String?` | URL del documento publicado. |
| `notes` | `String?` | Notas libres (p. ej. avisos del propio TPCA como "Imputado Tabla INCAP 2012"). |
| `createdAt` | `DateTime` | Automático. |

Ejemplo de trazabilidad (aún no insertado — corresponde a la etapa de seed):

```
Food:        name = "Arroz blanco"
DataSource:  name = "TPCA", version = "2023",
             sourceCode = "A3", sourceName = "Arroz blanco corriente"
```

### Relaciones

```
Food (1) ─────── (1) NutritionalProfile
NutritionalProfile (N) ─── (1) DataSource
```

### Decisiones de diseño relevantes

- **`category` y `type` son `String`, no `enum` de Prisma.** Se decidió así
  para no acoplar el esquema a un conjunto fijo de valores justo cuando se
  sabe que se incorporarán más fuentes (USDA, Open Food Facts, FAO/INFOODS,
  LATINFOODS) que pueden no mapear 1:1 a las 11 categorías del TPCA. Un
  `enum` de Prisma requiere migración para cada valor nuevo; un `String`
  validado en la capa de aplicación (DTOs de NestJS, en una etapa futura) es
  más flexible. Esto **no impide** representar las 11 categorías del TPCA
  (Cereales, Legumbres, Tubérculos, Carnes, Pescados, Huevos, Lácteos,
  Frutas, Verduras, Grasas, Otros) — de hecho las admite todas sin ningún
  cambio de esquema.
- **`Decimal` en vez de `Float`** para todos los valores nutricionales y
  `referenceAmount`, para evitar errores de redondeo binario en cálculos
  nutricionales.
- **`onDelete: Cascade`** en `NutritionalProfile.foodId`: si se borra un
  `Food`, su perfil nutricional (que no tiene sentido sin el alimento) se
  borra con él. **`onDelete: Restrict`** (comportamiento por defecto) en
  `NutritionalProfile.dataSourceId`: no se puede borrar una `DataSource`
  mientras haya perfiles que la referencien, preservando la trazabilidad.
- **Nombres de tabla en `snake_case`** (`@@map("foods")`,
  `@@map("nutritional_profiles")`, `@@map("data_sources")`) siguiendo la
  convención habitual de PostgreSQL, mientras los modelos y campos de Prisma
  se mantienen en `camelCase` (convención de TypeScript/Prisma).

## 4. Las 11 categorías del TPCA

`category` es un `String` libre a nivel de base de datos; los 11 valores
que usa el dataset TPCA (y que deben aceptarse sin reducción) son:

```
Cereales, Legumbres, Tubérculos, Carnes, Pescados, Huevos,
Lácteos, Frutas, Verduras, Grasas, Otros
```

La reconciliación con el tipo `FoodCategory` del frontend (que hoy solo
tiene 7 valores: `cereales | legumbres | carnes | frutas | verduras |
lacteos | otros`) **no se resuelve en esta etapa** — queda para la
integración frontend↔backend.

## 5. `DATABASE_URL` y variables de entorno

Prisma lee la cadena de conexión desde la variable de entorno
`DATABASE_URL` (`backend/prisma/schema.prisma`, bloque `datasource db`).

`backend/.env.example` documenta el formato esperado, sin credenciales
reales:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public"
PORT=3000
```

Para desarrollo local:

```bash
cd backend
cp .env.example .env
# editar .env con credenciales reales de tu Postgres local
```

`.env` está en `backend/.gitignore` y nunca debe commitearse.

## 6. Cómo ejecutar Prisma

```bash
cd backend
npm install              # instala dependencias del backend (independiente del frontend)
npx prisma generate      # genera el cliente Prisma tipado a partir de schema.prisma
npx prisma migrate dev   # aplica/crea migraciones contra la base definida en DATABASE_URL
npx prisma studio        # explorador visual de datos (opcional)
```

> ⚠️ Ver sección **"8. Validaciones realizadas"** — en el entorno sandbox
> donde se construyó esta etapa, estos comandos de Prisma **no pudieron
> ejecutarse** por una restricción de red (no relacionada con el esquema en
> sí). Deben poder ejecutarse normalmente en cualquier entorno con acceso
> completo a internet.

## 7. Cómo ejecutar el backend

```bash
cd backend
npm install
npm run start:dev   # modo watch, http://localhost:3000
# o
npm run build && npm run start:prod
```

El único endpoint existente por ahora es el `GET /` por defecto de Nest
(controlador `AppController` sin lógica de negocio), únicamente para
confirmar que el servidor arranca. No hay módulos de dominio (`foods`,
`nutrition`, etc.) todavía.

## 8. Validaciones realizadas

| # | Validación solicitada | Resultado |
|---|---|---|
| 1 | Prisma genera correctamente | ⚠️ **No se pudo ejecutar** `prisma generate` en este entorno (ver detalle abajo). El `schema.prisma` fue revisado manualmente campo por campo. |
| 2 | `schema.prisma` es válido | ⚠️ No se pudo correr `prisma validate` (mismo motivo). Se validó manualmente la sintaxis y, de forma indirecta, aplicando la migración SQL equivalente contra una instancia real de PostgreSQL 16 (ver punto 3), que reprodujo exactamente los tipos, nulabilidad, defaults y relaciones del schema. |
| 3 | La migración se crea correctamente | ✅ **Verificado de forma alternativa**: se instaló PostgreSQL 16 localmente (`apt-get install postgresql`) y se aplicó `prisma/migrations/20260916200000_init_nutrition_domain/migration.sql` con `psql` contra una base real. Las 3 tablas, los 2 índices adicionales, los 2 índices únicos y las 2 foreign keys se crearon sin errores. Se insertó una fila de ejemplo con `sodiumMg = NULL` y se confirmó que se lee como `NULL` (no `0`). |
| 4 | NestJS compila | ✅ `npx nest build` termina sin errores; `dist/main.js` se genera correctamente. |
| 5 | TypeScript compila en el backend | ✅ `npx tsc --noEmit` sin errores. |
| 6 | El frontend existente no se rompió | ✅ `git diff --stat` fuera de `backend/` no muestra ningún archivo modificado. |
| 7 | No se crearon tablas fuera de alcance | ✅ Solo existen `foods`, `nutritional_profiles`, `data_sources` en la migración. No hay `Product`, `Store`, `Price`, `Offer`, `Meal`, `Recipe`, `Recommendation` ni `User`. |

### Detalle del problema de red (punto 1 y 2)

El sandbox de desarrollo usado para esta etapa tiene una lista blanca de
dominios de red. `registry.npmjs.org` está permitido (por eso `npm install`
funcionó sin problema), pero **`binaries.prisma.sh`** — el CDN desde el que
Prisma 6/7 descarga sus binarios de motor (`schema-engine`, usado por
`generate`, `validate`, `migrate`, `format`) — **no está en esa lista** y
responde `403 Forbidden`:

```
Error: Failed to fetch the engine file at
https://binaries.prisma.sh/.../schema-engine.gz - 403 Forbidden
```

Esto **no es un problema del `schema.prisma`**: es una restricción de red
del entorno donde se hizo este trabajo. Como consecuencia:

- El cliente Prisma (`@prisma/client`) quedó en su estado "stub" (el que
  trae el paquete npm por defecto, sin generar), y al intentar levantar el
  backend contra una base real falla con
  `Error: @prisma/client did not initialize yet. Please run "prisma
  generate" and try to import it again.` — se reprodujo este error
  intencionalmente para documentarlo, no es un bug del código.
- La migración `20260916200000_init_nutrition_domain/migration.sql` fue
  **escrita a mano**, replicando exactamente lo que `prisma migrate dev`
  generaría a partir de `schema.prisma` (mismos nombres de tabla via
  `@@map`, mismos tipos `Decimal`, misma nulabilidad, mismos defaults,
  mismas foreign keys e índices), y **se verificó aplicándola contra un
  PostgreSQL 16 real** instalado en el mismo sandbox.

**Acción recomendada antes de continuar con la siguiente etapa:** en un
entorno con acceso normal a internet, ejecutar:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

Si Prisma detecta que la migración a mano ya coincide con el estado del
schema, no debería generar cambios adicionales. Si por algún motivo Prisma
generase una migración distinta a la incluida aquí, esa migración generada
por la propia CLI debe prevalecer sobre la escrita a mano en este documento.

## 9. Fuera de alcance en esta etapa (recordatorio)

No se implementó: seed del CSV, importación de los 78 alimentos, ningún
endpoint REST de negocio, módulos `foods`/`nutrition`, frontend, productos,
tiendas, precios, ofertas, Caza Ofertas, recetas, menús, recomendaciones ni
IA. Tampoco se creó ningún enum de Prisma para categorías/tipos, ni tablas
para `Product`, `Store`, `Price`, `Offer`, `Meal`, `Recipe`,
`Recommendation` o `User`.
