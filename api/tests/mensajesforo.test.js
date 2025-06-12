process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../index');
const expect = chai.expect;
const pool = require('../queries/queries_mensajesforo').pool;

chai.use(chaiHttp);

describe('API CRUD de Mensajes del Foro', function() {
    this.timeout(10000);

    let testUsuarioId;
    let testEventoId;
    let testMensajeId;
    
    const testMensaje = {
        usuario_id: null,
        evento_id: null,
        mensaje: "Este es un mensaje de prueba válido para el foro"
    };

    before(async () => {
        // Limpiar datos anteriores
        await pool.query("DELETE FROM mensajes_foro WHERE mensaje LIKE '%prueba%'");
        await pool.query("DELETE FROM usuarios WHERE email = 'mensaje_test@example.com'");
        await pool.query("DELETE FROM eventos WHERE nombre = 'Evento Mensaje Test'");

        // Crear usuario de prueba
        const usuarioRes = await pool.query(
            "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id",
            ["Usuario Mensaje Test", "mensaje_test@example.com", "password123", "cliente"]
        );
        testUsuarioId = usuarioRes.rows[0].id;

        // Crear evento de prueba
        const eventoRes = await pool.query(
            "INSERT INTO eventos (nombre, fecha, descripcion) VALUES ($1, $2, $3) RETURNING id",
            ["Evento Mensaje Test", new Date(), "Evento para pruebas de mensajes"]
        );
        testEventoId = eventoRes.rows[0].id;

        testMensaje.usuario_id = testUsuarioId;
        testMensaje.evento_id = testEventoId;
    });

    after(async () => {
        await pool.query("DELETE FROM mensajes_foro WHERE mensaje LIKE '%prueba%'");
        await pool.query("DELETE FROM usuarios WHERE email = 'mensaje_test@example.com'");
        await pool.query("DELETE FROM eventos WHERE nombre = 'Evento Mensaje Test'");

        if (app.close) {
        await app.close();
    }
    });

    // Test POST /mensajes
    describe('POST /mensajes', () => {
        it('Debería crear un nuevo mensaje con datos válidos (201)', async () => {
            const res = await chai.request(app)
                .post('/mensajes')
                .send(testMensaje);

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('status', true);
            expect(res.body.data).to.include({
                mensaje: testMensaje.mensaje
            });
            expect(res.body.data).to.have.property('id');
            expect(res.body.data).to.have.property('creado_en');
            testMensajeId = res.body.data.id;
        });

        it('Debería rechazar mensaje sin datos requeridos (400)', async () => {
            const res = await chai.request(app)
                .post('/mensajes')
                .send({
                    mensaje: "Faltan campos obligatorios"
                });

            expect(res).to.have.status(400);
            expect(res.body.status).to.be.false;
            expect(res.body.message).to.include('Faltan campos requeridos');
        });

        it('Debería rechazar mensaje demasiado corto (4 caracteres) (400)', async () => {
            const res = await chai.request(app)
                .post('/mensajes')
                .send({
                    ...testMensaje,
                    mensaje: "1234"
                });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('El mensaje debe tener entre 5 y 500 caracteres');
        });

        it('Debería rechazar mensaje demasiado largo (501 caracteres) (400)', async () => {
            const res = await chai.request(app)
                .post('/mensajes')
                .send({
                    ...testMensaje,
                    mensaje: "a".repeat(501)
                });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('El mensaje debe tener entre 5 y 500 caracteres');
        });

        it('Debería rechazar mensaje con usuario inexistente (404)', async () => {
            const res = await chai.request(app)
                .post('/mensajes')
                .send({
                    ...testMensaje,
                    usuario_id: 999999
                });

            expect(res).to.have.status(404);
            expect(res.body.message).to.include('Usuario o evento no existen');
        });

        it('Debería rechazar mensaje con evento inexistente (404)', async () => {
            const res = await chai.request(app)
                .post('/mensajes')
                .send({
                    ...testMensaje,
                    evento_id: 999999
                });

            expect(res).to.have.status(404);
            expect(res.body.message).to.include('Usuario o evento no existen');
        });
    });

    // Test GET /mensajes
    describe('GET /mensajes', () => {
        it('Debería listar todos los mensajes ordenados por fecha descendente (200)', async () => {
            // Crear mensajes adicionales
            const mensaje1 = {
                ...testMensaje,
                mensaje: "Mensaje 1 para prueba de orden"
            };
            const mensaje2 = {
                ...testMensaje,
                mensaje: "Mensaje 2 para prueba de orden"
            };

            await Promise.all([
                chai.request(app).post('/mensajes').send(mensaje1),
                chai.request(app).post('/mensajes').send(mensaje2)
            ]);

            const res = await chai.request(app)
                .get('/mensajes');

            expect(res).to.have.status(200);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.be.at.least(3);
            
            // Verificar orden por fecha descendente
            const fechas = res.body.data.map(m => new Date(m.creado_en).getTime());
            const fechasOrdenadas = [...fechas].sort((a, b) => b - a);
            expect(fechas).to.deep.equal(fechasOrdenadas);

            // Verificar estructura de datos
            expect(res.body.data[0]).to.include.all.keys(
                'id', 'mensaje', 'creado_en', 'usuario_id', 
                'usuario_nombre', 'evento_id', 'evento_nombre'
            );
        });

        it('Debería obtener un mensaje específico por ID (200)', async () => {
            const res = await chai.request(app)
                .get(`/mensajes/${testMensajeId}`);

            expect(res).to.have.status(200);
            expect(res.body.data.id).to.equal(testMensajeId);
            expect(res.body.data).to.include({
                mensaje: testMensaje.mensaje
            });
            expect(res.body.data).to.have.property('usuario_nombre');
            expect(res.body.data).to.have.property('evento_nombre');
        });

        it('Debería fallar con ID inexistente (404)', async () => {
            const res = await chai.request(app)
                .get('/mensajes/999999');

            expect(res).to.have.status(404);
        });
    });

    // Test PUT /mensajes/:id
    describe('PUT /mensajes/:id', () => {
        it('Debería actualizar el texto del mensaje (200)', async () => {
            const nuevoTexto = "Este es el mensaje actualizado";
            const res = await chai.request(app)
                .put(`/mensajes/${testMensajeId}`)
                .send({ mensaje: nuevoTexto });

            expect(res).to.have.status(200);
            expect(res.body.data.mensaje).to.equal(nuevoTexto);
        });

        it('Debería rechazar actualización con mensaje demasiado corto (400)', async () => {
            const res = await chai.request(app)
                .put(`/mensajes/${testMensajeId}`)
                .send({ mensaje: "1234" });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('El mensaje debe tener entre 5 y 500 caracteres');
        });

        it('Debería rechazar actualización con mensaje demasiado largo (400)', async () => {
            const res = await chai.request(app)
                .put(`/mensajes/${testMensajeId}`)
                .send({ mensaje: "a".repeat(501) });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('El mensaje debe tener entre 5 y 500 caracteres');
        });

        it('Debería rechazar actualización de mensaje inexistente (404)', async () => {
            const res = await chai.request(app)
                .put('/mensajes/999999')
                .send({ mensaje: "Mensaje para actualizar" });

            expect(res).to.have.status(404);
        });

        it('Debería ignorar intento de cambiar usuario o evento (200)', async () => {
            const res = await chai.request(app)
                .put(`/mensajes/${testMensajeId}`)
                .send({ 
                    mensaje: "Mensaje con intento de cambiar relaciones",
                    usuario_id: 999999,
                    evento_id: 888888
                });

            expect(res).to.have.status(200);
            // Verificar que usuario y evento no cambiaron
            expect(res.body.data.usuario_id).to.equal(testUsuarioId);
            expect(res.body.data.evento_id).to.equal(testEventoId);
        });
    });

    // Test DELETE /mensajes/:id
    describe('DELETE /mensajes/:id', () => {
        it('Debería eliminar un mensaje existente (200)', async () => {
            // Primero creamos un mensaje para eliminar
            const mensajeToDelete = {
                ...testMensaje,
                mensaje: "Mensaje a eliminar"
            };
            const createRes = await chai.request(app)
                .post('/mensajes')
                .send(mensajeToDelete);

            const deleteRes = await chai.request(app)
                .delete(`/mensajes/${createRes.body.data.id}`);

            expect(deleteRes).to.have.status(200);
            expect(deleteRes.body.data.id).to.equal(createRes.body.data.id);

            // Verificar que ya no existe
            const getRes = await chai.request(app)
                .get(`/mensajes/${createRes.body.data.id}`);
            expect(getRes).to.have.status(404);
        });

        it('Debería fallar al eliminar mensaje inexistente (404)', async () => {
            const res = await chai.request(app)
                .delete('/mensajes/999999');

            expect(res).to.have.status(404);
        });
    });

    // Pruebas adicionales
    describe('Validaciones adicionales', () => {
        it('Debería aceptar mensaje con exactamente 5 caracteres (201)', async () => {
            const res = await chai.request(app)
                .post('/mensajes')
                .send({
                    ...testMensaje,
                    mensaje: "12345"
                });

            expect(res).to.have.status(201);
            expect(res.body.data.mensaje).to.have.lengthOf(5);
        });

        it('Debería aceptar mensaje con exactamente 500 caracteres (201)', async () => {
            const res = await chai.request(app)
                .post('/mensajes')
                .send({
                    ...testMensaje,
                    mensaje: "a".repeat(500)
                });

            expect(res).to.have.status(201);
            expect(res.body.data.mensaje).to.have.lengthOf(500);
        });

        it('Debería mantener la fecha original al actualizar (200)', async () => {
            // Obtener mensaje original para ver su fecha
            const getRes = await chai.request(app)
                .get(`/mensajes/${testMensajeId}`);
            const fechaOriginal = getRes.body.data.creado_en;

            // Actualizar mensaje
            const updateRes = await chai.request(app)
                .put(`/mensajes/${testMensajeId}`)
                .send({ mensaje: "Mensaje para probar fecha" });

            expect(updateRes.body.data.creado_en).to.equal(fechaOriginal);
        });
    });
});
