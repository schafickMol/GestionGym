const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();

// Configuraciones básicas
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 1. CONFIGURACIÓN DE LA BASE DE DATOS
// Nota: Ajusta 'usuario_de_tu_sql' y 'tu_contrasena' con los datos que usas para entrar al Management Studio.
// Si entras con Autenticación de Windows, usualmente se requiere configurar un usuario de SQL Server (como el usuario 'sa').
const configBaseDatos = {
    server: 'localhost',
    port: 1433,          // 👈 ¡Agregamos el puerto que acabamos de activar!
    user: 'sa',          
    password: 'steven',  // Tu contraseña confirmada
    database: 'GimnasioUniversitario',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// 2. CONECTAR A LA BASE DE DATOS
sql.connect(configBaseDatos, function(error) {
    if (error) {
        console.log('Error al conectar a la base de datos:', error);
    } else {
        console.log('¡Conexión exitosa a SQL Server!');
    }
});

// 4. RUTA PARA GUARDAR UN NUEVO EJERCICIO (POST)
app.post('/api/ejercicios', function(req, res) {
    // Recibimos los datos que nos mandará React
    const nuevoEjercicio = req.body;

    // Preparamos la orden para SQL Server
    const peticion = new sql.Request();
    
    // Le pasamos los valores de forma segura para evitar hackeos
    peticion.input('nombre', sql.VarChar, nuevoEjercicio.nombre);
    peticion.input('video_url', sql.VarChar, nuevoEjercicio.video);
    peticion.input('grupo_muscular', sql.VarChar, nuevoEjercicio.grupo_muscular);

    // Escribimos la consulta clásica de SQL de INSERCIÓN
    const consulta = "INSERT INTO ejercicios (nombre, video_url, grupo_muscular) VALUES (@nombre, @video_url, @grupo_muscular)";

    peticion.query(consulta, function(error, resultado) {
        if (error) {
            console.log('Error al guardar el ejercicio:', error);
            res.status(500).send('Error al guardar en la base de datos');
        } else {
            // Le avisamos a React que todo salió bien
            res.status(200).send({ mensaje: 'Ejercicio guardado en SQL Server' });
        }
    });
});

// 3. RUTA PARA OBTENER LOS EJERCICIOS (Nuestra primera API)
app.get('/api/ejercicios', function(req, res) {
    // Creamos una nueva petición SQL
    const peticion = new sql.Request();
    
    // Ejecutamos el query para traer los ejercicios
    peticion.query('SELECT * FROM ejercicios', function(error, resultado) {
        if (error) {
            console.log('Error al consultar los ejercicios:', error);
            res.status(500).send('Error en el servidor');
        } else {
            // Enviamos los registros en formato JSON a React
            res.json(resultado.recordset);
        }
    });
});
// 5. RUTA PARA INICIAR SESIÓN (LOGIN)
app.post('/api/login', function(req, res) {
    // Recibimos el carnet y la contraseña que React nos enviará
    const datosLogin = req.body;

    const peticion = new sql.Request();
    
    // Inyectamos las variables de forma segura
    peticion.input('carnet', sql.VarChar, datosLogin.carnet);
    peticion.input('contrasena', sql.VarChar, datosLogin.contrasena);

    // Buscamos al usuario en la base de datos. 
    // Nota: NO seleccionamos la contraseña por seguridad, solo los datos útiles.
    const consulta = "SELECT id, carnet, nombre_completo, rol, foto_perfil, imc_guardado FROM usuarios WHERE carnet = @carnet AND contrasena = @contrasena";

    peticion.query(consulta, function(error, resultado) {
        if (error) {
            console.log('Error al intentar iniciar sesión:', error);
            res.status(500).send({ mensaje: 'Error en el servidor' });
        } else {
            // Revisamos si la base de datos encontró un registro que coincida
            if (resultado.recordset.length > 0) {
                // Si existe, devolvemos la información del usuario a React
                res.status(200).send(resultado.recordset[0]);
            } else {
                // Si no existe, enviamos un error 401 (No Autorizado)
                res.status(401).send({ mensaje: 'Carnet o contraseña incorrectos' });
            }
        }
    });
});
// 6. RUTA PARA REGISTRAR UN NUEVO ALUMNO
app.post('/api/registro', function(req, res) {
    const nuevoAlumno = req.body;
    const peticion = new sql.Request();

    peticion.input('carnet', sql.VarChar, nuevoAlumno.correo);
    peticion.input('contrasena', sql.VarChar, 'univo123');
    peticion.input('nombre_completo', sql.VarChar, nuevoAlumno.nombre);
    peticion.input('rol', sql.VarChar, 'alumno');
    peticion.input('edad', sql.Int, nuevoAlumno.edad);
    peticion.input('sexo', sql.VarChar, nuevoAlumno.sexo);
    peticion.input('facultad', sql.VarChar, nuevoAlumno.facultad);
    peticion.input('carrera', sql.VarChar, nuevoAlumno.carrera);

    const consulta = `
        INSERT INTO usuarios (carnet, contrasena, nombre_completo, rol, edad, sexo, facultad, carrera) 
        VALUES (@carnet, @contrasena, @nombre_completo, @rol, @edad, @sexo, @facultad, @carrera)
    `;

    peticion.query(consulta, function(error, resultado) {
        if (error) {
            console.log('Error al registrar alumno en SQL:', error);
            res.status(500).send({ mensaje: 'Error interno del servidor' });
        } else {
            res.status(200).send({ mensaje: 'Alumno registrado exitosamente' });
        }
    });
});

// RUTA POST: Crear nueva reserva
app.post('/api/reservas', function(req, res) {
    const { usuario_id, maquina, dia, hora } = req.body;
    const peticion = new sql.Request();

    // Unimos el día y la hora en un solo string para tu columna dia_hora (Ej: "1 Lun 07:00")
    const diaHoraUnido = `${dia} ${hora}`;

    peticion.input('usuario_id', sql.Int, usuario_id);
    peticion.input('maquina_nombre', sql.VarChar, maquina);
    peticion.input('dia_hora', sql.VarChar, diaHoraUnido);

    const consulta = "INSERT INTO reservas_maquinas (usuario_id, maquina_nombre, dia_hora) VALUES (@usuario_id, @maquina_nombre, @dia_hora)";

    peticion.query(consulta, function(error, resultado) {
        if (error) {
            console.log('Error al guardar la reserva en SQL:', error);
            res.status(500).send({ mensaje: 'Error interno del servidor' });
        } else {
            res.status(200).send({ mensaje: 'Reserva creada exitosamente' });
        }
    });
});

// RUTA GET: Obtener todas las reservas para mostrarlas en el calendario
app.get('/api/reservas', function(req, res) {
    const peticion = new sql.Request();

    const consulta = "SELECT id, usuario_id, maquina_nombre, dia_hora FROM reservas_maquinas";

    peticion.query(consulta, function(error, resultado) {
        if (error) {
            console.log('Error al obtener las reservas desde SQL:', error);
            res.status(500).send({ mensaje: 'Error interno del servidor' });
        } else {
            // Transformamos los datos antes de enviarlos al frontend para que el Dashboard los entienda
            const reservasFormateadas = resultado.recordset.map(reserva => {
                // Separamos "1 Lun 07:00" en dia ("1 Lun") y hora ("07:00")
                const partes = reserva.dia_hora.split(' ');
                const dia = `${partes[0]} ${partes[1]}`;
                const hora = partes[2];

                return {
                    id: reserva.id,
                    usuario_id: reserva.usuario_id,
                    maquina: reserva.maquina_nombre,
                    dia: dia,
                    hora: hora
                };
            });

            res.status(200).send(reservasFormateadas);
        }
    });
});

// RUTA PUT: Actualizar perfil (Foto o IMC)
app.put('/api/usuarios/perfil', function(req, res) {
    const { id, foto_perfil, imc } = req.body;
    const peticion = new sql.Request();

    peticion.input('id', sql.Int, id);

    // Construimos la consulta dinámicamente dependiendo de qué datos nos envíen
    let actualizaciones = [];
    if (foto_perfil !== undefined) {
        peticion.input('foto_perfil', sql.VarChar(sql.MAX), foto_perfil);
        actualizaciones.push("foto_perfil = @foto_perfil");
    }
    if (imc !== undefined) {
        peticion.input('imc_guardado', sql.VarChar, imc);
        actualizaciones.push("imc_guardado = @imc_guardado");
    }

    if (actualizaciones.length === 0) {
        return res.status(400).send({ mensaje: 'No hay datos para actualizar' });
    }

    const consulta = `UPDATE usuarios SET ${actualizaciones.join(', ')} WHERE id = @id`;

    peticion.query(consulta, function(error, resultado) {
        if (error) {
            console.log('Error al actualizar el perfil en SQL:', error);
            res.status(500).send({ mensaje: 'Error interno del servidor' });
        } else {
            res.status(200).send({ mensaje: 'Perfil actualizado correctamente' });
        }
    });
});

// A. GET: Obtener la rutina del usuario
app.get('/api/rutinas/:usuario_id', function(req, res) {
    const peticion = new sql.Request();
    peticion.input('usuario_id', sql.Int, req.params.usuario_id);

    peticion.query("SELECT id, ejercicio_nombre, completado FROM usuario_rutinas WHERE usuario_id = @usuario_id", function(error, resultado) {
        if (error) {
            console.log('Error al obtener la rutina:', error);
            res.status(500).send({ mensaje: 'Error del servidor' });
        } else {
            res.status(200).send(resultado.recordset);
        }
    });
});

// B. POST: Agregar un ejercicio a la rutina
app.post('/api/rutinas', function(req, res) {
    const { usuario_id, ejercicio_nombre } = req.body;
    const peticion = new sql.Request();

    peticion.input('usuario_id', sql.Int, usuario_id);
    peticion.input('ejercicio_nombre', sql.VarChar, ejercicio_nombre);

    peticion.query("INSERT INTO usuario_rutinas (usuario_id, ejercicio_nombre, completado) VALUES (@usuario_id, @ejercicio_nombre, 0)", function(error, resultado) {
        if (error) {
            console.log('Error al agregar ejercicio:', error);
            res.status(500).send({ mensaje: 'Error al agregar' });
        } else {
            res.status(200).send({ mensaje: 'Ejercicio agregado' });
        }
    });
});

// C. PUT: Alternar el estado completado (0 o 1)
app.put('/api/rutinas/toggle', function(req, res) {
    const { id, completado } = req.body;
    const peticion = new sql.Request();

    peticion.input('id', sql.Int, id);
    peticion.input('completado', sql.Bit, completado);

    peticion.query("UPDATE usuario_rutinas SET completado = @completado WHERE id = @id", function(error, resultado) {
        if (error) {
            console.log('Error al actualizar ejercicio:', error);
            res.status(500).send({ mensaje: 'Error al actualizar' });
        } else {
            res.status(200).send({ mensaje: 'Estado actualizado' });
        }
    });
});

// D. DELETE: Vaciar la rutina entera del usuario
app.delete('/api/rutinas/limpiar/:usuario_id', function(req, res) {
    const peticion = new sql.Request();
    peticion.input('usuario_id', sql.Int, req.params.usuario_id);

    peticion.query("DELETE FROM usuario_rutinas WHERE usuario_id = @usuario_id", function(error, resultado) {
        if (error) {
            console.log('Error al limpiar la rutina:', error);
            res.status(500).send({ mensaje: 'Error al limpiar' });
        } else {
            res.status(200).send({ mensaje: 'Rutina vaciada correctamente' });
        }
    });
});

// RUTA PARA REPORTES DEL ADMINISTRADOR
app.get('/api/reportes/semanal', async function(req, res) {
    try {
        const peticion = new sql.Request();
        
        // Consulta 1: Total de reservas agrupadas por día
        const resReservas = await peticion.query(`
            SELECT dia_hora, COUNT(*) as total_reservas 
            FROM reservas_maquinas 
            GROUP BY dia_hora;
        `);

        // Consulta 2: Top 10 ejercicios más elegidos en las rutinas
        const resEjercicios = await peticion.query(`
            SELECT TOP 10 ejercicio_nombre, COUNT(*) as veces_agregado 
            FROM usuario_rutinas 
            GROUP BY ejercicio_nombre 
            ORDER BY veces_agregado DESC
        `);

        // Devolvemos ambos paquetes de datos en un solo JSON
        res.status(200).send({
            reservas: resReservas.recordset,
            ejercicios: resEjercicios.recordset
        });

    } catch (error) {
        console.log('Error generando el reporte:', error);
        res.status(500).send({ mensaje: 'Error al obtener los datos del reporte' });
    }
});

// Ruta de prueba inicial
app.get('/', function(req, res) {
    res.send('¡El servidor backend está vivo y configurado!');
});

// Encender el servidor
const puerto = 3000;
app.listen(puerto, function() {
    console.log('Servidor corriendo en el puerto ' + puerto);
});