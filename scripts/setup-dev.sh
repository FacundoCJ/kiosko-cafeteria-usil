#!/usr/bin/env bash

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "====================================="
echo "Kiosko Cafetería USIL - Setup Dev"
echo "====================================="

echo ""
echo "1. Iniciando PostgreSQL con Docker..."
cd "$PROJECT_ROOT"
docker compose up -d

echo ""
echo "2. Instalando dependencias del backend..."
cd "$PROJECT_ROOT/backend"
npm install

echo ""
echo "3. Aplicando migraciones Prisma..."
npx prisma migrate dev

echo ""
echo "4. Generando Prisma Client..."
npx prisma generate

echo ""
echo "5. Cargando datos base del sistema..."
node prisma/seed.cjs

echo ""
echo "6. Instalando dependencias del frontend..."
cd "$PROJECT_ROOT/frontend"
npm install

echo ""
echo "7. Probando build del frontend..."
npm run build

echo ""
echo "====================================="
echo "Entorno preparado correctamente."
echo "====================================="
echo ""
echo "Para iniciar backend:"
echo "cd $PROJECT_ROOT/backend && npm run dev"
echo ""
echo "Para iniciar frontend:"
echo "cd $PROJECT_ROOT/frontend && npm run dev"
echo ""