# NMN Finance Advisor 💼

Bienvenido al repositorio oficial de **NMN Finance Advisor**, una plataforma integral de gestión financiera y análisis de negocio diseñada para ofrecer inteligencia accionable y control total sobre tus operaciones.

## 🚀 Tecnologías

Este proyecto está construido con un stack moderno y robusto:
- **Frontend**: React (Vite)
- **Backend**: Java (Spring Boot)
- **Base de datos**: H2 Database (Encriptada AES)

## 🔑 Acceso al Sistema (Login)

Para entrar a la aplicación de desarrollo, utiliza las siguientes credenciales de administrador:
- **Usuario:** `flownanito`
- **Contraseña:** `Nano15jada`

> [!CAUTION]
> Estas son credenciales por defecto para entornos de desarrollo. En producción, asegúrate de cambiar estas contraseñas en el archivo `application.properties` o inyectándolas a través de variables de entorno.

## 🛠 Instalación y Ejecución

Para levantar la aplicación en tu entorno local, necesitas tener instalado **Java (JDK 17+)** y **Node.js**.

### Iniciar el Backend (Servidor Spring Boot)
1. Ve al directorio `backend`.
2. Ejecuta el wrapper de Maven:
```bash
cd backend
./mvnw spring-boot:run
```
El backend se iniciará en el puerto **8085**.

### Iniciar el Frontend (Cliente React/Vite)
1. Ve al directorio `frontend`.
2. Instala las dependencias y arranca el entorno:
```bash
cd frontend
npm install
npm run dev
```
El frontend estará disponible en **http://localhost:5173/**.

## 🌟 Características Principales

- **Dashboard en tiempo real:** Visualización instantánea de KPIs y métricas financieras.
- **Autenticación JWT Segura:** Sistema de login seguro que protege todas las rutas y la API.
- **Gestión de Entradas y Salidas:** Interfaz sencilla para contabilizar ingresos y gastos.
- **Alta Seguridad de Base de Datos:** Los datos se guardan en un archivo H2 local pero con encriptación fuerte a nivel de sistema.

---
*Desarrollado por el equipo de Software Group NMN.*
