-- Drop tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS reportes_mensajes CASCADE;
DROP TABLE IF EXISTS mensajes_foro CASCADE;
DROP TABLE IF EXISTS boletos CASCADE;
DROP TABLE IF EXISTS cola_virtual CASCADE;
DROP TABLE IF EXISTS actor_evento CASCADE;
DROP TABLE IF EXISTS actores_eventos CASCADE; -- Redundant, but good to clean up
DROP TABLE IF EXISTS evento_actores CASCADE; -- Redundant, but good to clean up
DROP TABLE IF EXISTS eventos CASCADE;
DROP TABLE IF EXISTS actores CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS usuarios_id_seq;
CREATE SEQUENCE IF NOT EXISTS eventos_id_seq;
CREATE SEQUENCE IF NOT EXISTS actores_id_seq;
CREATE SEQUENCE IF NOT EXISTS actor_evento_id_seq;
CREATE SEQUENCE IF NOT EXISTS boletos_id_seq;
CREATE SEQUENCE IF NOT EXISTS cola_virtual_id_seq;
CREATE SEQUENCE IF NOT EXISTS mensajes_foro_id_seq;
CREATE SEQUENCE IF NOT EXISTS reportes_mensajes_id_seq;

-- Create usuarios table
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY DEFAULT nextval('usuarios_id_seq'),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente'
);

-- Create actores table
CREATE TABLE actores (
    id INTEGER PRIMARY KEY DEFAULT nextval('actores_id_seq'),
    nombre VARCHAR(100) NOT NULL,
    biografia TEXT,
    foto_url TEXT
);

-- Create eventos table (using the more complete schema from schema.sql)
CREATE TABLE eventos (
    id INTEGER PRIMARY KEY DEFAULT nextval('eventos_id_seq'),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    aforo INTEGER NOT NULL,
    vendidos INTEGER DEFAULT 0,
    imagen_url TEXT,
    venta_inicio TIMESTAMP NOT NULL,
    creada_por INTEGER REFERENCES usuarios(id)
);

-- Create actor_evento table
CREATE TABLE actor_evento (
    id INTEGER PRIMARY KEY DEFAULT nextval('actor_evento_id_seq'),
    actor_id INTEGER NOT NULL REFERENCES actores(id),
    evento_id INTEGER NOT NULL REFERENCES eventos(id)
);

-- Create boletos table
CREATE TABLE boletos (
    id INTEGER PRIMARY KEY DEFAULT nextval('boletos_id_seq'),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    evento_id INTEGER NOT NULL REFERENCES eventos(id),
    asiento VARCHAR(100),
    turno_numero INTEGER,
    fue_usado BOOLEAN DEFAULT false,
    fecha_compra TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create cola_virtual table
CREATE TABLE cola_virtual (
    id INTEGER PRIMARY KEY DEFAULT nextval('cola_virtual_id_seq'),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    evento_id INTEGER NOT NULL REFERENCES eventos(id),
    turno_numero INTEGER NOT NULL,
    en_turno BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mensajes_foro table (corrected to match backend expectations and include evento_id)
CREATE TABLE mensajes_foro (
    id INTEGER PRIMARY KEY DEFAULT nextval('mensajes_foro_id_seq'),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    evento_id INTEGER REFERENCES eventos(id), -- Made nullable to accommodate messages not tied to specific events
    mensaje TEXT NOT NULL,
    creado_en TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    parent_mensaje_id INTEGER REFERENCES mensajes_foro(id) ON DELETE CASCADE -- Added for threading replies
);

-- Create Message Reports table
CREATE TABLE reportes_mensajes (
    id INTEGER PRIMARY KEY DEFAULT nextval('reportes_mensajes_id_seq'),
    mensaje_id INTEGER NOT NULL REFERENCES mensajes_foro(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    motivo TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraints
ALTER TABLE usuarios ADD CONSTRAINT unique_email UNIQUE (email);

-- Add indexes for better performance
CREATE INDEX idx_eventos_fecha ON eventos(fecha);
CREATE INDEX idx_boletos_evento ON boletos(evento_id);
CREATE INDEX idx_boletos_usuario ON boletos(usuario_id);
CREATE INDEX idx_cola_evento ON cola_virtual(evento_id);
CREATE INDEX idx_cola_usuario ON cola_virtual(usuario_id);
CREATE INDEX idx_mensajes_evento ON mensajes_foro(evento_id);
CREATE INDEX idx_mensajes_usuario ON mensajes_foro(usuario_id);
CREATE INDEX idx_reportes_mensaje ON reportes_mensajes(mensaje_id);
CREATE INDEX idx_reportes_usuario ON reportes_mensajes(usuario_id);

-- Test user with password: Test123!
INSERT INTO usuarios (nombre, email, password, rol)
VALUES (
    'Usuario Test',
    'test@example.com',
    '$2a$10$YourHashedPasswordHere',  -- This needs to be generated with bcrypt
    'user'
) ON CONFLICT (email) DO NOTHING;

-- Test admin with password: Admin123!
INSERT INTO usuarios (nombre, email, password, rol)
VALUES (
    'Maria',
    'admin@example.com',
    '$2a$10$YourHashedPasswordHere',  -- This needs to be generated with bcrypt
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert future events (from seed.sql, adapted for all columns)
INSERT INTO eventos (nombre, descripcion, fecha, hora, precio, aforo, vendidos, imagen_url, venta_inicio, creada_por) VALUES
(
    'Romeo y Julieta',
    'La clásica historia de amor de Shakespeare cobra vida en esta nueva producción.',
    '2025-05-15',
    '19:30:00',
    25.99,
    200,
    0,
    'https://placekeanu.com/400/300',
    '2025-04-15 00:00:00',
    (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)
),
(
    'El Lago de los Cisnes',
    'El ballet clásico por excelencia interpretado por nuestra compañía de danza.',
    '2025-06-01',
    '20:00:00',
    35.99,
    300,
    0,
    'https://placekeanu.com/400/300/grayscale',
    '2025-05-01 00:00:00',
    (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)
),
(
    'El Fantasma de la Ópera',
    'Un espectáculo musical que te dejará sin aliento.',
    '2025-06-15',
    '19:00:00',
    45.99,
    250,
    0,
    'https://placekeanu.com/400/300/young',
    '2025-05-15 00:00:00',
    (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)
),
('Festival de Teatro Contemporáneo', 'Un festival que reúne las mejores obras contemporáneas del momento.', '2026-06-20', '00:00:00', 0.00, 100, 0, 'https://placekeanu.com/400/300/baby', '2026-05-20 00:00:00', (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)),
('Monólogos de Medianoche', 'Una noche de humor y reflexión con los mejores monologuistas.', '2026-08-10', '00:00:00', 0.00, 100, 0, 'https://placekeanu.com/400/300/matrix', '2026-07-10 00:00:00', (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)),
('La Casa de Bernarda Alba', 'Clásico de Federico García Lorca interpretado por un elenco local.', '2026-09-05', '00:00:00', 0.00, 100, 0, 'https://placekeanu.com/400/300/bw', '2026-08-05 00:00:00', (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)),
('Improvisación en Escena', 'Show único donde el público decide el rumbo de la historia.', '2026-07-25', '00:00:00', 0.00, 100, 0, 'https://placekeanu.com/400/300/g', '2026-06-25 00:00:00', (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)),
('Danza Moderna: Evolución', 'Espectáculo de danza que explora los límites del movimiento.', '2026-08-30', '00:00:00', 0.00, 100, 0, 'https://placekeanu.com/400/300/old', '2026-07-30 00:00:00', (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)),
('Concierto de Música Clásica', 'La orquesta sinfónica presenta obras maestras de Mozart y Beethoven.', '2026-10-15', '00:00:00', 0.00, 100, 0, 'https://placekeanu.com/400/300/beard', '2026-09-15 00:00:00', (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)),
('Teatro Infantil: El Bosque Mágico', 'Una aventura mágica para toda la familia.', '2026-07-01', '00:00:00', 0.00, 100, 0, 'https://placekeanu.com/400/300/glasses', '2026-06-01 00:00:00', (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)),
('Noche de Stand-Up Comedy', 'Los mejores comediantes locales en una noche de risas.', '2026-08-05', '00:00:00', 0.00, 100, 0, 'https://placekeanu.com/400/300/suit', '2026-07-05 00:00:00', (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)),
('Obra Musical: Sueños de Broadway', 'Un recorrido por los mejores musicales de todos los tiempos.', '2026-09-20', '00:00:00', 0.00, 100, 0, 'https://placekeanu.com/400/300/sad', '2026-08-20 00:00:00', (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)),
('Performance Art: Metamorfosis', 'Una experiencia única que combina arte visual y teatro experimental.', '2026-11-01', '00:00:00', 0.00, 100, 0, 'https://placekeanu.com/400/300/happy', '2026-10-01 00:00:00', (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1));

-- Insert past events (from past_events.sql, adapted for all columns)
INSERT INTO eventos (nombre, descripcion, fecha, hora, precio, aforo, vendidos, imagen_url, venta_inicio, creada_por) VALUES
    (
        'El Lago de los Cisnes',
        'Una obra maestra del ballet clásico que cuenta la historia de Odette, una princesa convertida en cisne por un hechizo.',
        '2023-06-15',
        '19:00:00', -- Default hora
        20.00,      -- Default precio
        150,        -- Default aforo
        150,        -- Assume all sold for past events
        'https://placekeanu.com/400/300/0',       -- Default imagen_url
        '2023-05-15 00:00:00', -- Default venta_inicio
        (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)
    ),
    (
        'Romeo y Julieta',
        'La clásica historia de amor de Shakespeare presentada por nuestra compañía de teatro.',
        '2023-08-20',
        '20:00:00',
        25.00,
        180,
        180,
        'https://placekeanu.com/400/300/1',
        '2023-07-20 00:00:00',
        (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)
    ),
    (
        'Festival de Teatro Contemporáneo 2023',
        'Una semana dedicada a las mejores obras contemporáneas del momento.',
        '2023-09-10',
        '18:30:00',
        15.00,
        100,
        100,
        'https://placekeanu.com/400/300/2',
        '2023-08-10 00:00:00',
        (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)
    ),
    (
        'El Cascanueces',
        'El clásico ballet navideño que encanta a grandes y pequeños.',
        '2023-12-20',
        '17:00:00',
        30.00,
        200,
        200,
        'https://placekeanu.com/400/300/3',
        '2023-11-20 00:00:00',
        (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)
    ),
    (
        'Don Juan Tenorio',
        'La obra más representativa del romanticismo español.',
        '2024-01-15',
        '21:00:00',
        22.00,
        120,
        120,
        'https://placekeanu.com/400/300/4',
        '2023-12-15 00:00:00',
        (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)
    ),
    (
        'Gala de Danza Moderna',
        'Una noche especial con las mejores coreografías contemporáneas.',
        '2024-02-28',
        '19:30:00',
        28.00,
        170,
        170,
        'https://placekeanu.com/400/300/5',
        '2024-01-28 00:00:00',
        (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)
    ),
    (
        'Concierto de Primavera',
        'Un concierto que celebra la llegada de la primavera con piezas alegres y vibrantes.',
        '2024-03-22',
        '18:00:00',
        30.00,
        130,
        130,
        'https://placekeanu.com/400/300/6',
        '2024-02-22 00:00:00',
        (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1)
    );

-- Insert actor data (from test_data.sql)
INSERT INTO actores (nombre, biografia, foto_url) VALUES
('Ana García', 'Actriz con una década de experiencia en teatro clásico y contemporáneo. Ha recibido múltiples premios por sus interpretaciones dramáticas.', 'https://placekeanu.com/200/200'),
('Carlos Ruiz', 'Actor versátil conocido por sus papeles en comedias musicales y obras infantiles. También es un talentoso cantante y bailarín.', 'https://placekeanu.com/200/200/grayscale'),
('Sofía Hernández', 'Joven promesa del teatro, destacada por su intensidad en papeles trágicos. Se graduó con honores de la Real Escuela Superior de Arte Dramático.', 'https://placekeanu.com/200/200/young'),
('David Martínez', 'Actor de carácter con una amplia trayectoria en cine y televisión, aportando una presencia imponente a cada obra teatral.', 'https://placekeanu.com/200/200/baby'),
('Laura Pérez', 'Actriz con experiencia en teatro experimental y de improvisación. Su creatividad y espontaneidad la hacen única en el escenario.', 'https://placekeanu.com/200/200/matrix');

-- Link actors to events (example from test_data.sql)

-- Add some forum messages for these past events (from past_events.sql, adapted for 'mensaje' and 'creado_en')
INSERT INTO mensajes_foro (usuario_id, evento_id, mensaje, creado_en, parent_mensaje_id)
VALUES
    (
        (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1),
        (SELECT id FROM eventos WHERE nombre = 'El Lago de los Cisnes' AND fecha = '2023-06-15'),
        'La presentación fue un éxito total. ¡Gracias a todos por asistir!',
        '2023-06-16 10:00:00',
        NULL
    ),
    (
        (SELECT id FROM usuarios WHERE rol = 'user' LIMIT 1),
        (SELECT id FROM eventos WHERE nombre = 'Romeo y Julieta' AND fecha = '2023-08-20'),
        'Una interpretación maravillosa de este clásico. Los actores estuvieron excepcionales.',
        '2023-08-21 15:30:00',
        NULL
    ),
    (
        (SELECT id FROM usuarios WHERE rol = 'user' ORDER BY id DESC LIMIT 1),
        (SELECT id FROM eventos WHERE nombre = 'El Cascanueces' AND fecha = '2023-12-20'),
        'Mi familia y yo disfrutamos muchísimo del espectáculo navideño. ¡Esperamos que se repita el próximo año!',
        '2023-12-21 09:15:00',
        NULL
    ),
    (
        (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1),
        (SELECT id FROM eventos WHERE nombre = 'Gala de Danza Moderna' AND fecha = '2024-02-28'),
        'Gracias a todos los bailarines y al público por hacer de esta gala un momento inolvidable.',
        '2024-02-29 11:00:00',
        NULL
    );

-- Insert test forum messages (from test_data.sql, adapted for 'mensaje' and 'creado_en', and nullable evento_id)
INSERT INTO mensajes_foro (usuario_id, evento_id, mensaje, creado_en, parent_mensaje_id)
SELECT
    u.id,
    NULL, -- No specific event for these general messages
    'Este es un mensaje de prueba del foro. ¡Bienvenidos al Teatro Mora!',
    NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 7),
    NULL
FROM usuarios u
WHERE u.rol = 'admin'
LIMIT 1;

INSERT INTO mensajes_foro (usuario_id, evento_id, mensaje, creado_en, parent_mensaje_id)
SELECT
    u.id,
    NULL,
    'Me encantó la última obra que vi aquí. ¡Excelente producción!',
    NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 7),
    NULL
FROM usuarios u
WHERE u.rol = 'user'
LIMIT 1;

INSERT INTO mensajes_foro (usuario_id, evento_id, mensaje, creado_en, parent_mensaje_id)
SELECT
    u.id,
    NULL,
    '¿Alguien sabe cuándo empiezan las ventas para el próximo espectáculo?',
    NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 7),
    NULL
FROM usuarios u
WHERE u.rol = 'user'
LIMIT 1;

-- Add a reply to the first message about 'El Lago de los Cisnes'
INSERT INTO mensajes_foro (usuario_id, evento_id, mensaje, creado_en, parent_mensaje_id)
VALUES
    (
        (SELECT id FROM usuarios WHERE rol = 'user' LIMIT 1),
        (SELECT id FROM eventos WHERE nombre = 'El Lago de los Cisnes' AND fecha = '2023-06-15'),
        '¡Totalmente de acuerdo! Fue una noche mágica. Espero ver más ballets así.',
        '2023-06-16 11:30:00',
        (SELECT id FROM mensajes_foro WHERE mensaje LIKE 'La presentación fue un éxito total%' LIMIT 1)
    );

-- Add a reply to the message about 'Romeo y Julieta'
INSERT INTO mensajes_foro (usuario_id, evento_id, mensaje, creado_en, parent_mensaje_id)
VALUES
    (
        (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1),
        (SELECT id FROM eventos WHERE nombre = 'Romeo y Julieta' AND fecha = '2023-08-20'),
        'Nos alegra mucho que lo disfrutaran. ¡El elenco puso mucho esfuerzo en ella!',
        '2023-08-22 09:00:00',
        (SELECT id FROM mensajes_foro WHERE mensaje LIKE 'Una interpretación maravillosa%' LIMIT 1)
    );

-- Insert some test reports (from test_data.sql)
INSERT INTO reportes_mensajes (mensaje_id, usuario_id, motivo, fecha)
SELECT
    m.id,
    u.id,
    'Contenido inapropiado',
    NOW()
FROM mensajes_foro m
CROSS JOIN usuarios u
WHERE u.rol = 'user'
LIMIT 1; 