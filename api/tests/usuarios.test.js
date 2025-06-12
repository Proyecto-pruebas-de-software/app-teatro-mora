process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../index');
const expect = chai.expect;
const pool = require('../queries/queries_usuarios').pool;

chai.use(chaiHttp);

describe('API CRUD de Usuarios', function() {
    this.timeout(10000);

    let testUserId;
    const testUser = {
        nombre: 'Usuario Test',
        email: 'test@example.com',
        password: 'Test123!',
        rol: 'cliente'
    };

before(async () => {
    // Limpiar datos de prueba en orden seguro
    await pool.query("DELETE FROM mensajes_foro WHERE mensaje LIKE '%prueba%'");
    await pool.query("DELETE FROM boletos WHERE asiento LIKE 'A1%'");
    await pool.query("DELETE FROM usuarios WHERE email LIKE '%@example.com'");
    
    // Asegurar que el usuario de prueba no existe
    await pool.query("DELETE FROM usuarios WHERE email = $1", [testUser.email]);
});

after(async () => {
    // Limpieza final (el CASCADE se encargará de las relaciones)
    await pool.query("DELETE FROM usuarios WHERE email LIKE '%@example.com'");

if (app.close) {
        await app.close();
    }
});


    // Test POST /usuarios
    describe('POST /usuarios', () => {
        it('Debería crear un nuevo usuario con datos válidos (201)', async () => {
            const res = await chai.request(app)
                .post('/usuarios')
                .send(testUser);

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('status', true);
            expect(res.body.data).to.include({
                nombre: testUser.nombre,
                email: testUser.email,
                rol: testUser.rol
            });
            expect(res.body.data).to.have.property('id');
            testUserId = res.body.data.id;
        });

        it('Debería rechazar usuario sin nombre (400)', async () => {
            const res = await chai.request(app)
                .post('/usuarios')
                .send({
                    email: 'sin_nombre@test.com',
                    password: 'Test123!'
                });

            expect(res).to.have.status(400);
            expect(res.body.status).to.be.false;
            expect(res.body.message).to.include('Faltan campos requeridos');
        });

        it('Debería rechazar email inválido (400)', async () => {
            const res = await chai.request(app)
                .post('/usuarios')
                .send({
                    nombre: 'Usuario Email Inválido',
                    email: 'no-es-email',
                    password: 'Test123!'
                });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Email inválido');
        });

        it('Debería rechazar contraseña insegura (400)', async () => {
            const res = await chai.request(app)
                .post('/usuarios')
                .send({
                    nombre: 'Usuario Pass Inválida',
                    email: 'pass_invalida@test.com',
                    password: '123' // Contraseña insegura
                });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('contraseña');
        });

        it('Debería rechazar email duplicado (409)', async () => {
            const res = await chai.request(app)
                .post('/usuarios')
                .send(testUser); // Mismo email que el primero

            expect(res).to.have.status(409);
            expect(res.body.message).to.include('El email ya está registrado');
        });
    });

    // Test GET /usuarios
    describe('GET /usuarios', () => {
        it('Debería listar todos los usuarios (200)', async () => {
            const res = await chai.request(app)
                .get('/usuarios');

            expect(res).to.have.status(200);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.some(u => u.email === testUser.email)).to.be.true;
            expect(res.body.data[0]).to.include.all.keys(
                'id', 'nombre', 'email', 'rol'
            );
        });

        it('Debería obtener un usuario específico por ID (200)', async () => {
            const res = await chai.request(app)
                .get(`/usuarios/${testUserId}`);

            expect(res).to.have.status(200);
            expect(res.body.data.id).to.equal(testUserId);
            expect(res.body.data).to.include({
                nombre: testUser.nombre,
                email: testUser.email
            });
        });

        it('Debería fallar con ID inexistente (404)', async () => {
            const res = await chai.request(app)
                .get('/usuarios/999999');

            expect(res).to.have.status(404);
        });
    });

    // Test PUT /usuarios/:id
    describe('PUT /usuarios/:id', () => {
        it('Debería actualizar un usuario (200)', async () => {
            const updatedData = {
                nombre: 'Usuario Actualizado',
                email: 'updated@example.com',
                rol: 'admin'
            };

            const res = await chai.request(app)
                .put(`/usuarios/${testUserId}`)
                .send(updatedData);

            expect(res).to.have.status(200);
            expect(res.body.data).to.include(updatedData);
        });

        it('Debería rechazar actualización con email inválido (400)', async () => {
            const res = await chai.request(app)
                .put(`/usuarios/${testUserId}`)
                .send({
                    email: 'email-invalido'
                });

            expect(res).to.have.status(400);
            expect(res.body.message).to.include('Email inválido');
        });

        it('Debería rechazar actualización con email duplicado (409)', async () => {
            // Crear otro usuario
            const otroUsuario = {
                nombre: 'Otro Usuario',
                email: 'otro@example.com',
                password: 'Test123!'
            };
            await chai.request(app).post('/usuarios').send(otroUsuario);

            // Intentar actualizar el primer usuario con el mismo email
            const res = await chai.request(app)
                .put(`/usuarios/${testUserId}`)
                .send({
                    email: 'otro@example.com'
                });

            expect(res).to.have.status(409);
        });
    });

    // Test DELETE /usuarios/:id
    describe('DELETE /usuarios/:id', () => {
        it('Debería eliminar un usuario existente (200)', async () => {
            // Primero creamos un usuario para eliminar
            const usuarioToDelete = {
                nombre: 'Usuario a Eliminar',
                email: 'delete@example.com',
                password: 'Test123!'
            };
            const createRes = await chai.request(app)
                .post('/usuarios')
                .send(usuarioToDelete);

            const deleteRes = await chai.request(app)
                .delete(`/usuarios/${createRes.body.data.id}`);

            expect(deleteRes).to.have.status(200);
            expect(deleteRes.body.data.email).to.equal(usuarioToDelete.email);

            // Verificar que ya no existe
            const getRes = await chai.request(app)
                .get(`/usuarios/${createRes.body.data.id}`);
            expect(getRes).to.have.status(404);
        });

        it('Debería fallar al eliminar usuario inexistente (404)', async () => {
            const res = await chai.request(app)
                .delete('/usuarios/999999');

            expect(res).to.have.status(404);
        });

        it('Debería rechazar eliminación si tiene boletos asociados (403)', async () => {
            // Crear un boleto asociado al usuario de prueba
            await pool.query(`
                INSERT INTO eventos (nombre, fecha) 
                VALUES ('Evento para boleto', NOW() + interval '1 day')
            `);
            const eventoRes = await pool.query('SELECT id FROM eventos WHERE nombre = $1', ['Evento para boleto']);
            await pool.query(
                "INSERT INTO boletos (usuario_id, evento_id, asiento) VALUES ($1, $2, $3)",
                [testUserId, eventoRes.rows[0].id, "A1"]
            );

            const res = await chai.request(app)
                .delete(`/usuarios/${testUserId}`);

            expect(res).to.have.status(403);
            expect(res.body.message).to.include('No se puede eliminar');

            // Limpiar datos de prueba
            await pool.query("DELETE FROM boletos WHERE usuario_id = $1", [testUserId]);
            await pool.query("DELETE FROM eventos WHERE nombre = $1", ['Evento para boleto']);
        });
    });

    // Pruebas adicionales
    describe('Validaciones adicionales', () => {
        it('Debería crear usuario con rol por defecto (cliente) si no se especifica (201)', async () => {
            const usuarioSinRol = {
                nombre: 'Usuario Sin Rol',
                email: 'sinrol@example.com',
                password: 'Test123!'
            };

            const res = await chai.request(app)
                .post('/usuarios')
                .send(usuarioSinRol);

            expect(res).to.have.status(201);
            expect(res.body.data.rol).to.equal('cliente');
        });

        it('Debería aceptar nombre con caracteres especiales (áéíóúñ) (201)', async () => {
            const res = await chai.request(app)
                .post('/usuarios')
                .send({
                    nombre: 'María José López Niño',
                    email: 'especial@example.com',
                    password: 'Test123!'
                });

            expect(res).to.have.status(201);
        });
    });
});
