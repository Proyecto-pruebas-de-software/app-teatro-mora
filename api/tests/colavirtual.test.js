process.env.NODE_ENV = 'test';
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../index');
const expect = chai.expect;
const pool = require('../queries/queries_colavirtual').pool;

chai.use(chaiHttp);

describe('API CRUD de Cola Virtual', function() {
    this.timeout(10000);

    let testUsuarioId;
    let testEventoId;
    let testColaId;
    
    const testCola = {
        usuario_id: null,
        evento_id: null,
        turno_numero: 1,
        en_turno: false
    };

    before(async () => {
        // Limpiar datos anteriores
        await pool.query("DELETE FROM cola_virtual WHERE turno_numero BETWEEN 1 AND 1000");
        await pool.query("DELETE FROM usuarios WHERE email = 'cola_test@example.com'");
        await pool.query("DELETE FROM eventos WHERE nombre = 'Evento Cola Test'");

        // Crear usuario de prueba
        const usuarioRes = await pool.query(
            "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id",
            ["Usuario Cola Test", "cola_test@example.com", "password123", "cliente"]
        );
        testUsuarioId = usuarioRes.rows[0].id;

        // Crear evento de prueba
        const eventoRes = await pool.query(
            "INSERT INTO eventos (nombre, fecha, descripcion) VALUES ($1, $2, $3) RETURNING id",
            ["Evento Cola Test", new Date(), "Evento para pruebas de cola virtual"]
        );
        testEventoId = eventoRes.rows[0].id;

        testCola.usuario_id = testUsuarioId;
        testCola.evento_id = testEventoId;
    });

    after(async () => {
        await pool.query("DELETE FROM cola_virtual WHERE turno_numero BETWEEN 1 AND 1000");
        await pool.query("DELETE FROM usuarios WHERE email = 'cola_test@example.com'");
        await pool.query("DELETE FROM eventos WHERE nombre = 'Evento Cola Test'");

        if (app.close) {
        await app.close();
    }
    });

    // Test POST /cola
    describe('POST /cola', () => {
        it('Debería crear un nuevo registro en cola con datos válidos (201)', async () => {
            const res = await chai.request(app)
                .post('/cola')
                .send(testCola);

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('status', true);
            expect(res.body.data).to.include({
                turno_numero: testCola.turno_numero,
                en_turno: false
            });
            expect(res.body.data).to.have.property('id');
            testColaId = res.body.data.id;
        });

        it('Debería rechazar registro sin datos requeridos (400)', async () => {
            const res = await chai.request(app)
                .post('/cola')
                .send({
                    turno_numero: 2,
                    en_turno: false
                });

            expect(res).to.have.status(400);
            expect(res.body.status).to.be.false;
            expect(res.body.message).to.include('Faltan campos requeridos');
        });

        it('Debería rechazar turno_numero no positivo (400)', async () => {
            const badCola = {...testCola, turno_numero: 0};
            const res = await chai.request(app)
                .post('/cola')
                .send(badCola);

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Número de turno inválido');
        });

        it('Debería rechazar turno_numero no entero (400)', async () => {
            const badCola = {...testCola, turno_numero: 1.5};
            const res = await chai.request(app)
                .post('/cola')
                .send(badCola);

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Número de turno inválido');
        });

        it('Debería rechazar turno_numero duplicado para mismo evento (409)', async () => {
            const res = await chai.request(app)
                .post('/cola')
                .send(testCola); // Mismo turno que el primero

            expect(res).to.have.status(409);
            expect(res.body.message).to.include('El número de turno ya está en uso');
        });

        it('Debería permitir turno_numero duplicado para diferente evento (201)', async () => {
            // Crear otro evento
            const otroEvento = await pool.query(
                "INSERT INTO eventos (nombre, fecha, descripcion) VALUES ($1, $2, $3) RETURNING id",
                ["Evento Cola Test 2", new Date(), "Segundo evento para pruebas"]
            );
            const otroEventoId = otroEvento.rows[0].id;

            const otroCola = {
                usuario_id: testUsuarioId,
                evento_id: otroEventoId,
                turno_numero: testCola.turno_numero, // Mismo número de turno
                en_turno: false
            };

            const res = await chai.request(app)
                .post('/cola')
                .send(otroCola);

            expect(res).to.have.status(201);
            
            // Limpiar el evento creado
            await pool.query("DELETE FROM eventos WHERE id = $1", [otroEventoId]);
        });
    });

    // Test GET /cola
    describe('GET /cola', () => {
        it('Debería listar todos los registros de cola (200)', async () => {
            const res = await chai.request(app)
                .get('/cola');

            expect(res).to.have.status(200);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.be.at.least(1);
            expect(res.body.data[0]).to.include.all.keys(
                'id', 'turno_numero', 'en_turno', 'usuario_nombre', 'evento_nombre'
            );
        });

        it('Debería obtener un registro específico por ID (200)', async () => {
            const res = await chai.request(app)
                .get(`/cola/${testColaId}`);

            expect(res).to.have.status(200);
            expect(res.body.data.id).to.equal(testColaId);
            expect(res.body.data).to.include({
                turno_numero: testCola.turno_numero,
                en_turno: false
            });
            expect(res.body.data).to.have.property('usuario_nombre');
            expect(res.body.data).to.have.property('evento_nombre');
        });

        it('Debería fallar con ID inexistente (404)', async () => {
            const res = await chai.request(app)
                .get('/cola/999999');

            expect(res).to.have.status(404);
        });
    });

    // Test PUT /cola/:id
    describe('PUT /cola/:id', () => {
        it('Debería actualizar el estado en_turno (200)', async () => {
            const res = await chai.request(app)
                .put(`/cola/${testColaId}`)
                .send({ en_turno: true });

            expect(res).to.have.status(200);
            expect(res.body.data.en_turno).to.be.true;
        });

        it('Debería actualizar el turno_numero (200)', async () => {
            const res = await chai.request(app)
                .put(`/cola/${testColaId}`)
                .send({ turno_numero: 3 });

            expect(res).to.have.status(200);
            expect(res.body.data.turno_numero).to.equal(3);
        });

        it('Debería rechazar actualización con turno_numero inválido (400)', async () => {
            const res = await chai.request(app)
                .put(`/cola/${testColaId}`)
                .send({ turno_numero: -1 });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Número de turno inválido');
        });

        it('Debería rechazar actualización con en_turno no booleano (400)', async () => {
            const res = await chai.request(app)
                .put(`/cola/${testColaId}`)
                .send({ en_turno: "no es booleano" });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Estado de turno inválido');
        });

        it('Debería rechazar actualización con usuario/evento inexistente (404)', async () => {
            const res = await chai.request(app)
                .put(`/cola/${testColaId}`)
                .send({ usuario_id: 999999 });

            expect(res).to.have.status(404);
        });
    });

    // Test DELETE /cola/:id
    describe('DELETE /cola/:id', () => {
        it('Debería eliminar un registro existente (200)', async () => {
            // Primero creamos un registro para eliminar
            const colaToDelete = {...testCola, turno_numero: 4};
            const createRes = await chai.request(app)
                .post('/cola')
                .send(colaToDelete);

            const deleteRes = await chai.request(app)
                .delete(`/cola/${createRes.body.data.id}`);

            expect(deleteRes).to.have.status(200);
            expect(deleteRes.body.data.turno_numero).to.equal(4);

            // Verificar que ya no existe
            const getRes = await chai.request(app)
                .get(`/cola/${createRes.body.data.id}`);
            expect(getRes).to.have.status(404);
        });

        it('Debería fallar al eliminar registro inexistente (404)', async () => {
            const res = await chai.request(app)
                .delete('/cola/999999');

            expect(res).to.have.status(404);
        });
    });

    // Pruebas adicionales
    describe('Validaciones adicionales', () => {
        it('Debería ordenar los registros por turno_numero ASC', async () => {
            // Crear varios registros con turnos desordenados
            const cola1 = {...testCola, turno_numero: 10};
            const cola2 = {...testCola, turno_numero: 5};
            const cola3 = {...testCola, turno_numero: 7};

            await Promise.all([
                chai.request(app).post('/cola').send(cola1),
                chai.request(app).post('/cola').send(cola2),
                chai.request(app).post('/cola').send(cola3)
            ]);

            const res = await chai.request(app).get('/cola');
            expect(res).to.have.status(200);
            
            // Verificar orden
            const turnos = res.body.data.map(item => item.turno_numero);
            const sortedTurnos = [...turnos].sort((a, b) => a - b);
            expect(turnos).to.deep.equal(sortedTurnos);
        });

        it('Debería crear registro con en_turno=true (201)', async () => {
            const res = await chai.request(app)
                .post('/cola')
                .send({
                    ...testCola,
                    turno_numero: 20,
                    en_turno: true
                });

            expect(res).to.have.status(201);
            expect(res.body.data.en_turno).to.be.true;
        });
    });
});
