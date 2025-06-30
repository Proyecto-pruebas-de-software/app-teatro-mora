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
    - [Mensajes del Foro](#mensajes-del-foro)
    - [Boletos](#boletos)
    - [Cola Virtual](#cola-virtual)
    - [Eventos](#eventos)
    - [Autenticación](#autenticación)
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
-   **`dotenv`**: Para la gestión de variables de entorno.

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

*   **Gestión de Usuarios**: Registro, inicio de sesión, perfiles de usuario (clientes y administradores) y hashing de contraseñas para mayor seguridad.
*   **Gestión de Eventos**:
    *   Visualización de eventos próximos y pasados, incluyendo detalles como hora, precio, aforo, y URL de imagen.
    *   Funcionalidad para crear, editar y eliminar eventos (solo administradores).
    *   Filtrado y ordenamiento de eventos por nombre, fecha y precio (ascendente/descendente).
*   **Foro de la Comunidad**:
    *   Publicación de mensajes asociados a eventos, con soporte para respuestas a mensajes existentes (foro anidado).
    *   Visualización de mensajes con detalles de autor, fecha, contenido, **conteo de respuestas y fecha de última actividad**.
    *   **Control de acceso granular para mensajes**: los usuarios solo pueden editar/eliminar sus propios mensajes y reportar otros. Los administradores tienen control total.
    *   Validación en frontend para mensajes (mínimo de 5 caracteres).
*   **Gestión de Actores**: Visualización y gestión de la información de los actores del teatro (solo administradores pueden crear, editar, eliminar).
*   **Boletos y Cola Virtual**:
    *   Sistema robusto de **compra de boletos**, incluyendo gestión de aforo y validación de asientos.
    *   **Gestión completa de cola virtual** para eventos, permitiendo a los usuarios unirse, verificar su estado en la cola, y ser notificados de su turno.
    *   Integración con la UI para la navegación fácil de regreso al evento desde la página de la cola.
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
│   │   ├── Foro.jsx      # Página principal del foro, muestra categorías de eventos
│   │   └── EventForumPage.jsx # Página de un foro de evento específico (temas y respuestas)
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
    *   **Crear base de datos:** Abre pgAdmin 4 o tu cliente PostgreSQL y crea una nueva base de datos llamada `teatro_mora_virtual`.
    *   **Crear archivo `.env`:** En el directorio `api/`, crea un archivo llamado `.env` y añade el siguiente contenido, reemplazando los valores con tus credenciales de PostgreSQL y una clave secreta fuerte:
        ```
        # Database Configuration
        DB_USER=postgres
        DB_HOST=localhost
        DB_NAME=teatro_mora_virtual
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
        psql -U postgres -d teatro_mora_virtual -f database/full_init.sql
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
    El frontend se ejecutará en `http://localhost:3001` (o un puerto similar, según Vite).

## Uso de la Aplicación

Una vez que ambos servidores (backend y frontend) estén en funcionamiento:
1.  Abre tu navegador y navega a la URL del frontend (ej: `http://localhost:3001`).
2.  Puedes registrarte como un nuevo usuario o usar las credenciales de prueba predefinidas en `database/full_init.sql` (ej: `admin@example.com` / `Admin123!`).
3.  Explora las secciones de Eventos, Foro, Actores, etc.

## Consideraciones y Mejoras Futuras

Aunque el proyecto ha avanzado significativamente y es funcional, aquí hay algunas áreas para futuras mejoras y consideraciones:

*   **Refactorización de Autenticación**: La lógica de autenticación ha sido parcialmente refactorizada, moviendo el hashing de contraseñas y la función de login a `api/queries/queries_usuarios.js`. Aún se puede revisar para una separación más estricta de capas.
*   **Validación de Datos en Frontend**: Se ha implementado validación básica en el lado del cliente para el formulario de mensajes del foro. Se recomienda extender estas validaciones a otros formularios (ej. eventos, actores) para una experiencia de usuario más robusta.
*   **Manejo de Errores UX**: Se ha añadido un mensaje de advertencia para la validación de mensajes del foro. Se puede mejorar la presentación general de errores al usuario en el frontend para una experiencia más fluida y consistente.
*   **Gestión Completa de Boletos y Cola**: Se ha implementado un sistema robusto de compra de boletos y una gestión de cola virtual funcional en el backend. Las mejoras futuras podrían centrarse en una interfaz de usuario más interactiva y en la integración en tiempo real (websockets) para la gestión de la cola y asientos.
*   **Paginación/Scroll Infinito**: Para listas grandes de eventos o mensajes, implementar paginación o carga infinita para mejorar el rendimiento y la experiencia del usuario.
*   **Tests de Frontend**: Añadir pruebas unitarias y de integración para los componentes de React para asegurar la estabilidad y prevenir regresiones.
*   **Estilos y Temas**: Considerar un sistema de temas más avanzado o una mayor personalización de estilos si se planea una evolución visual profunda.

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

### Mensajes del Foro
- `GET /api/mensajes` - Listar todos los mensajes del foro (puede filtrar por `evento_id` o `parent_id`)
- `GET /api/mensajes/:evento_id` - Listar mensajes de un evento específico
- `GET /api/mensajes/replies/:parent_id` - Listar respuestas a un mensaje específico
- `POST /api/mensajes` - Crear nuevo mensaje (requiere autenticación)
- `PUT /api/mensajes/:id` - Actualizar mensaje (requiere autenticación, solo autor o admin)
- `DELETE /api/mensajes/:id` - Eliminar mensaje (requiere autenticación, solo autor o admin)
- `POST /api/mensajes/reportar/:id` - Reportar un mensaje (requiere autenticación)

### Boletos
- `GET /api/boletos` - Listar todos los boletos
- `GET /api/boletos/:id` - Obtener boleto por ID
- `POST /api/boletos` - Crear nuevo boleto (requiere autenticación)
- `POST /api/boletos/comprar` - Comprar múltiples boletos para un evento (requiere autenticación y estar en turno en la cola virtual)
- `PUT /api/boletos/:id` - Actualizar boleto (requiere autenticación)
- `DELETE /api/boletos/:id` - Eliminar boleto (requiere autenticación)

### Cola Virtual
- `GET /api/cola_virtual` - Listar todos los registros de la cola virtual
- `GET /api/cola_virtual/:id` - Obtener registro de cola virtual por ID
- `POST /api/cola_virtual` - Crear nuevo registro de cola virtual (requiere autenticación)
- `POST /api/cola_virtual/join` - Unirse a la cola virtual para un evento (requiere autenticación)
- `GET /api/cola_virtual/status/:evento_id` - Obtener el estado del usuario en la cola para un evento (requiere autenticación)
- `GET /api/cola_virtual/length/:evento_id` - Obtener la longitud de la cola para un evento
- `PUT /api/cola_virtual/:id` - Actualizar registro de cola virtual (requiere autenticación)
- `DELETE /api/cola_virtual/:id` - Eliminar registro de cola virtual (requiere autenticación)

### Eventos
- `GET /api/eventos` - Listar todos los eventos
- `GET /api/eventos/:id` - Obtener evento por ID
- `POST /api/eventos` - Crear nuevo evento (requiere autenticación y rol de administrador)
- `PUT /api/eventos/:id` - Actualizar evento (requiere autenticación y rol de administrador)
- `DELETE /api/eventos/:id` - Eliminar evento (requiere autenticación y rol de administrador)

### Autenticación
- `POST /api/auth/register` - Registrar un nuevo usuario
- `POST /api/auth/login` - Iniciar sesión de usuario
- `GET /api/auth/me` - Obtener información del usuario autenticado (requiere token)

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

## Despliegue e Integración Continua con Jenkins

Este proyecto utiliza **Jenkins** para automatizar la integración y despliegue continuo. Jenkins se encuentra instalado en el mismo servidor de producción y ejecuta automáticamente los siguientes pasos al detectar cambios en la rama `master` de GitHub:

1. Clona la última versión del repositorio.
2. Instala dependencias para backend (`api/`) y frontend (`src/`).
3. Ejecuta pruebas automatizadas:
   - Backend: Mocha + Chai
   - Frontend: scripts definidos en `package.json`
4. Si las pruebas son exitosas:
   - Compila el frontend con `npm run build`
   - Reinicia el backend con `pm2`
   - Despliega automáticamente en producción

### Validaciones y mejoras del pipeline

- El pipeline detiene el despliegue si fallan las pruebas.
- Se corrigió un error donde los tests del frontend no detenían el pipeline.
- Se mejoraron logs de compilación (`vite.config.js`) y manejo de errores.

### Dependencias involucradas

Jenkins interactúa con:

- **GitHub:** repositorio del código
- **Node.js / npm:** gestión de dependencias y scripts
- **PostgreSQL:** base de datos (si se restauran datos)
- **PM2:** control de procesos del backend
- **Sistema de archivos:** compilación e instalación del frontend

### Problemas comunes y soluciones

- **Conflictos en React:** resueltos con `npm install --legacy-peer-deps`
- **Permisos de Jenkins:** se ajustaron para acceso a carpetas necesarias
- **Tests de frontend falsos positivos:** se forzó la propagación de errores
- **Compilación sin logs útiles:** se mejoró el log y el manejo de errores

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
