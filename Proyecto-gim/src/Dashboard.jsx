import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

// ── helpers ──────────────────────────────────────────────────────────────────
const getDiasSemanaActual = () => {
  const hoy = new Date(), nombres = ['Lun','Mar','Mie','Jue','Vie','Sab'], semana = [];
  const lunes = new Date(hoy), ds = hoy.getDay()===0?7:hoy.getDay();
  lunes.setDate(hoy.getDate()-ds+1);
  for(let i=0;i<6;i++){const d=new Date(lunes);d.setDate(lunes.getDate()+i);semana.push(`${d.getDate()} ${nombres[i]}`);}
  return semana;
};
const generarHoras = () => {const h=[];for(let i=7;i<=23;i++)h.push(`${String(i).padStart(2,'0')}:00`);return h;};
const ALL_HOURS      = generarHoras();
const CALENDAR_HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00'];

const duracion = (e,s) => {
  if(!e||!s)return'';
  const[hE,mE]=e.split(':').map(Number),[hS,mS]=s.split(':').map(Number),d=(hS*60+mS)-(hE*60+mE);
  return d>0?`${Math.floor(d/60)}h${d%60>0?' '+d%60+'min':''}`:'';
};

// ── FACULTADES / CARRERAS (lista completa UNIVO) ─────────────────────────────
const facultadesYCarreras = {
  "Licenciaturas": [
    "Licenciatura en Relaciones y Negocios Internacionales",
    "Licenciatura en Idioma Inglés",
    "Licenciatura en Idioma Inglés – Opción Enseñanza",
    "Licenciatura en Contaduría Pública",
    "Licenciatura en Medicina Veterinaria",
    "Licenciatura en Educación Inicial y Parvularia",
    "Licenciatura en Ciencias Jurídicas",
    "Licenciatura en Administración de Empresas",
    "Licenciatura en Turismo (Semipresencial)",
    "Licenciatura en Comunicaciones",
    "Licenciatura en Psicología",
    "Licenciatura en Marketing y Publicidad Digital",
    "Licenciatura en Laboratorio Clínico",
    "Licenciatura en Diseño Gráfico y Multimedia",
    "Licenciatura en Educación Física y Deportes",
    "Licenciatura en Enfermería",
    "Licenciatura en Psicopedagogía",
    "Licenciatura en Optometría"
  ],
  "Doctorados": ["Doctorado en Medicina","Doctorado en Cirugía Dental"],
  "Arquitectura e Ingeniería": [
    "Arquitectura","Ingeniería en Agroindustria","Ingeniería Industrial",
    "Ingeniería Agronómica","Ingeniería Civil",
    "Ingeniería en Desarrollo de Software","Ingeniería en Energía y Eficiencia Energética"
  ],
  "Técnicos": [
    "Técnico en Gestión Turística","Técnico en Idioma Inglés","Técnico en Diseño Gráfico",
    "Técnico en Optometría","Tecnólogo en Enfermería",
    "Técnico en Actividad Física y Entrenamiento Deportivo","Técnico en Banca y Negocios"
  ],
  "Profesorados": [
    "Profesorado en Idioma Inglés","Profesorado en Educación Física y Deportes",
    "Profesorado en Matemáticas","Profesorado en Educación Inicial y Parvularia",
    "Profesorado en Educación Artística"
  ]
};
const listaFacultades = Object.keys(facultadesYCarreras);

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard({
  reservas, recargarReservas,
  imcGlobal, misRutinas, setMisRutinas, usuario
}) {
  const days    = getDiasSemanaActual();
  const isAdmin = usuario?.rol === 'admin';

  // ── rutina ────────────────────────────────────────────────────────────────
  const toggleCompletado = (ejercicioId, estadoActual) => {
    const nuevo = estadoActual===1?0:1;
    fetch('http://localhost:3000/api/rutinas/toggle',{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id:ejercicioId,completado:nuevo})
    }).then(r=>{if(r.ok)setMisRutinas(misRutinas.map(e=>e.id===ejercicioId?{...e,completado:nuevo}:e));});
  };
  const handleTerminarRutina = () => {
    if(!window.confirm("¿Deseas vaciar tu rutina para la próxima vez?"))return;
    fetch(`http://localhost:3000/api/rutinas/limpiar/${usuario.id}`,{method:'DELETE'})
      .then(r=>{if(r.ok){setMisRutinas([]);alert("¡Rutina completada!");}});
  };

  // ── modales ───────────────────────────────────────────────────────────────
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isReservasOpen, setIsReservasOpen] = useState(false);
  const [isMisResOpen,   setIsMisResOpen]   = useState(false);
  const inputFileRef = useRef(null);

  // ── form nueva reserva ────────────────────────────────────────────────────
  const facultadInicial = listaFacultades[0];
  const reservaInicial = {
    dia:days[0], hora_entrada:'07:00', hora_salida:'08:00', maquina:'Máquina Pecho',
    nombre_alumno:'', codigo_alumno:'',
    facultad_form: facultadInicial, carrera_form: facultadesYCarreras[facultadInicial][0]
  };
  const [nuevaReserva, setNuevaReserva] = useState(reservaInicial);
  const horasSalida = ALL_HOURS.filter(h=>h>nuevaReserva.hora_entrada);

  const personasEnHora    = reservas.filter(r=>r.dia===nuevaReserva.dia&&r.hora===nuevaReserva.hora_entrada).length;
  const personasEnMaquina = reservas.filter(r=>r.dia===nuevaReserva.dia&&r.hora===nuevaReserva.hora_entrada&&r.maquina===nuevaReserva.maquina).length;
  const limiteAlcanzado   = personasEnHora>=10;
  const reservasUsuarioEnHora = reservas.filter(
    r=>r.usuario_id===usuario?.id&&r.dia===nuevaReserva.dia&&r.hora===nuevaReserva.hora_entrada
  ).length;
  const limiteUsuario = !isAdmin && reservasUsuarioEnHora>=3;

  const handleFacultadFormChange = (e) => {
    const f=e.target.value;
    setNuevaReserva({...nuevaReserva,facultad_form:f,carrera_form:facultadesYCarreras[f][0]});
  };

  const handleGuardarReserva = (e) => {
    e.preventDefault();
    if(nuevaReserva.dia.includes('Sab')&&parseInt(nuevaReserva.hora_entrada)>11){alert("Los sábados cierra a las 11:00 AM.");return;}
    if(limiteAlcanzado||limiteUsuario)return;
    if(nuevaReserva.hora_salida<=nuevaReserva.hora_entrada){alert("La hora de salida debe ser posterior.");return;}
    if(!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nuevaReserva.nombre_alumno.trim())){alert("El nombre solo puede contener letras.");return;}

    const payload = {
      usuario_id:      usuario.id,
      maquina:         nuevaReserva.maquina,
      dia:             nuevaReserva.dia,
      hora_entrada:    nuevaReserva.hora_entrada,
      hora_salida:     nuevaReserva.hora_salida,
      nombre_alumno:   nuevaReserva.nombre_alumno.trim(),
      codigo_alumno:   nuevaReserva.codigo_alumno.trim(),
      facultad_alumno: nuevaReserva.facultad_form,
      carrera_alumno:  nuevaReserva.carrera_form,
      // Para usuario normal, tomamos sus datos del perfil
      edad_alumno:     !isAdmin ? (usuario.edad||null)   : null,
      sexo_alumno:     !isAdmin ? (usuario.sexo||null)   : null,
    };

    fetch('http://localhost:3000/api/reservas',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
    }).then(async r=>{
      if(r.ok){
        setIsModalOpen(false);
        setNuevaReserva(reservaInicial);
        recargarReservas(); // ← recarga con IDs reales de la BD
      } else {
        const d=await r.json();
        alert(d.mensaje||'Error al guardar.');
      }
    }).catch(()=>alert('Error de conexión.'));
  };

  // ── eliminar reserva usuario ──────────────────────────────────────────────
  const handleEliminarReservaUsuario = (reservaId) => {
    if(!window.confirm("¿Eliminar esta reserva?"))return;
    fetch(`http://localhost:3000/api/reservas/${reservaId}`,{
      method:'DELETE',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({usuario_id:usuario.id})
    }).then(async r=>{
      if(r.ok) recargarReservas(); // ← recarga real
      else{const d=await r.json();alert(d.mensaje);}
    });
  };

  // ── registro alumno ───────────────────────────────────────────────────────
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre:'',codigo_estudiantil:'',correo:'',edad:'',sexo:'Masculino',
    facultad:listaFacultades[0],carrera:facultadesYCarreras[listaFacultades[0]][0]
  });
  const [errorReg, setErrorReg] = useState('');

  const handleFacultadRegChange = (e) => {
    const f=e.target.value;
    setNuevoUsuario({...nuevoUsuario,facultad:f,carrera:facultadesYCarreras[f][0]});
  };
  const handleRegistrarUsuario = (e) => {
    e.preventDefault();setErrorReg('');
    if(!nuevoUsuario.correo.endsWith('@univo.edu.sv')){setErrorReg('El correo debe ser @univo.edu.sv');return;}
    fetch('http://localhost:3000/api/registro',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(nuevoUsuario)
    }).then(r=>{
      if(r.ok){
        alert(`Estudiante ${nuevoUsuario.nombre} registrado. Contraseña: univo123`);
        setIsRegisterOpen(false);
        setNuevoUsuario({nombre:'',codigo_estudiantil:'',correo:'',edad:'',sexo:'Masculino',
          facultad:listaFacultades[0],carrera:facultadesYCarreras[listaFacultades[0]][0]});
      } else setErrorReg('Error del servidor.');
    }).catch(()=>setErrorReg('Error de conexión.'));
  };

  // ── cambiar contraseña ────────────────────────────────────────────────────
  const [passForm,setPassForm]   = useState({actual:'',nueva:'',confirmar:''});
  const [passError,setPassError] = useState('');
  const [passOk,setPassOk]       = useState(false);

  const handleCambiarContrasena = (e) => {
    e.preventDefault();setPassError('');setPassOk(false);
    if(passForm.nueva.length<6){setPassError('Mínimo 6 caracteres.');return;}
    if(passForm.nueva!==passForm.confirmar){setPassError('Las contraseñas no coinciden.');return;}
    fetch('http://localhost:3000/api/usuarios/contrasena',{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id:usuario.id,contrasena_actual:passForm.actual,contrasena_nueva:passForm.nueva})
    }).then(async r=>{
      const d=await r.json();
      if(r.ok){setPassOk(true);setPassForm({actual:'',nueva:'',confirmar:''});setTimeout(()=>setIsPasswordOpen(false),1500);}
      else setPassError(d.mensaje);
    }).catch(()=>setPassError('Error de conexión.'));
  };

  // ── foto perfil ───────────────────────────────────────────────────────────
  const [fotoPerfil,setFotoPerfil] = useState(
    usuario?.foto_perfil||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario?.nombre_completo||'U')}&background=0D1B2A&color=E0A96D&size=128`
  );
  const handleCambiarFoto = (e) => {
    const file=e.target.files[0];if(!file)return;
    if(file.size>5*1024*1024){alert("Máximo 5MB.");return;}
    const reader=new FileReader();
    reader.onloadend=()=>{
      setFotoPerfil(reader.result);
      fetch('http://localhost:3000/api/usuarios/perfil',{
        method:'PUT',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:usuario.id,foto_perfil:reader.result})
      });
    };
    reader.readAsDataURL(file);
  };

  // ── reportes ──────────────────────────────────────────────────────────────
  const [datosReporte,setDatosReporte] = useState(null);

  const handleExportarExcel = async () => {
    try {
      const r=await fetch('http://localhost:3000/api/reportes/semanal');
      const d=await r.json();
      // Solo los 6 campos pedidos
      const filaReservas = d.reservas.map(rv=>({
        'Máquina':       rv.maquina_nombre,
        'Día / Horario': rv.dia_hora,
        'Nombre Alumno': rv.nombre_alumno   ||'',
        'Código':        rv.codigo_alumno   ||'',
        'Área/Facultad': rv.facultad_alumno ||'',
        'Carrera':       rv.carrera_alumno  ||'',
      }));
      const filaEj = d.ejercicios.map(e=>({'Ejercicio':e.ejercicio_nombre,'Selecciones':e.veces_agregado}));
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro,XLSX.utils.json_to_sheet(filaReservas),"Reservas Confirmadas");
      XLSX.utils.book_append_sheet(libro,XLSX.utils.json_to_sheet(filaEj),"Ejercicios Populares");
      XLSX.writeFile(libro,"Reporte_Gimnasio_UNIVO.xlsx");
    } catch{alert("Error al generar Excel.");}
  };

  const handleGenerarPDF = async () => {
    try {
      const r=await fetch('http://localhost:3000/api/reportes/semanal');
      setDatosReporte(await r.json());
      setTimeout(()=>window.print(),300);
    } catch{alert("Error al generar PDF.");}
  };

  // ── panel perfil (desktop + móvil) ────────────────────────────────────────
  const PanelPerfil = () => (
    <div className="flex flex-col items-center w-full">
      <div className="w-24 h-24 rounded-full bg-gray-200 mb-3 overflow-hidden border-4 border-univo-gold shadow-md">
        <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover"/>
      </div>
      <input type="file" accept="image/*" ref={inputFileRef} onChange={handleCambiarFoto} className="hidden"/>
      <button onClick={()=>inputFileRef.current.click()}
        className="text-xs font-bold text-univo-blue-mid bg-univo-blue-mid/10 px-3 py-1.5 rounded-lg hover:bg-univo-blue-mid/20 transition-colors mb-2 cursor-pointer">
        Cambiar Foto
      </button>
      <button onClick={()=>{setPassError('');setPassOk(false);setIsPasswordOpen(true);}}
        className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors mb-5 cursor-pointer">
        Cambiar Contraseña
      </button>
      <h2 className="text-lg font-black text-univo-blue-dark text-center leading-tight">{usuario?.nombre_completo||'...'}</h2>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-center">
        {isAdmin?'Administrador':'Estudiante'}
      </p>
      <div className="w-full h-px bg-gray-100 my-5"></div>
      <div className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
        <p className="text-[10px] font-bold text-gray-400 mb-2">TU IMC ACTUAL</p>
        <div className="text-3xl font-black text-univo-blue-dark">{imcGlobal||'--'}</div>
        {imcGlobal&&<p className="text-[10px] text-green-600 font-bold mt-2 bg-green-100 py-1 rounded-full">Actualizado</p>}
      </div>
      <div className="w-full bg-univo-blue-dark p-4 rounded-2xl shadow-md text-white mt-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-bold text-univo-gold uppercase tracking-wider">Mi Rutina</p>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-md">{misRutinas?.length||0}</span>
        </div>
        {!misRutinas||misRutinas.length===0?(
          <p className="text-xs text-gray-400 text-center py-3 bg-white/5 rounded-xl border border-white/10">Aún no hay ejercicios. Ve a Rutinas.</p>
        ):(
          <>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1 mb-3">
              {misRutinas.map(ej=>{
                const done=ej.completado===1||ej.completado===true;
                return(
                  <div key={ej.id} className={`p-2.5 rounded-xl flex items-center justify-between border transition-all ${done?'bg-white/5 border-white/5 opacity-50':'bg-white/10 border-white/10'}`}>
                    <div className="flex items-center gap-2 flex-1 pr-1">
                      <button onClick={()=>toggleCompletado(ej.id,ej.completado)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${done?'border-univo-gold bg-univo-gold/20':'border-white/50'}`}>
                        {done&&<i className="fa-solid fa-check text-[9px] text-univo-gold"></i>}
                      </button>
                      <span className={`text-[11px] font-semibold leading-tight ${done?'line-through text-gray-400':'text-white'}`}>
                        {ej.nombre||ej.ejercicio_nombre}
                      </span>
                    </div>
                    <a href={ej.video||ej.video_url} target="_blank" rel="noopener noreferrer"
                      className={`flex-shrink-0 ml-1 ${done?'text-gray-500':'text-red-400 hover:text-red-300'}`}>
                      <i className="fa-brands fa-youtube text-base"></i>
                    </a>
                  </div>
                );
              })}
            </div>
            <button onClick={handleTerminarRutina}
              className="w-full bg-univo-gold text-univo-blue-dark py-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors cursor-pointer shadow-lg">
              Terminar Rutina
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-gray-50 min-h-screen overflow-hidden relative">

      {/* ══ MAIN ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap gap-2 justify-between items-center mb-5 md:mb-7">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-univo-blue-dark">Agenda de Entrenamiento</h1>
            <p className="text-gray-500 text-xs md:text-sm">Semana del {days[0]} al {days[5]}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin?(
              <>
                <button onClick={handleGenerarPDF}
                  className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 text-xs cursor-pointer">
                  <i className="fa-solid fa-file-pdf"></i><span>PDF</span>
                </button>
                <button onClick={handleExportarExcel}
                  className="bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border border-green-200 font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 text-xs cursor-pointer">
                  <i className="fa-solid fa-file-excel"></i><span>Excel</span>
                </button>
                <button onClick={()=>setIsReservasOpen(true)}
                  className="bg-univo-blue-dark/10 hover:bg-univo-blue-dark text-univo-blue-dark hover:text-univo-gold border border-univo-blue-dark/20 font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 text-xs cursor-pointer">
                  <i className="fa-solid fa-list-check"></i><span className="hidden sm:inline">Gestionar Reservas</span><span className="sm:hidden">Reservas</span>
                </button>
                <button onClick={()=>setIsRegisterOpen(true)}
                  className="bg-white border-2 border-univo-blue-dark text-univo-blue-dark px-3 py-2 rounded-xl font-bold hover:bg-gray-50 transition-colors cursor-pointer text-xs">
                  <i className="fa-solid fa-user-plus mr-1"></i><span className="hidden sm:inline">Registrar Alumno</span><span className="sm:hidden">Alumno</span>
                </button>
              </>
            ):(
              <button onClick={()=>setIsMisResOpen(true)}
                className="bg-white border-2 border-univo-blue-mid text-univo-blue-mid px-3 py-2 rounded-xl font-bold hover:bg-blue-50 transition-colors cursor-pointer text-xs flex items-center gap-1.5">
                <i className="fa-solid fa-calendar-xmark"></i><span>Mis Reservas</span>
              </button>
            )}
            <button onClick={()=>setIsModalOpen(true)}
              className="bg-univo-gold text-univo-blue-dark px-4 py-2 rounded-xl font-bold shadow-md hover:scale-105 transition-transform cursor-pointer text-sm">
              + Nueva Reserva
            </button>
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="p-2 border-r border-gray-100 bg-gray-50"></div>
            {days.map(d=><div key={d} className="p-2 text-center font-bold text-univo-blue-mid text-[9px] md:text-xs">{d}</div>)}
          </div>
          <div className="max-h-[400px] md:max-h-[540px] overflow-y-auto pb-8">
            {CALENDAR_HOURS.map(hour=>(
              <div key={hour} className="grid grid-cols-7 border-b border-gray-50 last:border-0">
                <div className="p-1 md:p-3 text-[9px] md:text-xs text-gray-400 text-right font-medium border-r border-gray-50 bg-white">{hour}</div>
                {days.map(day=>{
                  const cerrado=day.includes('Sab')&&parseInt(hour)>11;
                  const celdas=reservas.filter(r=>r.hora===hour&&r.dia===day);
                  return(
                    <div key={day} className={`p-0.5 border-r border-gray-50 last:border-0 min-h-[55px] md:min-h-[68px] flex flex-col gap-0.5 ${cerrado?'bg-gray-100':''}`}>
                      {cerrado
                        ?<div className="flex-1 flex items-center justify-center text-gray-300 text-[7px] font-bold uppercase">Cerrado</div>
                        :celdas.map(rv=>(
                          <div key={rv.id} className={`border-l-4 p-1 rounded-md shadow-sm ${rv.completado?'bg-green-100 border-green-500':'bg-univo-blue-mid/10 border-univo-blue-mid'}`}>
                            <p className="text-[7px] md:text-[9px] font-bold text-univo-blue-dark leading-tight truncate">{rv.maquina}</p>
                            {rv.hora_salida&&rv.hora_salida!==rv.hora_entrada&&
                              <p className="text-[6px] md:text-[8px] text-gray-400">{rv.hora_entrada}–{rv.hora_salida}</p>}
                            {rv.completado&&<p className="text-[6px] text-green-600 font-bold">✓</p>}
                          </div>
                        ))
                      }
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Panel perfil MÓVIL */}
        <div className="lg:hidden mt-5 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <PanelPerfil/>
        </div>
      </main>

      {/* ══ ASIDE ESCRITORIO ══════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex w-60 bg-white border-l border-gray-100 flex-col items-center py-10 px-4 z-10 shadow-[-8px_0_15px_-3px_rgba(0,0,0,0.05)] overflow-y-auto">
        <PanelPerfil/>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: NUEVA RESERVA  (campos completos y obligatorios para todos)
      ══════════════════════════════════════════════════════════════════════ */}
      {isModalOpen&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center backdrop-blur-sm p-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-univo-blue-dark mb-5">Crear Reserva</h2>
            <form onSubmit={handleGuardarReserva} className="flex flex-col gap-4">

              {/* Alertas */}
              {limiteAlcanzado&&<div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-semibold border border-red-200"><i className="fa-solid fa-ban mr-2"></i>Límite de 10 personas por hora.</div>}
              {!limiteAlcanzado&&limiteUsuario&&<div className="bg-orange-50 text-orange-700 p-3 rounded-xl text-xs font-semibold border border-orange-200"><i className="fa-solid fa-ban mr-2"></i>Ya tienes 3 máquinas en ese horario.</div>}
              {!limiteAlcanzado&&!limiteUsuario&&personasEnMaquina>=8&&<div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold border border-red-200"><i className="fa-solid fa-triangle-exclamation mr-2"></i>Posible espera larga.</div>}
              {!limiteAlcanzado&&!limiteUsuario&&personasEnMaquina>=5&&personasEnMaquina<8&&<div className="bg-yellow-50 text-yellow-700 p-3 rounded-xl text-xs font-semibold border border-yellow-200"><i className="fa-solid fa-circle-exclamation mr-2"></i>Varias personas en este equipo.</div>}

              {/* Máquina */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">MÁQUINA / EJERCICIO <span className="text-red-500">*</span></label>
                <select required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-univo-gold"
                  value={nuevaReserva.maquina} onChange={e=>setNuevaReserva({...nuevaReserva,maquina:e.target.value})}>
                  {['Máquina Pecho','Smith','Polea Espalda','Mancuernas','Full body','Caminadora','Elíptica','Bicicleta'].map(m=><option key={m}>{m}</option>)}
                </select>
              </div>

              {/* Día */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">DÍA <span className="text-red-500">*</span></label>
                <select required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-univo-gold"
                  value={nuevaReserva.dia} onChange={e=>setNuevaReserva({...nuevaReserva,dia:e.target.value})}>
                  {days.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>

              {/* Horario */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">HORA ENTRADA <span className="text-red-500">*</span></label>
                  <select required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-univo-gold"
                    value={nuevaReserva.hora_entrada}
                    onChange={e=>{
                      const en=e.target.value;
                      const sa=nuevaReserva.hora_salida>en?nuevaReserva.hora_salida:(ALL_HOURS[ALL_HOURS.indexOf(en)+1]||'23:00');
                      setNuevaReserva({...nuevaReserva,hora_entrada:en,hora_salida:sa});
                    }}>
                    {ALL_HOURS.filter(h=>h!=='23:00').map(h=><option key={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">HORA SALIDA <span className="text-red-500">*</span></label>
                  <select required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-univo-gold"
                    value={nuevaReserva.hora_salida} onChange={e=>setNuevaReserva({...nuevaReserva,hora_salida:e.target.value})}>
                    {horasSalida.map(h=><option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 -mt-2">
                Duración: <span className="font-bold text-univo-blue-dark">{duracion(nuevaReserva.hora_entrada,nuevaReserva.hora_salida)||'--'}</span>
              </p>

              {/* Datos del alumno — obligatorio para TODOS */}
              <div className="bg-univo-blue-dark/5 rounded-2xl p-4 flex flex-col gap-3 border border-univo-blue-dark/10">
                <p className="text-[10px] font-black text-univo-blue-dark uppercase tracking-wider">Datos del Alumno</p>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">NOMBRE COMPLETO <span className="text-red-500">*</span></label>
                  <input type="text" required value={nuevaReserva.nombre_alumno}
                    onChange={e=>{if(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(e.target.value))setNuevaReserva({...nuevaReserva,nombre_alumno:e.target.value});}}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-univo-gold" placeholder="Ej: Juan Pérez"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">CÓDIGO ESTUDIANTIL <span className="text-red-500">*</span></label>
                  <input type="text" required value={nuevaReserva.codigo_alumno}
                    onChange={e=>setNuevaReserva({...nuevaReserva,codigo_alumno:e.target.value})}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-univo-gold" placeholder="Ej: u20269384"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">FACULTAD / ÁREA <span className="text-red-500">*</span></label>
                  <select required value={nuevaReserva.facultad_form} onChange={handleFacultadFormChange}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-univo-gold">
                    {listaFacultades.map(f=><option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">CARRERA <span className="text-red-500">*</span></label>
                  <select required value={nuevaReserva.carrera_form} onChange={e=>setNuevaReserva({...nuevaReserva,carrera_form:e.target.value})}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-univo-gold">
                    {facultadesYCarreras[nuevaReserva.facultad_form].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-1">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 p-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" disabled={limiteAlcanzado||limiteUsuario}
                  className={`flex-1 p-3 font-bold rounded-xl shadow-md ${limiteAlcanzado||limiteUsuario?'bg-gray-300 text-gray-500 cursor-not-allowed':'bg-univo-blue-dark text-univo-gold cursor-pointer'}`}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: MIS RESERVAS (usuario)
      ══════════════════════════════════════════════════════════════════════ */}
      {isMisResOpen&&(
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-univo-blue-dark">Mis Reservas</h2>
                <p className="text-xs text-gray-400 mt-0.5">Solo puedes eliminar reservas pendientes</p>
              </div>
              <button onClick={()=>setIsMisResOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-2 rounded-xl hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              {reservas.filter(r=>r.usuario_id===usuario?.id).length===0?(
                <p className="text-center text-gray-400 py-10">No tienes reservas activas.</p>
              ):(
                <div className="space-y-3">
                  {reservas.filter(r=>r.usuario_id===usuario?.id).map(r=>(
                    <div key={r.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 ${r.completado?'bg-green-50 border-green-200':'bg-white border-gray-200 shadow-sm'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-univo-blue-dark text-sm">{r.maquina}</span>
                          {r.completado
                            ?<span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Confirmada</span>
                            :<span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Pendiente</span>
                          }
                        </div>
                        <p className="text-xs text-gray-500">
                          {r.dia} · {r.hora_entrada}{r.hora_salida&&r.hora_salida!==r.hora_entrada?`–${r.hora_salida}`:''}
                          {duracion(r.hora_entrada,r.hora_salida)&&<span className="ml-1 text-gray-400">({duracion(r.hora_entrada,r.hora_salida)})</span>}
                        </p>
                        {r.nombre_alumno&&<p className="text-xs text-gray-600 mt-0.5">{r.nombre_alumno}</p>}
                      </div>
                      {!r.completado&&(
                        <button onClick={()=>handleEliminarReservaUsuario(r.id)}
                          className="flex-shrink-0 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                          <i className="fa-solid fa-trash"></i> Eliminar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: GESTIONAR RESERVAS (admin)
      ══════════════════════════════════════════════════════════════════════ */}
      {isReservasOpen&&(
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-univo-blue-dark">Gestión de Reservas</h2>
                <p className="text-xs text-gray-400 mt-0.5">Confirma o elimina reservas</p>
              </div>
              <button onClick={()=>setIsReservasOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-2 rounded-xl hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              {reservas.length===0?(
                <p className="text-center text-gray-400 py-10">No hay reservas registradas.</p>
              ):(
                <div className="space-y-3">
                  {reservas.map(r=>(
                    <div key={r.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-start gap-3 transition-all ${r.completado?'bg-green-50 border-green-200':'bg-white border-gray-200 shadow-sm'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-univo-blue-dark text-sm">{r.maquina}</span>
                          {r.completado
                            ?<span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Confirmada</span>
                            :<span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Pendiente</span>
                          }
                        </div>
                        <p className="text-xs text-gray-500 mb-1">
                          {r.dia} · {r.hora_entrada}{r.hora_salida&&r.hora_salida!==r.hora_entrada?`–${r.hora_salida}`:''}
                          {' · '}ID usuario: {r.usuario_id}
                        </p>
                        {r.nombre_alumno&&(
                          <div className="mt-1 space-y-0.5">
                            <p className="text-xs font-semibold text-gray-700">{r.nombre_alumno}{r.codigo_alumno&&<span className="ml-2 text-gray-400 font-normal">({r.codigo_alumno})</span>}</p>
                            {r.carrera_alumno&&<p className="text-[10px] text-gray-400">{r.carrera_alumno}</p>}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0 flex-wrap">
                        {!r.completado&&(
                          <button
                            onClick={()=>{
                              fetch(`http://localhost:3000/api/admin/reservas/${r.id}/completar`,{method:'PUT'})
                                .then(res=>{if(res.ok) recargarReservas();});
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm">
                            <i className="fa-solid fa-check"></i> Confirmar
                          </button>
                        )}
                        <button
                          onClick={()=>{
                            if(r.completado){alert("Esta reserva ya fue confirmada.");return;}
                            if(!window.confirm("¿Eliminar esta reserva?"))return;
                            fetch(`http://localhost:3000/api/admin/reservas/${r.id}`,{method:'DELETE'})
                              .then(async res=>{
                                if(res.ok) recargarReservas();
                                else{const d=await res.json();alert(d.mensaje);}
                              });
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ${r.completado?'bg-gray-100 text-gray-400 cursor-not-allowed':'bg-red-100 hover:bg-red-500 text-red-600 hover:text-white'}`}>
                          <i className="fa-solid fa-trash"></i> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: REGISTRAR ALUMNO
      ══════════════════════════════════════════════════════════════════════ */}
      {isRegisterOpen&&(
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm p-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-univo-blue-dark mb-1">Registrar Estudiante</h2>
            <p className="text-sm text-gray-500 mb-5">Correo institucional obligatorio.</p>
            <form onSubmit={handleRegistrarUsuario} className="flex flex-col gap-4">
              {errorReg&&<div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-200">{errorReg}</div>}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">NOMBRE COMPLETO <span className="text-red-500">*</span></label>
                <input type="text" required value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario,nombre:e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold" placeholder="Ej: Juan Pérez"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">CÓDIGO ESTUDIANTIL</label>
                <input type="text" value={nuevoUsuario.codigo_estudiantil} onChange={e=>setNuevoUsuario({...nuevoUsuario,codigo_estudiantil:e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold" placeholder="Ej: u20269384"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">CORREO INSTITUCIONAL <span className="text-red-500">*</span></label>
                <input type="email" required value={nuevoUsuario.correo} onChange={e=>setNuevoUsuario({...nuevoUsuario,correo:e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold" placeholder="u123456@univo.edu.sv"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">EDAD <span className="text-red-500">*</span></label>
                  <input type="number" required min="15" max="99" value={nuevoUsuario.edad} onChange={e=>setNuevoUsuario({...nuevoUsuario,edad:e.target.value})}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold" placeholder="Ej: 20"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">SEXO</label>
                  <select value={nuevoUsuario.sexo} onChange={e=>setNuevoUsuario({...nuevoUsuario,sexo:e.target.value})}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold">
                    <option>Masculino</option><option>Femenino</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">FACULTAD / ÁREA</label>
                  <select value={nuevoUsuario.facultad} onChange={handleFacultadRegChange}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold">
                    {listaFacultades.map(f=><option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">CARRERA</label>
                  <select value={nuevoUsuario.carrera} onChange={e=>setNuevoUsuario({...nuevoUsuario,carrera:e.target.value})}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold">
                    {facultadesYCarreras[nuevoUsuario.facultad].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={()=>setIsRegisterOpen(false)} className="flex-1 p-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 p-3 bg-univo-blue-dark text-univo-gold font-bold rounded-xl cursor-pointer">Crear Cuenta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: CAMBIAR CONTRASEÑA
      ══════════════════════════════════════════════════════════════════════ */}
      {isPasswordOpen&&(
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm p-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-univo-blue-dark mb-1">Cambiar Contraseña</h2>
            <p className="text-xs text-gray-400 mb-5">Mínimo 6 caracteres.</p>
            <form onSubmit={handleCambiarContrasena} className="flex flex-col gap-4">
              {passError&&<div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-200">{passError}</div>}
              {passOk&&<div className="bg-green-50 text-green-700 p-3 rounded-xl text-xs font-bold border border-green-200"><i className="fa-solid fa-check mr-2"></i>¡Actualizada!</div>}
              {[['actual','CONTRASEÑA ACTUAL'],['nueva','NUEVA CONTRASEÑA'],['confirmar','CONFIRMAR NUEVA']].map(([k,lbl])=>(
                <div key={k}>
                  <label className="block text-xs font-bold text-gray-400 mb-1">{lbl}</label>
                  <input type="password" required value={passForm[k]} onChange={e=>setPassForm({...passForm,[k]:e.target.value})}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold" placeholder="••••••••"/>
                </div>
              ))}
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={()=>setIsPasswordOpen(false)} className="flex-1 p-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 p-3 bg-univo-blue-dark text-univo-gold font-bold rounded-xl cursor-pointer">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ PDF — solo los 6 campos pedidos, sin panel de perfil ════════════ */}
      {datosReporte&&(
        <>
          {/* Estilos globales de impresión: oculta TODO excepto el reporte */}
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #reporte-pdf, #reporte-pdf * { visibility: visible !important; }
              #reporte-pdf {
                position: absolute !important;
                top: 0; left: 0;
                width: 100% !important;
                margin: 0 !important;
                padding: 20px !important;
              }
            }
          `}</style>
          <div id="reporte-pdf" className="hidden print:block print:bg-white text-gray-800 font-sans text-xs">
          <div className="flex justify-between items-start border-b-4 border-univo-blue-dark pb-5 mb-7">
            <div>
              <h1 className="text-xl font-black text-univo-blue-dark">UNIVERSIDAD DE ORIENTE (UNIVO)</h1>
              <p className="text-sm font-bold text-univo-gold uppercase tracking-wider">Gimnasio Universitario — Reservas Confirmadas</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-500 uppercase text-[10px]">Fecha de Emisión</p>
              <p className="font-black text-univo-blue-dark">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <h2 className="font-black text-univo-blue-dark uppercase tracking-wide mb-3 bg-gray-100 p-2 rounded-lg">
            1. Reservas Confirmadas
          </h2>
          <table className="w-full border-collapse mb-8" style={{fontSize:'9px'}}>
            <thead>
              <tr className="bg-univo-blue-dark text-white">
                {['Máquina','Día / Horario','Nombre Alumno','Código','Área / Facultad','Carrera'].map(h=>(
                  <th key={h} className="p-2 text-left font-bold border border-univo-blue-dark">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datosReporte.reservas.length===0?(
                <tr><td colSpan={6} className="p-3 text-center text-gray-400">No hay reservas confirmadas.</td></tr>
              ):datosReporte.reservas.map((r,i)=>(
                <tr key={i} className={i%2===0?'bg-white':'bg-gray-50'}>
                  <td className="p-2 font-semibold border border-gray-200">{r.maquina_nombre}</td>
                  <td className="p-2 border border-gray-200">{r.dia_hora}</td>
                  <td className="p-2 border border-gray-200">{r.nombre_alumno||'—'}</td>
                  <td className="p-2 border border-gray-200">{r.codigo_alumno||'—'}</td>
                  <td className="p-2 border border-gray-200">{r.facultad_alumno||'—'}</td>
                  <td className="p-2 border border-gray-200">{r.carrera_alumno||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="font-black text-univo-blue-dark uppercase tracking-wide mb-3 bg-gray-100 p-2 rounded-lg">
            2. Top Ejercicios más Utilizados
          </h2>
          <table className="w-full border-collapse mb-12" style={{fontSize:'9px'}}>
            <thead>
              <tr className="bg-univo-blue-dark text-white">
                <th className="p-2 text-left border border-univo-blue-dark">#</th>
                <th className="p-2 text-left border border-univo-blue-dark">Ejercicio</th>
                <th className="p-2 text-right border border-univo-blue-dark">Selecciones</th>
              </tr>
            </thead>
            <tbody>
              {datosReporte.ejercicios.map((e,i)=>(
                <tr key={i} className={i%2===0?'bg-white':'bg-gray-50'}>
                  <td className="p-2 font-bold text-univo-gold border border-gray-200">#{i+1}</td>
                  <td className="p-2 border border-gray-200">{e.ejercicio_nombre}</td>
                  <td className="p-2 text-right font-bold border border-gray-200">{e.veces_agregado}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-16 text-center mt-16">
            <div><div className="border-t border-gray-400 mb-2 w-48 mx-auto"></div><p className="font-bold">F. Administrador del Gimnasio</p><p className="text-gray-400 text-[10px]">Control de Operaciones UNIVO</p></div>
            <div><div className="border-t border-gray-400 mb-2 w-48 mx-auto"></div><p className="font-bold">F. Dirección / Superior</p><p className="text-gray-400 text-[10px]">Recibido y Conforme</p></div>
          </div>
          </div>
        </>
      )}
    </div>
  );
}