const express = require('express');
const cors    = require('cors');
const sql     = require('mssql');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const cfg = {
    server: 'DESKTOP-LMEFOGG', port: 1433,
    user: 'sa', password: 'sexo',
    database: 'GimnasioUniversitario',
    options: { encrypt: false, trustServerCertificate: true }
};
sql.connect(cfg, e => e ? console.log('Error BD:', e) : console.log('Conectado a SQL Server'));

// ═══════════════════════════════════════════
//  EJERCICIOS
// ═══════════════════════════════════════════
app.post('/api/ejercicios', (req, res) => {
    const p = new sql.Request();
    p.input('nombre',         sql.VarChar, req.body.nombre);
    p.input('video_url',      sql.VarChar, req.body.video);
    p.input('grupo_muscular', sql.VarChar, req.body.grupo_muscular);
    p.query("INSERT INTO ejercicios (nombre,video_url,grupo_muscular) VALUES (@nombre,@video_url,@grupo_muscular)",
        err => err ? res.status(500).send('Error') : res.status(200).send({ mensaje: 'Ejercicio guardado' })
    );
});
app.get('/api/ejercicios', (req, res) =>
    new sql.Request().query('SELECT * FROM ejercicios', (err, r) =>
        err ? res.status(500).send('Error') : res.json(r.recordset)
    )
);

// ═══════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════
app.post('/api/login', (req, res) => {
    const p = new sql.Request();
    p.input('carnet',     sql.VarChar, req.body.carnet);
    p.input('contrasena', sql.VarChar, req.body.contrasena);
    p.query("SELECT id,carnet,nombre_completo,codigo_estudiantil,rol,foto_perfil,imc_guardado,edad,sexo,facultad,carrera FROM usuarios WHERE carnet=@carnet AND contrasena=@contrasena",
        (err, r) => {
            if (err) return res.status(500).send({ mensaje: 'Error' });
            r.recordset.length > 0 ? res.status(200).send(r.recordset[0]) : res.status(401).send({ mensaje: 'Credenciales incorrectas' });
        }
    );
});

app.post('/api/registro', (req, res) => {
    const b = req.body;
    const p = new sql.Request();
    p.input('carnet',               sql.VarChar, b.correo);
    p.input('contrasena',           sql.VarChar, 'univo123');
    p.input('nombre_completo',      sql.VarChar, b.nombre);
    p.input('codigo_estudiantil',   sql.VarChar, b.codigo_estudiantil || null);
    p.input('rol',                  sql.VarChar, 'alumno');
    p.input('edad',                 sql.Int,     b.edad);
    p.input('sexo',                 sql.VarChar, b.sexo);
    p.input('facultad',             sql.VarChar, b.facultad);
    p.input('carrera',              sql.VarChar, b.carrera);
    p.query(`INSERT INTO usuarios (carnet,contrasena,nombre_completo,codigo_estudiantil,rol,edad,sexo,facultad,carrera)
             VALUES (@carnet,@contrasena,@nombre_completo,@codigo_estudiantil,@rol,@edad,@sexo,@facultad,@carrera)`,
        err => err ? (console.log(err), res.status(500).send({ mensaje: 'Error' })) : res.status(200).send({ mensaje: 'Alumno registrado' })
    );
});

app.put('/api/usuarios/contrasena', (req, res) => {
    const { id, contrasena_actual, contrasena_nueva } = req.body;
    const p = new sql.Request();
    p.input('id',               sql.Int,     id);
    p.input('contrasena_actual',sql.VarChar, contrasena_actual);
    p.query("SELECT id FROM usuarios WHERE id=@id AND contrasena=@contrasena_actual", (err, r) => {
        if (err) return res.status(500).send({ mensaje: 'Error' });
        if (!r.recordset.length) return res.status(401).send({ mensaje: 'Contraseña actual incorrecta' });
        const p2 = new sql.Request();
        p2.input('id',               sql.Int,     id);
        p2.input('contrasena_nueva', sql.VarChar, contrasena_nueva);
        p2.query("UPDATE usuarios SET contrasena=@contrasena_nueva WHERE id=@id",
            e => e ? res.status(500).send({ mensaje: 'Error al actualizar' }) : res.status(200).send({ mensaje: 'Contraseña actualizada' })
        );
    });
});

// ═══════════════════════════════════════════
//  RESERVAS
// ═══════════════════════════════════════════
app.get('/api/reservas', (req, res) => {
    new sql.Request().query(
        `SELECT r.id, r.usuario_id, r.maquina_nombre, r.dia_hora, r.hora_entrada, r.hora_salida,
                r.nombre_alumno, r.codigo_alumno, r.facultad_alumno, r.carrera_alumno,
                r.edad_alumno, r.sexo_alumno, r.completado, r.eliminado
         FROM reservas_maquinas r WHERE r.eliminado = 0`,
        (err, rs) => {
            if (err) { console.log(err); return res.status(500).send({ mensaje: 'Error' }); }
            const datos = rs.recordset.map(rv => {
                const pts  = rv.dia_hora.split(' ');
                const dia  = `${pts[0]} ${pts[1]}`;
                const hstr = pts[2] || '';
                const [he, hs] = hstr.includes('-') ? hstr.split('-') : [hstr, hstr];
                return {
                    id: rv.id, usuario_id: rv.usuario_id,
                    maquina: rv.maquina_nombre, dia,
                    hora: rv.hora_entrada || he,
                    hora_entrada: rv.hora_entrada || he,
                    hora_salida:  rv.hora_salida  || hs,
                    nombre_alumno:   rv.nombre_alumno,
                    codigo_alumno:   rv.codigo_alumno,
                    facultad_alumno: rv.facultad_alumno,
                    carrera_alumno:  rv.carrera_alumno,
                    edad_alumno:     rv.edad_alumno,
                    sexo_alumno:     rv.sexo_alumno,
                    completado: rv.completado,
                    eliminado:  rv.eliminado
                };
            });
            res.status(200).send(datos);
        }
    );
});

app.post('/api/reservas', async (req, res) => {
    const { usuario_id, maquina, dia, hora_entrada, hora_salida,
            nombre_alumno, codigo_alumno, facultad_alumno, carrera_alumno,
            edad_alumno, sexo_alumno } = req.body;

    // Límite 3 reservas por usuario/día/hora
    try {
        const ck = new sql.Request();
        ck.input('usuario_id',   sql.Int,     usuario_id);
        ck.input('dia',          sql.VarChar, dia);
        ck.input('hora_entrada', sql.VarChar, hora_entrada);
        const cr = await ck.query(
            "SELECT COUNT(*) AS total FROM reservas_maquinas WHERE usuario_id=@usuario_id AND hora_entrada=@hora_entrada AND dia_hora LIKE @dia+' %' AND eliminado=0"
        );
        if (cr.recordset[0].total >= 3)
            return res.status(409).send({ mensaje: 'Ya tienes 3 reservas en ese día y hora.' });
    } catch(e) { return res.status(500).send({ mensaje: 'Error validación' }); }

    const diaHora = `${dia} ${hora_entrada}-${hora_salida}`;
    const p = new sql.Request();
    p.input('usuario_id',      sql.Int,     usuario_id);
    p.input('maquina_nombre',  sql.VarChar, maquina);
    p.input('dia_hora',        sql.VarChar, diaHora);
    p.input('hora_entrada',    sql.VarChar, hora_entrada);
    p.input('hora_salida',     sql.VarChar, hora_salida);
    p.input('nombre_alumno',   sql.VarChar, nombre_alumno   || null);
    p.input('codigo_alumno',   sql.VarChar, codigo_alumno   || null);
    p.input('facultad_alumno', sql.VarChar, facultad_alumno || null);
    p.input('carrera_alumno',  sql.VarChar, carrera_alumno  || null);
    p.input('edad_alumno',     sql.Int,     edad_alumno     || null);
    p.input('sexo_alumno',     sql.VarChar, sexo_alumno     || null);
    p.query(`INSERT INTO reservas_maquinas
             (usuario_id,maquina_nombre,dia_hora,hora_entrada,hora_salida,
              nombre_alumno,codigo_alumno,facultad_alumno,carrera_alumno,edad_alumno,sexo_alumno)
             VALUES (@usuario_id,@maquina_nombre,@dia_hora,@hora_entrada,@hora_salida,
                     @nombre_alumno,@codigo_alumno,@facultad_alumno,@carrera_alumno,@edad_alumno,@sexo_alumno)`,
        err => err ? (console.log(err), res.status(500).send({ mensaje: 'Error' })) : res.status(200).send({ mensaje: 'Reserva creada' })
    );
});

// DELETE usuario — solo sus reservas no confirmadas
app.delete('/api/reservas/:id', (req, res) => {
    const p = new sql.Request();
    p.input('id',         sql.Int, req.params.id);
    p.input('usuario_id', sql.Int, req.body.usuario_id);
    p.query("UPDATE reservas_maquinas SET eliminado=1 WHERE id=@id AND usuario_id=@usuario_id AND completado=0",
        (err, r) => {
            if (err) return res.status(500).send({ mensaje: 'Error' });
            r.rowsAffected[0] === 0
                ? res.status(403).send({ mensaje: 'No puedes eliminar esta reserva (ya fue confirmada o no te pertenece).' })
                : res.status(200).send({ mensaje: 'Reserva eliminada' });
        }
    );
});

// DELETE admin
app.delete('/api/admin/reservas/:id', (req, res) => {
    const p = new sql.Request();
    p.input('id', sql.Int, req.params.id);
    p.query("UPDATE reservas_maquinas SET eliminado=1 WHERE id=@id AND completado=0",
        (err, r) => {
            if (err) return res.status(500).send({ mensaje: 'Error' });
            r.rowsAffected[0] === 0
                ? res.status(403).send({ mensaje: 'La reserva ya fue confirmada.' })
                : res.status(200).send({ mensaje: 'Eliminada' });
        }
    );
});

// PUT admin — confirmar reserva  (enriquece con datos del usuario si no los tiene)
app.put('/api/admin/reservas/:id/completar', async (req, res) => {
    try {
        // Traemos la reserva
        const pr = new sql.Request();
        pr.input('id', sql.Int, req.params.id);
        const rr = await pr.query("SELECT * FROM reservas_maquinas WHERE id=@id");
        if (!rr.recordset.length) return res.status(404).send({ mensaje: 'Reserva no encontrada' });
        const rv = rr.recordset[0];

        // Si no tiene datos del alumno, los obtenemos de la tabla usuarios
        let nombre = rv.nombre_alumno, codigo = rv.codigo_alumno,
            facultad = rv.facultad_alumno, carrera = rv.carrera_alumno,
            edad = rv.edad_alumno, sexo = rv.sexo_alumno;

        if (!nombre) {
            const pu = new sql.Request();
            pu.input('id', sql.Int, rv.usuario_id);
            const ru = await pu.query(
                "SELECT nombre_completo,codigo_estudiantil,facultad,carrera,edad,sexo FROM usuarios WHERE id=@id"
            );
            if (ru.recordset.length) {
                const u = ru.recordset[0];
                nombre   = u.nombre_completo;
                codigo   = u.codigo_estudiantil;
                facultad = u.facultad;
                carrera  = u.carrera;
                edad     = u.edad;
                sexo     = u.sexo;
            }
        }

        const pu = new sql.Request();
        pu.input('id',       sql.Int,     req.params.id);
        pu.input('nombre',   sql.VarChar, nombre   || null);
        pu.input('codigo',   sql.VarChar, codigo   || null);
        pu.input('facultad', sql.VarChar, facultad || null);
        pu.input('carrera',  sql.VarChar, carrera  || null);
        pu.input('edad',     sql.Int,     edad     || null);
        pu.input('sexo',     sql.VarChar, sexo     || null);
        await pu.query(`UPDATE reservas_maquinas SET completado=1,
            nombre_alumno=@nombre, codigo_alumno=@codigo,
            facultad_alumno=@facultad, carrera_alumno=@carrera,
            edad_alumno=@edad, sexo_alumno=@sexo WHERE id=@id`);

        // Devolvemos los datos actualizados para que el frontend se actualice sin reload
        res.status(200).send({
            mensaje: 'Reserva confirmada',
            datos_alumno: { nombre_alumno:nombre, codigo_alumno:codigo,
                            facultad_alumno:facultad, carrera_alumno:carrera,
                            edad_alumno:edad, sexo_alumno:sexo }
        });
    } catch(e) {
        console.log(e);
        res.status(500).send({ mensaje: 'Error al confirmar' });
    }
});

// ═══════════════════════════════════════════
//  PERFIL
// ═══════════════════════════════════════════
app.put('/api/usuarios/perfil', (req, res) => {
    const { id, foto_perfil, imc } = req.body;
    const p = new sql.Request();
    p.input('id', sql.Int, id);
    const cols = [];
    if (foto_perfil !== undefined) { p.input('foto_perfil',  sql.VarChar(sql.MAX), foto_perfil); cols.push("foto_perfil=@foto_perfil"); }
    if (imc         !== undefined) { p.input('imc_guardado', sql.VarChar,          imc);         cols.push("imc_guardado=@imc_guardado"); }
    if (!cols.length) return res.status(400).send({ mensaje: 'Nada que actualizar' });
    p.query(`UPDATE usuarios SET ${cols.join(',')} WHERE id=@id`,
        err => err ? res.status(500).send({ mensaje: 'Error' }) : res.status(200).send({ mensaje: 'Perfil actualizado' })
    );
});

// ═══════════════════════════════════════════
//  RUTINAS
// ═══════════════════════════════════════════
app.get('/api/rutinas/:usuario_id', (req, res) => {
    const p = new sql.Request();
    p.input('usuario_id', sql.Int, req.params.usuario_id);
    p.query("SELECT id,ejercicio_nombre,completado FROM usuario_rutinas WHERE usuario_id=@usuario_id",
        (err, r) => err ? res.status(500).send({ mensaje: 'Error' }) : res.status(200).send(r.recordset)
    );
});
app.post('/api/rutinas', (req, res) => {
    const p = new sql.Request();
    p.input('usuario_id',       sql.Int,     req.body.usuario_id);
    p.input('ejercicio_nombre', sql.VarChar, req.body.ejercicio_nombre);
    p.query("INSERT INTO usuario_rutinas (usuario_id,ejercicio_nombre,completado) VALUES (@usuario_id,@ejercicio_nombre,0)",
        err => err ? res.status(500).send({ mensaje: 'Error' }) : res.status(200).send({ mensaje: 'Agregado' })
    );
});
app.put('/api/rutinas/toggle', (req, res) => {
    const p = new sql.Request();
    p.input('id',        sql.Int, req.body.id);
    p.input('completado',sql.Bit, req.body.completado);
    p.query("UPDATE usuario_rutinas SET completado=@completado WHERE id=@id",
        err => err ? res.status(500).send({ mensaje: 'Error' }) : res.status(200).send({ mensaje: 'Actualizado' })
    );
});
app.delete('/api/rutinas/limpiar/:usuario_id', (req, res) => {
    const p = new sql.Request();
    p.input('usuario_id', sql.Int, req.params.usuario_id);
    p.query("DELETE FROM usuario_rutinas WHERE usuario_id=@usuario_id",
        err => err ? res.status(500).send({ mensaje: 'Error' }) : res.status(200).send({ mensaje: 'Vaciada' })
    );
});

// ═══════════════════════════════════════════
//  REPORTES  (solo reservas confirmadas)
// ═══════════════════════════════════════════
app.get('/api/reportes/semanal', async (req, res) => {
    try {
        const p = new sql.Request();
        // Reservas confirmadas con todos los datos del alumno
        const rRes = await p.query(`
            SELECT maquina_nombre, dia_hora, hora_entrada, hora_salida,
                   nombre_alumno, codigo_alumno, facultad_alumno, carrera_alumno,
                   edad_alumno, sexo_alumno
            FROM reservas_maquinas
            WHERE completado=1 AND eliminado=0
            ORDER BY dia_hora
        `);
        const rEj = await p.query(`
            SELECT TOP 10 ejercicio_nombre, COUNT(*) AS veces_agregado
            FROM usuario_rutinas
            GROUP BY ejercicio_nombre
            ORDER BY veces_agregado DESC
        `);
        res.status(200).send({ reservas: rRes.recordset, ejercicios: rEj.recordset });
    } catch(e) {
        res.status(500).send({ mensaje: 'Error al obtener datos' });
    }
});

app.get('/', (req, res) => res.send('Servidor GYM UNIVO activo'));
app.listen(3000, () => console.log('Puerto 3000'));

// DELETE ejercicio (solo admin)
app.delete('/api/ejercicios/:id', (req, res) => {
    const p = new sql.Request();
    p.input('id', sql.Int, req.params.id);
    p.query("DELETE FROM ejercicios WHERE id=@id", (err, r) => {
        if (err) { console.log(err); return res.status(500).send({ mensaje: 'Error al eliminar' }); }
        r.rowsAffected[0] === 0
            ? res.status(404).send({ mensaje: 'Ejercicio no encontrado' })
            : res.status(200).send({ mensaje: 'Ejercicio eliminado' });
    });
});