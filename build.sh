#!/bin/bash
# Exit on error
set -e

echo "=== 1. Compilando el Frontend (React + Vite) ==="
cd frontend
npm run build
cd ..

echo "=== 2. Copiando archivos estáticos al Backend ==="
rm -rf backend/src/main/resources/static/*
mkdir -p backend/src/main/resources/static/
cp -r frontend/dist/* backend/src/main/resources/static/

echo "=== 3. Compilando el ejecutable Spring Boot (JAR) ==="
cd backend
chmod +x mvnw
./mvnw clean package -DskipTests
cd ..

echo "=================================================================="
echo "¡NMN Finance Advisor compilado con éxito!"
echo "Puedes ejecutar la aplicación como un ejecutable autónomo con:"
echo "java -jar backend/target/financeadvisor-0.0.1-SNAPSHOT.jar"
echo "=================================================================="
