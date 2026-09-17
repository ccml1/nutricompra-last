# NutriCompra — Backend

Backend de NutriCompra: NestJS + Prisma + PostgreSQL, independiente del
frontend Next.js (raíz del repositorio).

Documentación completa: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
(arquitectura, modelo de datos, variables de entorno, cómo ejecutar Prisma
y el backend, y el detalle de las validaciones realizadas en esta etapa).

## Quick start

```bash
npm install
cp .env.example .env   # y completa DATABASE_URL con tu Postgres local
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

## Estado actual (Etapa 2.1-B)

- Modelos Prisma: `Food`, `NutritionalProfile`, `DataSource` (dominio
  nutricional únicamente).
- Sin seed de datos, sin endpoints de negocio, sin módulos de dominio.
- Ver `docs/ARCHITECTURE.md` para el detalle y las validaciones.
