const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../index');
const expect = chai.expect;
const pool = require('../queries/queries_eventos').pool;

chai.use(chaiHttp);

describe('API CRUD de Eventos', function() {
    this.timeout(10000);

    let testUsuarioId;
    let testEventoId;
    
    const testEvento = {
        nombre: "Evento de Prueba",
        descripcion: "Descripción del evento de prueba",
        fecha: new Date(Date.now() + 86400000).toISOString(), // Mañana
        creada_por: null
    };

    before(async () => {
        // Limpiar datos anteriores
        await pool.query("DELETE FROM eventos WHERE nombre LIKE 'Evento%'");
        await pool.query("DELETE FROM usuarios WHERE email = 'evento_test@example.com'");

        // Crear usuario de prueba
        const usuarioRes = await pool.query(
            "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id",
            ["Usuario Evento Test", "evento_test@example.com", "password123", "admin"]
        );
        testUsuarioId = usuarioRes.rows[0].id;
        testEvento.creada_por = testUsuarioId;
    });

    after(async () => {
        await pool.query("DELETE FROM eventos WHERE nombre LIKE 'Evento%'");
        await pool.query("DELETE FROM usuarios WHERE email = 'evento_test@example.com'");
    });

    // Test POST /eventos
    describe('POST /eventos', () => {
        it('Debería crear un nuevo evento con datos válidos (201)', async () => {
            const res = await chai.request(app)
                .post('/eventos')
                .send(testEvento);

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('status', true);
            expect(res.body.data).to.include({
                nombre: testEvento.nombre,
                descripcion: testEvento.descripcion
            });
            expect(res.body.data).to.have.property('id');
            testEventoId = res.body.data.id;
        });

        it('Debería crear evento sin descripción ni creador (201)', async () => {
            const eventoMinimo = {
                nombre: "Evento Mínimo",
                fecha: new Date(Date.now() + 86400000).toISOString()
            };

            const res = await chai.request(app)
                .post('/eventos')
                .send(eventoMinimo);

            expect(res).to.have.status(201);
            expect(res.body.data.descripcion).to.be.null;
            expect(res.body.data.creada_por).to.be.null;
        });

        it('Debería rechazar evento sin nombre (400)', async () => {
            const res = await chai.request(app)
                .post('/eventos')
                .send({
                    descripcion: "Evento sin nombre",
                    fecha: new Date(Date.now() + 86400000).toISOString()
                });

            expect(res).to.have.status(400);
            expect(res.body.status).to.be.false;
            expect(res.body.message).to.include('Faltan campos requeridos');
        });

        it('Debería rechazar nombre con caracteres inválidos (400)', async () => {
            const res = await chai.request(app)
                .post('/eventos')
                .send({
                    nombre: "Evento Inválido @#$",
                    fecha: new Date(Date.now() + 86400000).toISOString()
                });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Nombre inválido');
        });

        it('Debería rechazar fecha pasada (400)', async () => {
            const res = await chai.request(app)
                .post('/eventos')
                .send({
                    nombre: "Evento con fecha pasada",
                    fecha: "2000-01-01"
                });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Fecha inválida');
        });

        it('Debería rechazar nombre duplicado en misma fecha (409)', async () => {
            const res = await chai.request(app)
                .post('/eventos')
                .send(testEvento); // Mismo nombre y fecha que el primero

            expect(res).to.have.status(409);
            expect(res.body.message).to.include('Ya existe un evento');
        });

        it('Debería rechazar creador inexistente (404)', async () => {
            const res = await chai.request(app)
                .post('/eventos')
                .send({
                    ...testEvento,
                    nombre: "Evento con creador falso",
                    creada_por: 999999
                });

            expect(res).to.have.status(404);
            expect(res.body.message).to.include('Usuario creador no existe');
        });
    });

    // Test GET /eventos
    describe('GET /eventos', () => {
        it('Debería listar todos los eventos ordenados por fecha (200)', async () => {
            // Crear eventos adicionales con diferentes fechas
            const eventoPasado = {
                nombre: "Evento Pasado",
                fecha: new Date(Date.now() - 86400000).toISOString() // Ayer
            };
            const eventoFuturo = {
                nombre: "Evento Futuro",
                fecha: new Date(Date.now() + 172800000).toISOString() // Pasado mañana
            };

            await Promise.all([
                chai.request(app).post('/eventos').send(eventoPasado),
                chai.request(app).post('/eventos').send(eventoFuturo)
            ]);

            const res = await chai.request(app)
                .get('/eventos');

            expect(res).to.have.status(200);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.be.at.least(3);
            
            // Verificar orden por fecha ascendente
            const fechas = res.body.data.map(e => new Date(e.fecha).getTime());
            const fechasOrdenadas = [...fechas].sort((a, b) => a - b);
            expect(fechas).to.deep.equal(fechasOrdenadas);

            // Verificar estructura de datos
            expect(res.body.data[0]).to.include.all.keys(
                'id', 'nombre', 'descripcion', 'fecha', 'creada_por', 
                'creador_nombre', 'boletos_vendidos'
            );
        });

        it('Debería obtener un evento específico por ID (200)', async () => {
            const res = await chai.request(app)
                .get(`/eventos/${testEventoId}`);

            expect(res).to.have.status(200);
            expect(res.body.data.id).to.equal(testEventoId);
            expect(res.body.data).to.include({
                nombre: testEvento.nombre,
                descripcion: testEvento.descripcion
            });
            expect(res.body.data).to.have.property('creador_nombre');
        });

        it('Debería fallar con ID inexistente (404)', async () => {
            const res = await chai.request(app)
                .get('/eventos/999999');

            expect(res).to.have.status(404);
        });
    });

    // Test PUT /eventos/:id
    describe('PUT /eventos/:id', () => {
        it('Debería actualizar nombre y descripción (200)', async () => {
            const updatedData = {
                nombre: "Evento Actualizado",
                descripcion: "Nueva descripción"
            };

            const res = await chai.request(app)
                .put(`/eventos/${testEventoId}`)
                .send(updatedData);

            expect(res).to.have.status(200);
            expect(res.body.data).to.include(updatedData);
        });

        it('Debería actualizar solo la fecha (200)', async () => {
            const nuevaFecha = new Date(Date.now() + 259200000).toISOString(); // 3 días después
            const res = await chai.request(app)
                .put(`/eventos/${testEventoId}`)
                .send({ fecha: nuevaFecha });

            expect(res).to.have.status(200);
            expect(res.body.data.fecha).to.equal(nuevaFecha);
        });

        it('Debería rechazar actualización con fecha pasada (400)', async () => {
            const res = await chai.request(app)
                .put(`/eventos/${testEventoId}`)
                .send({ fecha: "2000-01-01" });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Fecha inválida');
        });

        it('Debería rechazar actualización con nombre duplicado en misma fecha (409)', async () => {
            // Crear otro evento
            const otroEvento = {
                nombre: "Evento para conflicto",
                fecha: new Date(Date.now() + 345600000).toISOString() // 4 días después
            };
            const createRes = await chai.request(app)
                .post('/eventos')
                .send(otroEvento);

            // Intentar actualizar el primer evento con el mismo nombre y fecha
            const res = await chai.request(app)
                .put(`/eventos/${testEventoId}`)
                .send({
                    nombre: otroEvento.nombre,
                    fecha: otroEvento.fecha
                });

            expect(res).to.have.status(409);
        });

        it('Debería permitir actualización parcial (200)', async () => {
            const res = await chai.request(app)
                .put(`/eventos/${testEventoId}`)
                .send({ descripcion: "Descripción actualizada" });

            expect(res).to.have.status(200);
            expect(res.body.data.descripcion).to.equal("Descripción actualizada");
            // Verificar que otros campos no cambiaron
            expect(res.body.data.nombre).to.equal("Evento Actualizado");
        });
    });

    // Test DELETE /eventos/:id
    describe('DELETE /eventos/:id', () => {
        it('Debería eliminar un evento sin boletos asociados (200)', async () => {
            // Crear un evento para eliminar
            const eventoToDelete = {
                nombre: "Evento a Eliminar",
                fecha: new Date(Date.now() + 432000000).toISOString() // 5 días después
            };
            const createRes = await chai.request(app)
                .post('/eventos')
                .send(eventoToDelete);

            const deleteRes = await chai.request(app)
                .delete(`/eventos/${createRes.body.data.id}`);

            expect(deleteRes).to.have.status(200);
            expect(deleteRes.body.data.nombre).to.equal(eventoToDelete.nombre);

            // Verificar que ya no existe
            const getRes = await chai.request(app)
                .get(`/eventos/${createRes.body.data.id}`);
            expect(getRes).to.have.status(404);
        });

        it('Debería rechazar eliminación de evento con boletos asociados (403)', async () => {
            // Crear un boleto asociado al evento de prueba
            await pool.query(
                "INSERT INTO boletos (usuario_id, evento_id, asiento) VALUES ($1, $2, $3)",
                [testUsuarioId, testEventoId, "A1"]
            );

            const res = await chai.request(app)
                .delete(`/eventos/${testEventoId}`);

            expect(res).to.have.status(403);
            expect(res.body.message).to.include('No se puede eliminar');

            // Limpiar el boleto creado
            await pool.query("DELETE FROM boletos WHERE evento_id = $1", [testEventoId]);
        });

        it('Debería fallar al eliminar evento inexistente (404)', async () => {
            const res = await chai.request(app)
                .delete('/eventos/999999');

            expect(res).to.have.status(404);
        });
    });

    // Pruebas adicionales
    describe('Validaciones adicionales', () => {
        it('Debería manejar descripción con exactamente 2000 caracteres (201)', async () => {
            const longDesc = {
                nombre: "Evento con descripción larga",
                descripcion: "a".repeat(2000),
                fecha: new Date(Date.now() + 518400000).toISOString() // 6 días después
            };

            const res = await chai.request(app)
                .post('/eventos')
                .send(longDesc);

            expect(res).to.have.status(201);
            expect(res.body.data.descripcion).to.have.lengthOf(2000);
        });

        it('Debería rechazar descripción con más de 2000 caracteres (400)', async () => {
            const res = await chai.request(app)
                .post('/eventos')
                .send({
                    nombre: "Evento con descripción muy larga",
                    descripcion: "a".repeat(2001),
                    fecha: new Date(Date.now() + 604800000).toISOString() // 7 días después
                });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Descripción demasiado larga');
        });

        it('Debería mostrar 0 boletos vendidos para evento nuevo (200)', async () => {
            const eventoRes = await chai.request(app)
                .post('/eventos')
                .send({
                    nombre: "Evento sin boletos",
                    fecha: new Date(Date.now() + 691200000).toISOString() // 8 días después
                });

            const listRes = await chai.request(app).get('/eventos');
            const eventoEnLista = listRes.body.data.find(e => e.id === eventoRes.body.data.id);

            expect(eventoEnLista.boletos_vendidos).to.equal('0');
        });
    });
});