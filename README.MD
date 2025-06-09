# Teatro Mora Virtual

¡Bienvenido al sistema del Teatro Mora Virtual! Esta aplicación integral está diseñada para gestionar eventos teatrales, permitir la interacción de la comunidad a través de un foro, y facilitar la compra de boletos y la gestión de una cola virtual. Desarrollado con una arquitectura moderna de Node.js/Express para el backend y React para el frontend, junto con PostgreSQL como base de datos.

## Tabla de Contenidos
- [Teatro Mora Virtual](#teatro-mora-virtual)
  - [Tabla de Contenidos](#tabla-de-contenidos)
  - [Tecnologías Utilizadas](#tecnologías-utilizadas)
  - [Características Principales](#características-principales)
  - [Estructura del Proyecto](#estructura-del-proyecto)
  - [Configuración e Instalación](#configuración-e-instalación)
    - [Prerrequisitos](#prerrequisitos)
    - [Pasos de Instalación](#pasos-de-instalación)
  - [Uso de la Aplicación](#uso-de-la-aplicación)
  - [Consideraciones y Mejoras Futuras](#consideraciones-y-mejoras-futuras)
  - [Endpoints Disponibles](#endpoints-disponibles)
    - [Usuarios](#usuarios)
    - [Actores](#actores)
    - [Boletos](#boletos)
    - [Eventos](#eventos)
  - [Testing](#testing)
  - [Despliegue (Futuro)](#despliegue-futuro)
  - [Contribución](#contribución)
  - [📄 Licencia](#-licencia)

## Tecnologías Utilizadas

**Backend:**
-   **Node.js**: Entorno de ejecución para JavaScript.
-   **Express.js**: Framework web para Node.js.
-   **PostgreSQL**: Sistema de gestión de bases de datos relacionales.
-   **`pg`**: Cliente PostgreSQL para Node.js.
-   **`bcryptjs`**: Librería para el hashing de contraseñas.
-   **`jsonwebtoken` (JWT)**: Para la autenticación basada en tokens.

**Frontend:**
-   **React**: Librería de JavaScript para construir interfaces de usuario.
-   **Vite**: Herramienta de construcción rápida para proyectos web.
-   **Material-UI (MUI)**: Librería de componentes React para un diseño atractivo y responsivo.
-   **`@tanstack/react-query`**: Para la gestión de estados asíncronos y caché de datos.
-   **`axios`**: Cliente HTTP para realizar peticiones a la API.

**Otros:**
-   **Mocha & Chai**: Frameworks de testing (principalmente para el backend).
-   **`cross-env`**: Para configurar variables de entorno de manera multiplataforma.

## Características Principales

*   **Gestión de Usuarios**: Registro, inicio de sesión y perfiles de usuario (clientes y administradores).
*   **Gestión de Eventos**:
    *   Visualización de eventos próximos y pasados.
    *   Funcionalidad para crear, editar y eliminar eventos (solo administradores).
    *   Filtrado y ordenamiento de eventos por nombre, fecha y precio (ascendente/descendente).
*   **Foro de la Comunidad**:
    *   Publicación de mensajes asociados a eventos.
    *   Visualización de mensajes con detalles de usuario, fecha y contenido.
    *   Edición y eliminación de mensajes (por el autor o administradores).
    *   Reporte de mensajes.
*   **Gestión de Actores**: Visualización y gestión de la información de los actores del teatro (solo administradores pueden crear, editar, eliminar).
*   **Boletos y Cola Virtual**: (Funcionalidades existentes, pueden requerir más desarrollo de UI/UX)
    *   Sistema básico de compra de boletos.
    *   Gestión de cola virtual para eventos.
*   **Interfaz de Usuario Responsiva**: Diseño adaptado a diferentes tamaños de pantalla utilizando Material-UI.

## Estructura del Proyecto

El proyecto está dividido en dos directorios principales: `api/` para el backend y `src/` para el frontend.

```
.
├── api/                  # Código del backend (Node.js/Express)
│   ├── database/         # Scripts SQL para la base de datos (schema, seed)
│   ├── middleware/       # Funciones middleware reutilizables (e.g., autenticación)
│   ├── models/           # Definiciones de modelos de datos y respuesta API
│   ├── queries/          # Lógica de interacción con la base de datos (CRUD)
│   ├── routes/           # Definición de las rutas de la API (endpoints)
│   ├── tests/            # Pruebas para el backend
│   └── index.js          # Punto de entrada de la API
│
├── src/                  # Código del frontend (React/Vite)
│   ├── assets/           # (Opcional) Archivos estáticos como imágenes
│   ├── components/       # Componentes React reutilizables (botones, tarjetas, etc.)
│   ├── context/          # Contextos de React para la gestión de estado global (e.g., AuthContext)
│   ├── pages/            # Componentes React de las páginas principales (vistas)
│   ├── main.jsx          # Punto de entrada principal de la aplicación React
│   └── App.jsx           # Componente principal de la aplicación
│   └── theme.js          # Configuración del tema de Material-UI
│
├── index.html            # Plantilla HTML principal para la aplicación React
├── package.json          # Metadatos del proyecto y dependencias
├── package-lock.json     # Registro exacto de las dependencias
├── vite.config.js        # Configuración de Vite
└── README.MD             # Este archivo
```

## Configuración e Instalación

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local.

### Prerrequisitos

Asegúrate de tener instalado lo siguiente:
*   [**Node.js**](https://nodejs.org/): Versión 14 o superior.
*   [**npm**](https://www.npmjs.com/): Se instala con Node.js.
*   [**PostgreSQL**](https://www.postgresql.org/download/): Servidor de base de datos.
*   **pgAdmin 4** (Opcional, pero recomendado para gestionar la DB): Cliente gráfico para PostgreSQL.

### Pasos de Instalación

1.  **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/app-teatro-mora.git
    cd app-teatro-mora
    ```

2.  **Configuración de la Base de Datos:**
    *   **Crear base de datos:** Abre pgAdmin 4 o tu cliente PostgreSQL y crea una nueva base de datos llamada `teatro_mora`.
    *   **Crear archivo `.env`:** En el directorio `api/`, crea un archivo llamado `.env` y añade el siguiente contenido, reemplazando los valores con tus credenciales de PostgreSQL y una clave secreta fuerte:
        ```
        # Database Configuration
        DB_USER=postgres
        DB_HOST=localhost
        DB_NAME=teatro_mora
        DB_PASSWORD=tu_contraseña_postgresql
        DB_PORT=5432

        # JWT Configuration
        JWT_SECRET=tu_clave_secreta_jwt_fuerte_y_unica

        # Server Configuration
        PORT=3000
        NODE_ENV=development
        ```
        **Importante:** Asegúrate de que `DB_PASSWORD` coincida con la contraseña de tu usuario `postgres` en PostgreSQL. `JWT_SECRET` debe ser una cadena de caracteres aleatoria y segura.
    *   **Ejecutar esquema y datos de prueba:** Navega al directorio `api/` y ejecuta el script SQL para crear las tablas y poblar datos de prueba:
        ```bash
        cd api
        psql -U postgres -d teatro_mora -f database/full_init.sql
        ```
        (Reemplaza `postgres` con tu usuario de PostgreSQL si es diferente).

3.  **Instalar Dependencias del Backend:**
    Aún en el directorio `api/`:
    ```bash
    npm install
    ```

4.  **Iniciar el Servidor Backend:**
    Desde el directorio `api/`:
    ```bash
    npm start
    # O para desarrollo con reinicio automático (si tienes nodemon):
    # npm run dev
    ```
    El servidor backend se ejecutará en `http://localhost:3000` (o el puerto que configures en `.env`).

5.  **Instalar Dependencias del Frontend:**
    Regresa al directorio raíz del proyecto (`app-teatro-mora`) y luego instala las dependencias del frontend:
    ```bash
    cd ..
    npm install
    ```

6.  **Iniciar el Servidor de Desarrollo del Frontend:**
    Desde el directorio raíz del proyecto:
    ```bash
    npm run dev
    ```
    El frontend se ejecutará en `http://localhost:5173` (o un puerto similar, según Vite).

## Uso de la Aplicación

Una vez que ambos servidores (backend y frontend) estén en funcionamiento:
1.  Abre tu navegador y navega a la URL del frontend (ej: `http://localhost:5173`).
2.  Puedes registrarte como un nuevo usuario o usar las credenciales de prueba predefinidas en `database/seed.sql` (ej: `admin@example.com` / `Admin123!`).
3.  Explora las secciones de Eventos, Foro, Actores, etc.

## Consideraciones y Mejoras Futuras

Aunque el proyecto está bien estructurado y funcional, aquí hay algunas áreas para futuras mejoras:

*   **Refactorización de Autenticación**: Mover la lógica de base de datos de `api/routes/auth.js` a `api/queries/queries_usuarios.js` para seguir la separación de preocupaciones y evitar duplicación de código.
*   **Validación de Datos en Frontend**: Implementar validaciones más robustas en el lado del cliente para formularios (ej. para la creación/edición de eventos o mensajes).
*   **Manejo de Errores UX**: Mejorar la presentación de errores al usuario en el frontend para una experiencia más fluida.
*   **Gestión Completa de Boletos y Cola**: Desarrollar la interfaz de usuario y la lógica completa para la compra de boletos, asignación de asientos y gestión activa de la cola virtual.
*   **Paginación/Scroll Infinito**: Para listas grandes de eventos o mensajes, implementar paginación o carga infinita para mejorar el rendimiento.
*   **Tests de Frontend**: Añadir pruebas unitarias y de integración para los componentes de React.
*   **Estilos y Temas**: Considerar un sistema de temas más avanzado si se planea una personalización profunda.

---
Espero que este `README.MD` te sea de gran utilidad para entender y gestionar tu proyecto. ¡Mucho éxito!

## Endpoints Disponibles

### Usuarios
- `GET /usuarios` - Listar todos los usuarios
- `GET /usuarios/:id` - Obtener usuario por ID
- `POST /usuarios` - Crear nuevo usuario
- `PUT /usuarios/:id` - Actualizar usuario
- `DELETE /usuarios/:id` - Eliminar usuario

### Actores
- `GET /actores` - Listar todos los actores
- `GET /actores/:id` - Obtener actor por ID
- `POST /actores` - Crear nuevo actor
- `PUT /actores/:id` - Actualizar actor
- `DELETE /actores/:id` - Eliminar actor

### Boletos
- `GET /boletos` - Listar todos los boletos
- `GET /boletos/:id` - Obtener boleto por ID
- `POST /boletos` - Crear nuevo boleto
- `PUT /boletos/:id` - Actualizar boleto
- `DELETE /boletos/:id` - Eliminar boleto

### Eventos
- `GET /eventos` - Listar todos los eventos
- `GET /eventos/:id` - Obtener evento por ID
- `POST /eventos` - Crear nuevo evento
- `PUT /eventos/:id` - Actualizar evento
- `DELETE /eventos/:id` - Eliminar evento

## Testing
Pruebas unitarias y de integración, con Mocha + Chai.
Iniciar tests:
```bash
npm test
```
Se mostraran en consola el resultado de un total de 112 
tests centrados en cada request de caso general y de casos limites
para cada modulo CRUD.

## Despliegue (Futuro)
Planeado para AWS EC2 + RDS. Consultar con el equipo.


##  Contribución

1. **Clonar el repositorio** (si no lo has hecho):
   ```bash
   git clone https://github.com/Proyecto-pruebas-de-software/app-teatro-mora.git
   cd app-teatro-mora/api
   ```

2. **Crear una rama nueva** (usar nombres descriptivos con prefijos):
   ```bash
   git checkout -b tipo/descripción-breve
   ```
   Ejemplos:
   - `feat/add-login` (para nuevas funcionalidades)
   - `fix/eventos-query` (para correcciones)
   - `docs/update-readme` (para documentación)

3. **Instalar dependencias** (en caso de ser la primera vez):
   ```bash
   npm install
   ```

4. **Hacer tus cambios** y verificar que el servidor funcione:
   ```bash
   npm start
   ```

5. **Hacer commit** con mensajes claros ([Conventional Commits](https://www.conventionalcommits.org/)):
   ```bash
   git add .
   git commit -m "feat: añade endpoint para gestión de boletos"
   ```

6. **Sincronizar tu rama** con `main` (antes de subir cambios):
   ```bash
   git pull origin main
   ```

7. **Subir cambios** a tu fork:
   ```bash
   git push origin nombre-de-tu-rama
   ```

8. **Abrir un Pull Request (PR)** en GitHub:
   - Describe los cambios y **mencionar a @cvarela3344** (Claudio) como revisor.
   - Adjuntar capturas o resultados de pruebas si son relevantes.


## 📄 Licencia

MIT © 2024 - Equipo Teatro Mora Virtual
