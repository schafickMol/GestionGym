import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const getDiasSemanaActual = () => {
  const hoy = new Date();
  const nombresDias = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const semana = [];

  const lunes = new Date(hoy);
  const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
  lunes.setDate(hoy.getDate() - diaSemana + 1);

  for (let i = 0; i < 6; i++) {
    const dia = new Date(lunes);
    dia.setDate(lunes.getDate() + i);
    semana.push(`${dia.getDate()} ${nombresDias[i]}`);
  }
  return semana;
};

// DICCIONARIO DE FACULTADES Y CARRERAS (Adaptado a UNIVO)
const facultadesYCarreras = {
  "Ingeniería y Arquitectura": [
    "Ingeniería en Sistemas Computacionales",
    "Ingeniería Industrial",
    "Ingeniería Civil",
    "Arquitectura"
  ],
  "Ciencias de la Salud": [
    "Doctorado en Medicina",
    "Licenciatura en Enfermería"
  ],
  "Ciencias Económicas": [
    "Licenciatura en Administración de Empresas",
    "Licenciatura en Contaduría Pública",
    "Técnico en Mercadeo"
  ],
  "Ciencias y Humanidades": [
    "Licenciatura en Comunicaciones",
    "Licenciatura en Idioma Inglés",
    "Licenciatura en Psicología"
  ],
  "Jurisprudencia": [
    "Licenciatura en Ciencias Jurídicas"
  ]
};

const listaFacultades = Object.keys(facultadesYCarreras);

// 1. CAMBIO: Agregamos "usuario" a las props
export default function Dashboard({ reservas, onAddReserva, imcGlobal, misRutinas, setMisRutinas, usuario }) {
  const days = getDiasSemanaActual();
  const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
  const [ejerciciosCompletados, setEjerciciosCompletados] = useState([]);
  
  const toggleCompletado = (ejercicioId, estadoActual) => {
    const nuevoEstado = estadoActual === 1 ? 0 : 1;

    fetch('http://localhost:3000/api/rutinas/toggle', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ejercicioId, completado: nuevoEstado })
    })
    .then(res => {
      if (res.ok) {
        // Actualizamos localmente el arreglo misRutinas cambiando el completado del ejercicio específico
        const rutinaActualizada = misRutinas.map(ej => 
          ej.id === ejercicioId ? { ...ej, completado: nuevoEstado } : ej
        );
        setMisRutinas(rutinaActualizada);
      }
    })
    .catch(err => console.log("Error al guardar estado completado:", err));
  };

  // Modificación para vaciar la rutina de SQL al terminar el entrenamiento
  const handleTerminarRutina = () => {
    if (window.confirm("¡Felicidades por terminar! ¿Deseas vaciar tu rutina para la próxima vez?")) {
      
      fetch(`http://localhost:3000/api/rutinas/limpiar/${usuario.id}`, {
        method: 'DELETE'
      })
      .then(res => {
        if (res.ok) {
          setMisRutinas([]); // Vaciamos la lista en pantalla
          alert("¡Rutina completada y guardada con éxito!");
        }
      })
      .catch(err => console.log("Error al limpiar rutina en SQL:", err));
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState('');

  
  const inputFileRef = useRef(null);

  const [nuevaReserva, setNuevaReserva] = useState({
    dia: days[0],
    hora: '07:00',
    maquina: 'Máquina Pecho'
  });

  // 2. CAMBIO: Agregamos facultad al estado del nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '', 
    correo: '', 
    edad: '', 
    sexo: 'Masculino', 
    facultad: listaFacultades[0], 
    carrera: facultadesYCarreras[listaFacultades[0]][0] 
  });

  const personasEnHora = reservas.filter(r => r.dia === nuevaReserva.dia && r.hora === nuevaReserva.hora).length;
  const personasEnMaquina = reservas.filter(r => r.dia === nuevaReserva.dia && r.hora === nuevaReserva.hora && r.maquina === nuevaReserva.maquina).length;
  const limiteAlcanzado = personasEnHora >= 10;

  // 1. Inicializar la foto con la que viene de SQL, si no hay, usar la por defecto

  const nombreParaAvatar = usuario?.nombre_completo || "Usuario";

  const [fotoPerfil, setFotoPerfil] = useState(
    usuario?.foto_perfil || "https://ui-avatars.com/api/?name=Usuario&background=0D1B2A&color=E0A96D&size=128"
  );

  // 2. Convertir imagen a Base64 y enviarla al servidor
  const handleCambiarFoto = (event) => {
    const file = event.target.files[0];
    if (file) {

      const pesoMaximo = 5 * 1024 * 1024; // 5 Megabytes en bytes
      if (file.size > pesoMaximo) {
        alert("La imagen es muy pesada. Por favor sube una foto menor a 5MB.");
        return; // Detiene la ejecución y no sube nada
      }

      const reader = new FileReader();
      
      // Cuando termine de leer el archivo, lo convierte en string (Base64)
      reader.onloadend = () => {
        const base64String = reader.result;
        setFotoPerfil(base64String); // Actualiza la vista inmediatamente

        // Enviar al Backend
        fetch('http://localhost:3000/api/usuarios/perfil', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: usuario.id,
            foto_perfil: base64String
          })
        })
        .then(res => res.json())
        .then(data => console.log('Foto guardada en SQL'))
        .catch(err => console.log('Error al guardar foto:', err));
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleGuardarReserva = (e) => {
    e.preventDefault();

    const esSabado = nuevaReserva.dia.includes('Sab');
    const horaNumero = parseInt(nuevaReserva.hora.split(':')[0]);
    if (esSabado && horaNumero > 11) {
      alert("Los sábados el gimnasio cierra a las 11:00 AM. No se pueden hacer reservas después de esa hora.");
      return;
    }

    if (limiteAlcanzado) return;

    // 1. Preparamos el objeto tal como lo espera el backend
    const nuevaReservaDB = {
      usuario_id: usuario.id, // Obtenemos el ID de la sesión actual
      maquina: nuevaReserva.maquina,
      dia: nuevaReserva.dia,
      hora: nuevaReserva.hora
    };

    // 2. Enviamos la petición POST
    fetch('http://localhost:3000/api/reservas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nuevaReservaDB)
    })
    .then(function(respuesta) {
      if (respuesta.ok) {
        // 3. Si se guardó en SQL, actualizamos visualmente el calendario
        const reservaFinal = {
          id: Date.now(), // ID temporal para el renderizado local
          ...nuevaReserva,
          cupo: `${personasEnMaquina + 1}/10`
        };

        onAddReserva(reservaFinal);
        setIsModalOpen(false);
      } else {
        throw new Error('Error al registrar la reserva en el servidor');
      }
    })
    .catch(function(error) {
      alert('Ocurrió un error al intentar guardar tu reserva.');
      console.log(error);
    });
  };

  // 3. CAMBIO: Lógica para manejar el cambio de facultad dinámico
  const handleFacultadChange = (e) => {
    const nuevaFacultad = e.target.value;
    setNuevoUsuario({
      ...nuevoUsuario,
      facultad: nuevaFacultad,
      // Al cambiar la facultad, reseteamos la carrera a la primera de la nueva lista
      carrera: facultadesYCarreras[nuevaFacultad][0] 
    });
  };

  const handleRegistrarUsuario = (e) => {
  e.preventDefault();
  setErrorRegistro('');

  if (!nuevoUsuario.correo.endsWith('@univo.edu.sv')) {
    setErrorRegistro('Error: El correo debe ser obligatoriamente institucional (@univo.edu.sv).');
    return;
  }

  // Enviamos los datos del formulario al backend
  fetch('http://localhost:3000/api/registro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nuevoUsuario)
  })
  .then(function(respuesta) {
    if (respuesta.ok) {
      alert(`Estudiante ${nuevoUsuario.nombre} registrado con éxito. Contraseña por defecto: univo123`);
      setIsRegisterOpen(false);
      // Limpiamos el formulario
      setNuevoUsuario({ 
        nombre: '', 
        correo: '', 
        edad: '', 
        sexo: 'Masculino', 
        facultad: listaFacultades[0], 
        carrera: facultadesYCarreras[listaFacultades[0]][0] 
      });
    } else {
      throw new Error('Error del servidor');
    }
  })
  .catch(function(error) {
    setErrorRegistro('No se pudo conectar con la base de datos para registrar al alumno.');
    console.log(error);
  });
};

const [datosReporte, setDatosReporte] = useState(null);

const handleExportarExcel = async () => {
    try {
      // 1. Pedimos los datos estadísticos al backend
      const respuesta = await fetch('http://localhost:3000/api/reportes/semanal');
      if (!respuesta.ok) throw new Error("Error al obtener datos");
      
      const datos = await respuesta.json();

      // 2. Creamos un libro de Excel en blanco
      const libro = XLSX.utils.book_new();

      // 3. Convertimos los datos de JSON a "Hojas de Excel"
      const hojaReservas = XLSX.utils.json_to_sheet(datos.reservas);
      const hojaEjercicios = XLSX.utils.json_to_sheet(datos.ejercicios);

      // 4. Agregamos las hojas al libro (puedes ponerle el nombre que quieras a la pestaña)
      XLSX.utils.book_append_sheet(libro, hojaReservas, "Reservas por Día");
      XLSX.utils.book_append_sheet(libro, hojaEjercicios, "Ejercicios Populares");

      // 5. Forzamos la descarga del archivo al usuario
      XLSX.writeFile(libro, "Reporte_Gimnasio_UNIVO.xlsx");

    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      alert("Hubo un problema al generar el Excel.");
    }
  };

  const handleGenerarPDF = async () => {
    try {
      // 1. Traemos la misma información de SQL
      const respuesta = await fetch('http://localhost:3000/api/reportes/semanal');
      if (!respuesta.ok) throw new Error("Error al obtener datos");
      
      const datos = await respuesta.json();
      
      // 2. Guardamos los datos en el estado para que se dibuje el reporte
      setDatosReporte(datos);

      // 3. Le damos un mini respiro a React (300ms) para que pinte el HTML invisible 
      // y disparamos la ventana de impresión nativa
      setTimeout(() => {
        window.print();
      }, 300);

    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Hubo un problema al recopilar los datos para el PDF.");
    }
  };

  return (
    <div className="flex-1 flex bg-gray-50 h-screen overflow-hidden relative">

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-univo-blue-dark">Agenda de Entrenamiento</h1>
            <p className="text-gray-500">Semana del {days[0]} al {days[5]}</p>
          </div>

          <div className="flex gap-4">

  {/* Botones solo para administrador */}
  {usuario && usuario.rol === 'admin' && (
    <>
      {/* Reporte PDF */}
      <button
        onClick={handleGenerarPDF}
        className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-2 shadow-sm text-sm cursor-pointer"
      >
        <i className="fa-solid fa-file-pdf"></i>
        <span className="hidden sm:inline">Reporte PDF</span>
      </button>

      {/* Reporte Excel */}
      <button
        onClick={handleExportarExcel}
        className="bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border border-green-200 font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-2 shadow-sm text-sm cursor-pointer"
      >
        <i className="fa-solid fa-file-excel"></i>
        <span className="hidden sm:inline">Exportar Excel</span>
      </button>

      {/* Registrar Alumno */}
      <button
        onClick={() => setIsRegisterOpen(true)}
        className="bg-white border-2 border-univo-blue-dark text-univo-blue-dark px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <i className="fa-solid fa-user-plus mr-2"></i> Registrar Alumno
      </button>
    </>
  )}

  {/* Este botón lo ve todo el mundo */}
  <button
    onClick={() => setIsModalOpen(true)}
    className="bg-univo-gold text-univo-blue-dark px-6 py-3 rounded-xl font-bold shadow-md hover:scale-105 transition-transform cursor-pointer"
  >
    + Nueva Reserva
  </button>

</div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="p-4 border-r border-gray-100 bg-gray-50"></div>
            {days.map(day => (
              <div key={day} className="p-4 text-center font-bold text-univo-blue-mid text-sm">{day}</div>
            ))}
          </div>

          <div className="max-h-[600px] overflow-y-auto pb-12">
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-7 border-b border-gray-50 last:border-0">
                <div className="p-4 text-xs text-gray-400 text-right font-medium border-r border-gray-50 sticky left-0 bg-white z-10">
                  {hour}
                </div>

                {days.map(day => {
                  const esSabadoTarde = day.includes('Sab') && parseInt(hour.split(':')[0]) > 11;
                  const reservasCelda = reservas.filter(r => r.hora === hour && r.dia === day);

                  return (
                    <div key={day} className={`p-1 border-r border-gray-50 last:border-0 min-h-[80px] flex flex-col gap-1 ${esSabadoTarde ? 'bg-gray-100' : 'hover:bg-gray-50 transition-all'}`}>
                      {esSabadoTarde ? (
                        <div className="flex-1 flex items-center justify-center text-gray-300 text-xs font-bold uppercase">Cerrado</div>
                      ) : (
                        reservasCelda.map((reserva) => (
                          <div key={reserva.id} className="bg-univo-blue-mid/10 border-l-4 border-univo-blue-mid p-1.5 rounded-md shadow-sm">
                            <p className="text-[9px] font-bold text-univo-blue-dark leading-tight truncate">{reserva.maquina}</p>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </main>

      <aside className="w-56 bg-white border-l border-gray-100 flex flex-col items-center py-12 px-4 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
        <div className="w-24 h-24 rounded-full bg-gray-200 mb-3 overflow-hidden border-4 border-univo-gold shadow-md relative">
          <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
        </div>

        <input
          type="file"
          accept="image/*"
          ref={inputFileRef}
          onChange={handleCambiarFoto}
          className="hidden"
        />
        <button
          onClick={() => inputFileRef.current.click()}
          className="text-xs font-bold text-univo-blue-mid bg-univo-blue-mid/10 px-3 py-1.5 rounded-lg hover:bg-univo-blue-mid/20 transition-colors mb-6 cursor-pointer"
        >
          Cambiar Foto
        </button>

        {/* Mostramos el nombre dinámicamente si existe el usuario */}
        <h2 className="text-lg font-black text-univo-blue-dark text-center leading-tight">
          {usuario ? usuario.nombre_completo : 'Cargando...'}
        </h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-center">
          {usuario && usuario.rol === 'admin' ? 'Administrador' : 'Estudiante'}
        </p>

        <div className="w-full h-px bg-gray-100 my-6"></div>

        <div className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-400 mb-2">TU IMC ACTUAL</p>
          <div className="text-3xl font-black text-univo-blue-dark">
            {imcGlobal ? imcGlobal : '--'}
          </div>
          {imcGlobal && (
            <p className="text-[10px] text-green-600 font-bold mt-2 bg-green-100 py-1 rounded-full">Actualizado</p>
          )}
        </div>
        <div className="w-full bg-univo-blue-dark p-4 rounded-2xl shadow-md text-white mt-6 flex flex-col max-h-[500px]">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <p className="text-xs font-bold text-univo-gold uppercase tracking-wider">Mi Rutina</p>
            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-md">
              {misRutinas ? misRutinas.length : 0}
            </span>
          </div>

          {!misRutinas || misRutinas.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4 bg-white/5 rounded-xl border border-white/10">
              Aún no has agregado ejercicios. Ve a Rutinas para configurarla.
            </p>
          ) : (
            <>
              <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1 mb-4">
                {misRutinas.map((ej) => {
                  
                  // CORRECCIÓN 1: Ahora leemos el estado directamente de SQL (puede ser 1, 0, true o false)
                  const isCompleted = ej.completado === 1 || ej.completado === true;

                  return (
                    <div
                      key={ej.id}
                      className={`p-3 rounded-xl flex items-center justify-between border transition-all ${isCompleted
                          ? 'bg-white/5 border-white/5 opacity-50'
                          : 'bg-white/10 border-white/10 hover:bg-white/20'
                        }`}
                    >
                      <div className="flex items-center gap-3 flex-1 pr-2">
                        <button
                          // CORRECCIÓN 2: Le pasamos el ID y el estado actual a la función
                          onClick={() => toggleCompletado(ej.id, ej.completado)}
                          className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${isCompleted ? 'border-univo-gold bg-univo-gold/20' : 'border-white/50 hover:border-white'
                            }`}
                        >
                          {isCompleted && <i className="fa-solid fa-check text-[10px] text-univo-gold"></i>}
                        </button>

                        <span className={`text-[11px] font-semibold leading-tight ${isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>
                          {ej.nombre || ej.ejercicio_nombre}
                        </span>
                      </div>

                      <a
                        href={ej.video || ej.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`transition-colors flex-shrink-0 ml-1 ${isCompleted ? 'text-gray-500' : 'text-red-400 hover:text-red-300'}`}
                        title="Ver Tutorial"
                      >
                        <i className="fa-brands fa-youtube text-lg"></i>
                      </a>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleTerminarRutina}
                className="w-full bg-univo-gold text-univo-blue-dark py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors flex-shrink-0 shadow-lg cursor-pointer"
              >
                Terminar Rutina
              </button>
            </>
          )}
        </div>
      </aside>

      {/* MODAL DE RESERVAS */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/50 z-50 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl w-96 shadow-2xl">
            <h2 className="text-2xl font-bold text-univo-blue-dark mb-6">Crear Reserva</h2>
            <form onSubmit={handleGuardarReserva} className="flex flex-col gap-4">

              {limiteAlcanzado ? (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-semibold border border-red-200">
                  <i className="fa-solid fa-ban mr-2"></i> Límite de 10 personas por hora.
                </div>
              ) : personasEnMaquina >= 8 ? (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold border border-red-200">
                  <i className="fa-solid fa-triangle-exclamation mr-2"></i> Posible espera larga.
                </div>
              ) : personasEnMaquina >= 5 ? (
                <div className="bg-yellow-50 text-yellow-700 p-3 rounded-xl text-xs font-semibold border border-yellow-200">
                  <i className="fa-solid fa-circle-exclamation mr-2"></i> Varias personas en este equipo.
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Máquina / Ejercicio</label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-univo-gold"
                  value={nuevaReserva.maquina}
                  onChange={(e) => setNuevaReserva({ ...nuevaReserva, maquina: e.target.value })}
                >
                  <option>Máquina Pecho</option>
                  <option>Smith</option>
                  <option>Polea Espalda</option>
                  <option>Mancuernas</option>
                  <option>Full body</option>
                  <option>Caminadora</option>
                  <option>Elíptica</option>
                  <option>Bicicleta</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Día</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-univo-gold"
                    value={nuevaReserva.dia}
                    onChange={(e) => setNuevaReserva({ ...nuevaReserva, dia: e.target.value })}
                  >
                    {days.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Hora</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-univo-gold"
                    value={nuevaReserva.hora}
                    onChange={(e) => setNuevaReserva({ ...nuevaReserva, hora: e.target.value })}
                  >
                    {hours.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" disabled={limiteAlcanzado} className={`flex-1 p-3 font-bold rounded-xl shadow-md ${limiteAlcanzado ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-univo-blue-dark text-univo-gold cursor-pointer hover:bg-opacity-90'}`}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO DE USUARIOS */}
      {isRegisterOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl w-[500px] shadow-2xl">
            <h2 className="text-2xl font-bold text-univo-blue-dark mb-2">Registrar Estudiante</h2>
            <p className="text-sm text-gray-500 mb-6">Cree una cuenta válida usando el correo institucional.</p>

            <form onSubmit={handleRegistrarUsuario} className="flex flex-col gap-4">

              {errorRegistro && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-200">
                  {errorRegistro}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">NOMBRE COMPLETO</label>
                <input type="text" required value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold" placeholder="Ej: Juan Pérez" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">CORREO INSTITUCIONAL</label>
                <input type="email" required value={nuevoUsuario.correo} onChange={e => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold" placeholder="u123456@univo.edu.sv" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">EDAD</label>
                  <input type="number" required min="15" max="99" value={nuevoUsuario.edad} onChange={e => setNuevoUsuario({ ...nuevoUsuario, edad: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold" placeholder="Ej: 20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">SEXO</label>
                  <select value={nuevoUsuario.sexo} onChange={e => setNuevoUsuario({ ...nuevoUsuario, sexo: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold">
                    <option>Masculino</option>
                    <option>Femenino</option>
                  </select>
                </div>
              </div>

              {/* 5. CAMBIOS: Añadido el campo Facultad y Carrera es ahora dependiente */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">FACULTAD</label>
                  <select 
                    value={nuevoUsuario.facultad} 
                    onChange={handleFacultadChange} 
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold"
                  >
                    {listaFacultades.map(fac => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">CARRERA</label>
                  <select 
                    value={nuevoUsuario.carrera} 
                    onChange={e => setNuevoUsuario({ ...nuevoUsuario, carrera: e.target.value })} 
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold"
                  >
                    {/* Renderizamos solo las carreras que pertenecen a la facultad seleccionada */}
                    {facultadesYCarreras[nuevoUsuario.facultad].map(carrera => (
                      <option key={carrera} value={carrera}>{carrera}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <button type="button" onClick={() => setIsRegisterOpen(false)} className="flex-1 p-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 p-3 bg-univo-blue-dark text-univo-gold font-bold rounded-xl shadow-md cursor-pointer">Crear Cuenta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLANTILLA DE IMPRESIÓN PARA EL REPORTE PDF (Solo visible al imprimir) */}
{datosReporte && (
  <div className="hidden print:block print:fixed print:top-0 print:left-0 print:w-full print:h-full print:bg-white print:p-12 print:z-50 text-gray-800 font-sans">
    
    {/* Encabezado del Reporte */}
    <div className="flex justify-between items-center border-b-4 border-univo-blue-dark pb-6 mb-8">
      <div>
        <h1 className="text-2xl font-black text-univo-blue-dark tracking-tight">UNIVERSIDAD DE ORIENTE (UNIVO)</h1>
        <p className="text-sm font-bold text-univo-gold uppercase tracking-wider">Complejo Deportivo - Gimnasio Universitario</p>
        <p className="text-xs text-gray-400 mt-1">Reporte Operativo de Control Semanal</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-gray-500 uppercase">Fecha de Emisión</p>
        <p className="text-sm font-black text-univo-blue-dark">{new Date().toLocaleDateString()}</p>
      </div>
    </div>

    {/* Bloque 1: Tabla de Reservas por Horarios/Días */}
    <div className="mb-8">
      <h2 className="text-sm font-black text-univo-blue-dark uppercase tracking-wide mb-3 bg-gray-100 p-2 rounded-lg">
        1. Resumen de Flujo y Reservas de Máquinas
      </h2>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-univo-blue-dark text-white uppercase font-bold">
            <th className="p-2.5 rounded-l-lg">Horario / Día Registrado</th>
            <th className="p-2.5 text-right rounded-r-lg">Total de Reservas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {datosReporte.reservas.map((r, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-2.5 font-semibold text-gray-700">{r.dia_hora}</td>
              <td className="p-2.5 text-right font-black text-univo-blue-dark">{r.total_reservas} alumnos</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Bloque 2: Tabla de Tendencias de Ejercicios */}
    <div className="mb-12">
      <h2 className="text-sm font-black text-univo-blue-dark uppercase tracking-wide mb-3 bg-gray-100 p-2 rounded-lg">
        2. Tendencias de Entrenamiento (Top Ejercicios más Utilizados)
      </h2>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-univo-blue-dark text-white uppercase font-bold">
            <th className="p-2.5 rounded-l-lg">Nombre del Ejercicio</th>
            <th className="p-2.5 text-right rounded-r-lg">Veces Agregado por Alumnos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {datosReporte.ejercicios.map((e, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-2.5 font-semibold text-gray-700">
                <span className="text-univo-gold font-bold mr-2">#{index + 1}</span>
                {e.ejercicio_nombre}
              </td>
              <td className="p-2.5 text-right font-black text-univo-blue-dark">{e.veces_agregado} selecciones</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Sección de Firmas Formales para Entrega a Superiores */}
    <div className="mt-24 grid grid-cols-2 gap-12 text-center text-xs">
      <div>
        <div className="border-t border-gray-400 mx-auto w-48 mb-2"></div>
        <p className="font-bold text-gray-700">F. Administrador del Gimnasio</p>
        <p className="text-gray-400 text-[10px]">Control de Operaciones UNIVO</p>
      </div>
      <div>
        <div className="border-t border-gray-400 mx-auto w-48 mb-2"></div>
        <p className="font-bold text-gray-700">F. Dirección / Superior Especialista</p>
        <p className="text-gray-400 text-[10px]">Recibido y Conforme</p>
      </div>
    </div>

  </div>
)}

    </div>
  );
}