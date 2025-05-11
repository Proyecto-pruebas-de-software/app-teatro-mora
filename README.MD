# Teatro Mora Virtual - API REST

API para la gestión de eventos, actores, usuarios y boletos del Teatro Mora Virtual. Desarrollada con Node.js, Express y PostgreSQL.

## Tecnologías

- **Backend**: Node.js + Express
- **Base de datos**: PostgreSQL
- **Testing**: Mocha + Chai
- **Despliegue**: AWS (EC2/RDS)
- **Frontend**: React (próximamente)

## Estructura del Proyecto

```
.
├── models/
│   └── response.js       # Modelo estandarizado para respuestas API

├── queries/
│   ├── actores.js        # CRUD de actores
│   ├── boletos.js        # CRUD de boletos
│   ├── cola_virtual.js   # Gestión de cola virtual
│   ├── eventos.js        # CRUD de eventos
│   ├── mensajes_foro.js  # Foro de mensajes
│   └── usuarios.js       # CRUD de usuarios
├── index.js              # Punto de entrada (configuración del servidor)
└── package.json          # Dependencias y scripts
```

##Instalación

1. Clonar repositorio:
   ```bash
   git clone https://github.com/Proyecto-pruebas-de-software/app-teatro-mora.git
   cd app-teatro-mora/api
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar base de datos PostgreSQL:
   - Crear base de datos `teatro_mora_virtual`
   - Configurar credenciales en los archivos de queries (o usar variables de entorno)

4. Iniciar servidor:
   ```bash
   npm start
   ```
   > El servidor estará disponible en `http://localhost:3000`

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

## Pruebas (En progreso)
Próximamente: Pruebas unitarias e integración con Mocha + Chai.
```bash
npm test
```

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
