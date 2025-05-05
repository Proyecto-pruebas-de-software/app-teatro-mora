const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;
const db = require('./queries/queries_usuarios');
const actores = require('./queries/actores');
const eventos = require('./queries/eventos');
const cola = require('./queries/cola');
const mensajes = require('./queries/mensajes_foro');

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
)

app.listen(port, () => {
    console.log("Server is running on " + port);
});

app.get("/", (request, response) => {
    response.json({
        info: 'Hello world!'
    });
})

//Rutas usuarios
app.get("/usuarios", db.getUsuarios);
app.get("/usuarios/:id", db.getUsuarioById);
app.put("/usuarios/:id", db.updateUsuario);
app.post("/usuarios", db.createUsuario);
app.delete("/usuarios/:id", db.deleteUsuario);

//Rutas actores
app.get("/actores", actores.getActores);
app.get("/actores/:id", actores.getActorById);
app.post("/actores", actores.createActor);
app.put("/actores/:id", actores.updateActor);
app.delete("/actores/:id", actores.deleteActor);

//Rutas eventos
app.get("/eventos", eventos.getEventos);
app.get("/eventos/:id", eventos.getEventoById);
app.post("/eventos", eventos.createEvento);
app.put("/eventos/:id", eventos.updateEvento);
app.delete("/eventos/:id", eventos.deleteEvento);

// Rutas boletos
app.get("/boletos", eventos.getBoletos);
app.get("/boletos/:id", eventos.getBoletoById);
app.post("/boletos", eventos.createBoleto);
app.put("/boletos/:id", eventos.updateBoleto);
app.delete("/boletos/:id", eventos.deleteBoleto);

// Rutas cola virtual
app.get("/cola", cola.getColaVirtual);
app.get("/cola/:id", cola.getColaVirtualById);
app.post("/cola", cola.createColaVirtual);
app.put("/cola/:id", cola.updateColaVirtual);
app.delete("/cola/:id", cola.deleteColaVirtual);

// Rutas mensajes en foro
app.get("/mensajes", mensajes.getMensajes);
app.get("/mensajes/:id", mensajes.getMensajeById);
app.post("/mensajes", mensajes.createMensaje);
app.put("/mensajes/:id", mensajes.updateMensaje);
app.delete("/mensajes/:id", mensajes.deleteMensaje);
