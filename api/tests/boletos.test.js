const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../index');
const expect = chai.expect;
const pool = require('../queries/queries_boletos').pool;

chai.use(chaiHttp);

describe('API CRUD de Boletos', function() {
    this.timeout(10000);

    let testUsuarioId;
    let testEventoId;
    let testBoletoId;
    
    const testBoleto = {
        usuario_id: null,
        evento_id: null,
        asiento: "A12",
        turno_numero: 5,
        fue_usado: false
    };

    before(async () => {
        // Limpiar datos anteriores
        await pool.query("DELETE FROM boletos WHERE asiento LIKE 'A1%'");
        await pool.query("DELETE FROM usuarios WHERE email = 'boleto_test@example.com'");
        await pool.query("DELETE FROM eventos WHERE nombre = 'Evento Boleto Test'");

        // Crear usuario de prueba
        const usuarioRes = await pool.query(
            "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id",
            ["Usuario Boleto Test", "boleto_test@example.com", "password123", "cliente"]
        );
        testUsuarioId = usuarioRes.rows[0].id;

        // Crear evento de prueba
        const eventoRes = await pool.query(
            "INSERT INTO eventos (nombre, fecha, descripcion) VALUES ($1, $2, $3) RETURNING id",
            ["Evento Boleto Test", new Date(), "Evento para pruebas de boletos"]
        );
        testEventoId = eventoRes.rows[0].id;

        testBoleto.usuario_id = testUsuarioId;
        testBoleto.evento_id = testEventoId;
    });

    after(async () => {
        // Limpiar datos generados
        await pool.query("DELETE FROM boletos WHERE asiento LIKE 'A1%'");
        await pool.query("DELETE FROM usuarios WHERE email = 'boleto_test@example.com'");
        await pool.query("DELETE FROM eventos WHERE nombre = 'Evento Boleto Test'");

        // Cerrar app y conexiones si existe el método
        if (app.close) {
            await app.close();
        }
    });

    // POST tests
    describe('POST /boletos', () => {
        it('Debería crear un nuevo boleto con datos válidos (201)', async () => {
            const res = await chai.request(app)
                .post('/boletos')
                .send(testBoleto);

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('status', true);
            expect(res.body.data).to.include({
                asiento: testBoleto.asiento,
                fue_usado: false
            });
            expect(res.body.data).to.have.property('id');
            testBoletoId = res.body.data.id;
        });

        it('Debería rechazar boleto sin datos requeridos (400)', async () => {
            const res = await chai.request(app)
                .post('/boletos')
                .send({
                    asiento: "B10",
                    fue_usado: false
                });

            expect(res).to.have.status(400);
            expect(res.body.status).to.be.false;
            expect(res.body.message).to.include('Faltan campos requeridos: usuario_id, evento_id o asiento');
        });

        it('Debería rechazar asiento con formato inválido (400)', async () => {
            const badBoleto = {...testBoleto, asiento: "123A"};
            const res = await chai.request(app)
                .post('/boletos')
                .send(badBoleto);

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Formato de asiento inválido');
        });

        it('Debería rechazar asiento ya ocupado (409)', async () => {
            const res = await chai.request(app)
                .post('/boletos')
                .send(testBoleto);

            expect(res).to.have.status(409);
            expect(res.body.message).to.include('El asiento ya está ocupado');
        });

        it('Debería crear boleto sin turno_numero (201)', async () => {
            const boletoSinTurno = {...testBoleto, asiento: "A13", turno_numero: null};
            const res = await chai.request(app)
                .post('/boletos')
                .send(boletoSinTurno);

            expect(res).to.have.status(201);
            expect(res.body.data.turno_numero).to.be.null;
        });
    });

    // GET tests
    describe('GET /boletos', () => {
        it('Debería listar todos los boletos (200)', async () => {
            const res = await chai.request(app)
                .get('/boletos');

            expect(res).to.have.status(200);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.be.at.least(1);
            expect(res.body.data[0]).to.include.all.keys(
                'id', 'asiento', 'fue_usado', 'usuario_nombre', 'evento_nombre'
            );
        });

        it('Debería obtener un boleto específico por ID (200)', async () => {
            const res = await chai.request(app)
                .get(`/boletos/${testBoletoId}`);

            expect(res).to.have.status(200);
            expect(res.body.data.id).to.equal(testBoletoId);
            expect(res.body.data).to.include({
                asiento: testBoleto.asiento,
                fue_usado: false
            });
        });

        it('Debería fallar con ID inexistente (404)', async () => {
            const res = await chai.request(app)
                .get('/boletos/999999');

            expect(res).to.have.status(404);
        });
    });

    // PUT tests
    describe('PUT /boletos/:id', () => {
        it('Debería actualizar el estado de uso de un boleto (200)', async () => {
            const res = await chai.request(app)
                .put(`/boletos/${testBoletoId}`)
                .send({ fue_usado: true });

            expect(res).to.have.status(200);
            expect(res.body.data.fue_usado).to.be.true;
        });

        it('Debería actualizar el asiento de un boleto (200)', async () => {
            const res = await chai.request(app)
                .put(`/boletos/${testBoletoId}`)
                .send({ asiento: "A14" });

            expect(res).to.have.status(200);
            expect(res.body.data.asiento).to.equal("A14");
        });

        it('Debería rechazar actualización con asiento inválido (400)', async () => {
            const res = await chai.request(app)
                .put(`/boletos/${testBoletoId}`)
                .send({ asiento: "123" });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Formato de asiento inválido');
        });

        it('Debería rechazar actualización con asiento ocupado (409)', async () => {
            const otroBoleto = {...testBoleto, asiento: "A15"};
            await chai.request(app).post('/boletos').send(otroBoleto);

            const res = await chai.request(app)
                .put(`/boletos/${testBoletoId}`)
                .send({ asiento: "A15" });

            expect(res).to.have.status(409);
        });

        it('Debería rechazar actualización con usuario/evento inexistente (404)', async () => {
            const res = await chai.request(app)
                .put(`/boletos/${testBoletoId}`)
                .send({ usuario_id: 999999 });

            expect(res).to.have.status(404);
        });
    });

    // DELETE tests
    describe('DELETE /boletos/:id', () => {
        it('Debería eliminar un boleto existente (200)', async () => {
            const boletoToDelete = {...testBoleto, asiento: "A16"};
            const createRes = await chai.request(app)
                .post('/boletos')
                .send(boletoToDelete);

            const deleteRes = await chai.request(app)
                .delete(`/boletos/${createRes.body.data.id}`);

            expect(deleteRes).to.have.status(200);
            expect(deleteRes.body.data.asiento).to.equal("A16");

            const getRes = await chai.request(app)
                .get(`/boletos/${createRes.body.data.id}`);
            expect(getRes).to.have.status(404);
        });

        it('Debería fallar al eliminar boleto inexistente (404)', async () => {
            const res = await chai.request(app)
                .delete('/boletos/999999');

            expect(res).to.have.status(404);
        });
    });

    // Validaciones adicionales
    describe('Validaciones adicionales', () => {
        it('Debería rechazar turno_numero no entero (400)', async () => {
            const res = await chai.request(app)
                .post('/boletos')
                .send({
                    ...testBoleto,
                    asiento: "A17",
                    turno_numero: "no es un número"
                });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Número de turno debe ser un entero');
        });

        it('Debería aceptar boleto con fue_usado=true (201)', async () => {
            const res = await chai.request(app)
                .post('/boletos')
                .send({
                    ...testBoleto,
                    asiento: "A18",
                    fue_usado: true
                });

            expect(res).to.have.status(201);
            expect(res.body.data.fue_usado).to.be.true;
        });
    });
});
