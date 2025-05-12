process.env.NODE_ENV = 'test';

'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;

chai.use(chaiHttp);

const app = require('../index');
const { pool, _test, clearActorsForTesting } = require('../queries/queries_actores');

describe('API CRUD de Actores', function() {
    this.timeout(15000); // Timeout aumentado para transacciones

    let testActorId;
    const testActor = {
        nombre: 'Actor de Prueba',
        biografia: 'Biografía de prueba para testing',
        foto_url: 'https://ejemplo.com/foto.jpg'
    };

    // Limpiar DB y verificar conexión antes de comenzar
    before(async () => {
        try {
            await clearActorsForTesting();
            await pool.query('SELECT 1'); // Test de conexión
        } catch (error) {
            console.error('Error en before hook:', error);
            throw error;
        }
    });

    // Tests para validaciones
    describe('Validaciones', () => {
        it('Debería validar nombres correctamente', () => {
            expect(_test.validateName('Nombre Válido')).to.be.true;
            expect(_test.validateName('Nombre con acento áéíóú')).to.be.true;
            expect(_test.validateName('Nombre con guión')).to.be.true;
            expect(_test.validateName('Nombre con punto.')).to.be.true;
            expect(_test.validateName('N')).to.be.true;
            expect(_test.validateName('a'.repeat(100))).to.be.true;
            expect(_test.validateName('Nombre Inválido @#$')).to.be.false;
            expect(_test.validateName('')).to.be.false;
            expect(_test.validateName(null)).to.be.false;
            expect(_test.validateName(undefined)).to.be.false;
            expect(_test.validateName('a'.repeat(101))).to.be.false;
        });

        it('Debería validar biografías correctamente', () => {
            expect(_test.validateBiography('Biografía corta')).to.be.true;
            expect(_test.validateBiography('a'.repeat(2000))).to.be.true;
            expect(_test.validateBiography(null)).to.be.true;
            expect(_test.validateBiography(undefined)).to.be.true;
            expect(_test.validateBiography('')).to.be.true;
            expect(_test.validateBiography('a'.repeat(2001))).to.be.false;
            expect(_test.validateBiography(123)).to.be.false;
        });

        it('Debería validar URLs de foto correctamente', () => {
            expect(_test.validatePhotoUrl('https://ejemplo.com/foto.jpg')).to.be.true;
            expect(_test.validatePhotoUrl('http://ejemplo.com/foto.jpg')).to.be.true;
            expect(_test.validatePhotoUrl(null)).to.be.true;
            expect(_test.validatePhotoUrl(undefined)).to.be.true;
            expect(_test.validatePhotoUrl('')).to.be.true;
            expect(_test.validatePhotoUrl('no-es-una-url')).to.be.false;
            expect(_test.validatePhotoUrl('a'.repeat(256))).to.be.false;
        });
    });

    // Test POST /actores
    describe('POST /actores', () => {
        it('Debería crear un nuevo actor con datos válidos (201)', async () => {
            const res = await chai.request(app)
                .post('/actores')
                .send(testActor);

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('status', true);
            expect(res.body).to.have.property('code', 201);
            expect(res.body.data).to.include({
                nombre: testActor.nombre,
                foto_url: testActor.foto_url
            });
            expect(res.body.data).to.have.property('id');
            testActorId = res.body.data.id;
        });

        it('Debería crear actor sin biografía ni foto (201)', async () => {
            const res = await chai.request(app)
                .post('/actores')
                .send({
                    nombre: 'Actor sin datos opcionales'
                });

            expect(res).to.have.status(201);
            expect(res.body.data.nombre).to.equal('Actor sin datos opcionales');
            expect(res.body.data.foto_url).to.be.null;
            expect(res.body.data.biografia).to.be.null;
        });

        it('Debería rechazar actor sin nombre (400)', async () => {
            const res = await chai.request(app)
                .post('/actores')
                .send({
                    biografia: 'Biografía sin nombre'
                });

            expect(res).to.have.status(400);
            expect(res.body.status).to.be.false;
            expect(res.body.message).to.include('Nombre inválido');
        });

        it('Debería rechazar nombre con caracteres inválidos (400)', async () => {
            const res = await chai.request(app)
                .post('/actores')
                .send({
                    nombre: 'Actor Inválido @#$',
                    biografia: 'Biografía válida'
                });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Nombre inválido');
        });

        it('Debería rechazar URL de foto inválida (400)', async () => {
            const res = await chai.request(app)
                .post('/actores')
                .send({
                    nombre: 'Actor con URL inválida',
                    foto_url: 'no-es-una-url'
                });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('URL de foto inválida');
        });

        it('Debería rechazar actor con nombre duplicado (409)', async () => {
            const res = await chai.request(app)
                .post('/actores')
                .send(testActor);

            expect(res).to.have.status(409);
            expect(res.body.message).to.include('Ya existe un actor con ese nombre');
        });
    });

    // Test GET /actores
    describe('GET /actores', () => {
        it('Debería listar todos los actores ordenados por nombre (200)', async () => {
            const res = await chai.request(app)
                .get('/actores');

            expect(res).to.have.status(200);
            expect(res.body.data).to.be.an('array').that.is.not.empty;
            
            const nombres = res.body.data.map(a => a.nombre);
            const nombresOrdenados = [...nombres].sort();
            expect(nombres).to.deep.equal(nombresOrdenados);

            expect(res.body.data[0]).to.include.all.keys(
                'id', 'nombre', 'foto_url', 'biografia_resumen'
            );
        });

        it('Debería obtener un actor específico por ID (200)', async () => {
            const res = await chai.request(app)
                .get(`/actores/${testActorId}`);

            expect(res).to.have.status(200);
            expect(res.body.data.id).to.equal(testActorId);
            expect(res.body.data).to.include({
                nombre: testActor.nombre,
                biografia: testActor.biografia
            });
        });

        it('Debería fallar con ID inexistente (404)', async () => {
            const res = await chai.request(app)
                .get('/actores/999999');

            expect(res).to.have.status(404);
            expect(res.body.message).to.include('Actor no encontrado');
        });

        it('Debería fallar con ID inválido (400)', async () => {
            const res = await chai.request(app)
                .get('/actores/abc');

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('ID debe ser un número entero positivo');
        });
    });

    // Test PUT /actores/:id
    describe('PUT /actores/:id', () => {
        it('Debería actualizar solo el nombre (200)', async () => {
            const updatedData = { nombre: 'Actor Actualizado' };
            const res = await chai.request(app)
                .put(`/actores/${testActorId}`)
                .send(updatedData);

            expect(res).to.have.status(200);
            expect(res.body.data.nombre).to.equal(updatedData.nombre);
            expect(res.body.data.biografia).to.equal(testActor.biografia);
        });

        it('Debería actualizar solo la biografía (200)', async () => {
            const updatedData = { biografia: 'Nueva biografía actualizada' };
            const res = await chai.request(app)
                .put(`/actores/${testActorId}`)
                .send(updatedData);

            expect(res).to.have.status(200);
            expect(res.body.data.biografia).to.equal(updatedData.biografia);
        });

        it('Debería rechazar actualización con ID inexistente (404)', async () => {
            const res = await chai.request(app)
                .put('/actores/999999')
                .send({ nombre: 'Actor Inexistente' });

            expect(res).to.have.status(404);
        });

        it('Debería rechazar actualización con ID inválido (400)', async () => {
            const res = await chai.request(app)
                .put('/actores/abc')
                .send({ nombre: 'Actor Inválido' });

            expect(res).to.have.status(400);
        });

        it('Debería rechazar actualización con nombre existente (409)', async () => {
            const otroActor = {
                nombre: 'Actor Conflictivo',
                biografia: 'Biografía'
            };
            await chai.request(app).post('/actores').send(otroActor);

            const res = await chai.request(app)
                .put(`/actores/${testActorId}`)
                .send({ nombre: 'Actor Conflictivo' });

            expect(res).to.have.status(409);
        });
    });

    // Test DELETE /actores/:id
    describe('DELETE /actores/:id', () => {
        it('Debería eliminar un actor existente (200)', async () => {
            const res = await chai.request(app)
                .delete(`/actores/${testActorId}`);

            expect(res).to.have.status(200);
            expect(res.body.data.id).to.equal(testActorId);

            const getRes = await chai.request(app)
                .get(`/actores/${testActorId}`);
            expect(getRes).to.have.status(404);
        });

        it('Debería fallar al eliminar actor inexistente (404)', async () => {
            const res = await chai.request(app)
                .delete('/actores/999999');

            expect(res).to.have.status(404);
        });

        it('Debería fallar al eliminar con ID inválido (400)', async () => {
            const res = await chai.request(app)
                .delete('/actores/abc');

            expect(res).to.have.status(400);
        });
    });

    after(async () => {
        try {
            await clearActorsForTesting();
            await pool.end();
        } catch (error) {
            console.error('Error en after hook:', error);
        }
    });
});