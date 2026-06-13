import React, { useState, useEffect } from 'react';

export default function Rutinas({ misRutinas = [], setMisRutinas, usuario }) {
  const isAdmin = usuario?.rol === 'admin';

  const [rutinasData,        setRutinasData]        = useState([]);
  const [grupoSeleccionadoId,setGrupoSeleccionadoId] = useState(null);
  const [ejerciciosMarcados, setEjerciciosMarcados]  = useState([]);
  const [isAddModalOpen,     setIsAddModalOpen]      = useState(false);
  const [nuevoEjercicio,     setNuevoEjercicio]      = useState({ nombre:'', video:'' });

  // Carga de ejercicios desde SQL
  useEffect(() => {
    fetch('http://localhost:3000/api/ejercicios')
      .then(r => r.json())
      .then(datosSQL => {
        const fmt = datosSQL.map(ej => ({
          id: ej.id, nombre: ej.nombre, video: ej.video_url, grupo_muscular: ej.grupo_muscular
        }));

        const grupos = [
          { id:'pecho',    titulo:'Pecho',          imagen:'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80', colorBola:'bg-red-500' },
          { id:'espalda',  titulo:'Espalda',         imagen:'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?auto=format&fit=crop&w=800&q=80', colorBola:'bg-blue-500' },
          { id:'pierna',   titulo:'Pierna',          imagen:'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=800&q=80', colorBola:'bg-green-500' },
          { id:'hombros',  titulo:'Hombros',         imagen:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80', colorBola:'bg-purple-500' },
          { id:'brazos',   titulo:'Brazos',          imagen:'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80', colorBola:'bg-orange-500' },
          { id:'fullbody', titulo:'Full Body & HIIT', imagen:'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=800&q=80', colorBola:'bg-indigo-500' },
        ];

        setRutinasData(grupos.map(g => ({
          ...g,
          ejercicios: fmt.filter(e =>
            g.id === 'fullbody'
              ? e.grupo_muscular === 'full body'
              : e.grupo_muscular === g.id
          )
        })));
      })
      .catch(err => console.log('Error ejercicios:', err));
  }, []);

  useEffect(() => {
    if (misRutinas.length > 0) setEjerciciosMarcados(misRutinas);
  }, [misRutinas]);

  const grupoSeleccionado = rutinasData.find(g => g.id === grupoSeleccionadoId);

  const toggleEjercicio = (ejercicio) => {
    if (ejerciciosMarcados.some(e => e.id === ejercicio.id))
      setEjerciciosMarcados(ejerciciosMarcados.filter(e => e.id !== ejercicio.id));
    else
      setEjerciciosMarcados([...ejerciciosMarcados, ejercicio]);
  };

  const handleGuardarRutina = () => {
    if (ejerciciosMarcados.length === 0) { alert("Selecciona al menos un ejercicio."); return; }
    const promesas = ejerciciosMarcados.map(ej =>
      fetch('http://localhost:3000/api/rutinas', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ usuario_id: usuario.id, ejercicio_nombre: ej.nombre })
      })
    );
    Promise.all(promesas)
      .then(() => fetch(`http://localhost:3000/api/rutinas/${usuario.id}`))
      .then(r => r.json())
      .then(datos => {
        setMisRutinas(datos);
        setEjerciciosMarcados([]);
        alert("¡Rutina guardada! Ve al Dashboard para verla.");
      })
      .catch(err => { console.log(err); alert("Error al guardar."); });
  };

  // Agregar ejercicio (solo admin)
  const handleAddEjercicio = (e) => {
    e.preventDefault();
    if (!nuevoEjercicio.nombre || !nuevoEjercicio.video) return;

    fetch('http://localhost:3000/api/ejercicios', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ nombre:nuevoEjercicio.nombre, video:nuevoEjercicio.video, grupo_muscular:grupoSeleccionadoId })
    }).then(r => {
      if (!r.ok) { alert('Error al guardar el ejercicio.'); return; }
      return fetch('http://localhost:3000/api/ejercicios');
    }).then(r => r.json())
    .then(datosSQL => {
      const fmt = datosSQL.map(ej => ({ id:ej.id, nombre:ej.nombre, video:ej.video_url, grupo_muscular:ej.grupo_muscular }));
      setRutinasData(rutinasData.map(g => ({
        ...g,
        ejercicios: fmt.filter(e => g.id==='fullbody' ? e.grupo_muscular==='full body' : e.grupo_muscular===g.id)
      })));
      setNuevoEjercicio({ nombre:'', video:'' });
      setIsAddModalOpen(false);
      alert('¡Ejercicio guardado!');
    }).catch(err => console.log(err));
  };

  // Eliminar ejercicio (solo admin)
  const handleDeleteEjercicio = (idEjercicio) => {
    if (!window.confirm("¿Eliminar este ejercicio de la base de datos?")) return;
    fetch(`http://localhost:3000/api/ejercicios/${idEjercicio}`, { method:'DELETE' })
      .then(async r => {
        if (r.ok) {
          setRutinasData(rutinasData.map(g => ({
            ...g,
            ejercicios: g.ejercicios.filter(ej => ej.id !== idEjercicio)
          })));
          setEjerciciosMarcados(ejerciciosMarcados.filter(e => e.id !== idEjercicio));
          if (setMisRutinas) setMisRutinas(misRutinas.filter(e => e.id !== idEjercicio));
        } else {
          const d = await r.json();
          alert(d.mensaje || 'Error al eliminar.');
        }
      });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 bg-gray-50 p-4 md:p-8 h-screen overflow-y-auto relative">

      {/* ── GRID DE GRUPOS MUSCULARES ── */}
      {!grupoSeleccionado ? (
        <>
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-univo-blue-dark">Tablero de Rutinas</h1>
            <p className="text-gray-500 text-sm">Selecciona un grupo muscular para explorar o configurar tu entrenamiento.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {rutinasData.map(rutina => (
              <div key={rutina.id} onClick={() => setGrupoSeleccionadoId(rutina.id)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group">
                <div className="h-40 md:h-48 w-full relative overflow-hidden bg-gray-200">
                  <img src={rutina.imagen} alt={rutina.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-white ${rutina.colorBola} shadow-sm`}></div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg md:text-xl font-bold text-univo-blue-dark mb-1">{rutina.titulo}</h3>
                  <p className="text-sm text-gray-500">{rutina.ejercicios?.length||0} ejercicios registrados</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (

        /* ── DETALLE DE GRUPO ── */
        <div className="max-w-5xl mx-auto pb-12">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setGrupoSeleccionadoId(null)}
              className="flex items-center text-univo-blue-mid font-bold hover:text-univo-blue-dark transition-colors cursor-pointer">
              <i className="fa-solid fa-arrow-left mr-2"></i> Volver a categorías
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Banner */}
            <div className="h-40 md:h-48 w-full relative">
              <img src={grupoSeleccionado.imagen} alt={grupoSeleccionado.titulo} className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8">
                <h1 className="text-3xl md:text-4xl font-black text-white">{grupoSeleccionado.titulo}</h1>
              </div>
            </div>

            <div className="p-5 md:p-8">
              {/* Barra de acción */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 gap-3">
                <div>
                  <h3 className="font-bold text-univo-blue-dark">Ejercicios seleccionados: {ejerciciosMarcados.length}</h3>
                  {ejerciciosMarcados.length > 5 && (
                    <p className="text-xs text-yellow-600 font-bold mt-1">
                      <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                      Se recomiendan máximo 5 ejercicios por rutina.
                    </p>
                  )}
                </div>
                <button onClick={handleGuardarRutina}
                  className="bg-univo-blue-dark text-univo-gold px-5 py-2.5 rounded-xl font-bold shadow-md hover:scale-105 transition-transform cursor-pointer text-sm">
                  Agregar a Mi Rutina
                </button>
              </div>

              {/* Lista de ejercicios */}
              <div className="space-y-3 mb-6">
                {grupoSeleccionado.ejercicios?.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No hay ejercicios en esta categoría aún.
                    {isAdmin && " Agrégalos con el botón de abajo."}
                  </p>
                ) : (
                  grupoSeleccionado.ejercicios.map((ejercicio, index) => {
                    const estaMarcado = ejerciciosMarcados.some(e => e.id === ejercicio.id);
                    return (
                      <div key={ejercicio.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-3 ${estaMarcado?'border-univo-blue-mid bg-univo-blue-mid/5 shadow-sm':'border-gray-100 hover:bg-gray-50'}`}>

                        {/* Checkbox + nombre */}
                        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleEjercicio(ejercicio)}>
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${estaMarcado?'bg-univo-blue-mid border-univo-blue-mid':'border-gray-300'}`}>
                            {estaMarcado && <i className="fa-solid fa-check text-white text-xs"></i>}
                          </div>
                          <div>
                            <span className="font-bold text-univo-blue-dark block">{ejercicio.nombre}</span>
                            <span className="text-xs text-gray-400">Ejercicio {index+1}</span>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                          <a href={ejercicio.video} target="_blank" rel="noopener noreferrer"
                            className="flex-1 sm:flex-initial justify-center bg-red-50 text-red-600 px-3 py-2.5 rounded-lg font-bold hover:bg-red-100 transition-colors text-xs flex items-center gap-1.5 whitespace-nowrap">
                            <i className="fa-brands fa-youtube text-base"></i>
                            <span>Tutorial</span>
                          </a>

                          {/* Botón eliminar — SOLO ADMIN */}
                          {isAdmin && (
                            <button onClick={() => handleDeleteEjercicio(ejercicio.id)}
                              title="Eliminar ejercicio de la base de datos"
                              className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 bg-red-500 hover:bg-red-700 text-white px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-sm whitespace-nowrap">
                              <i className="fa-solid fa-trash"></i>
                              <span>Eliminar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Botón agregar ejercicio — SOLO ADMIN */}
              {isAdmin && (
                <button onClick={() => setIsAddModalOpen(true)}
                  className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 font-bold rounded-xl hover:border-univo-blue-mid hover:text-univo-blue-mid hover:bg-blue-50/50 transition-colors cursor-pointer flex items-center justify-center gap-2">
                  <i className="fa-solid fa-plus"></i>
                  Añadir Nuevo Ejercicio a {grupoSeleccionado.titulo}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: AGREGAR EJERCICIO (solo admin) ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm p-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-univo-blue-dark mb-1">Nuevo Ejercicio</h2>
            <p className="text-sm text-gray-500 mb-5">
              Categoría: <span className="font-bold">{grupoSeleccionado?.titulo}</span>
            </p>
            <form onSubmit={handleAddEjercicio} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">NOMBRE DEL EJERCICIO</label>
                <input type="text" required value={nuevoEjercicio.nombre}
                  onChange={e => setNuevoEjercicio({...nuevoEjercicio,nombre:e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold" placeholder="Ej: Press Francés"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">ENLACE DE YOUTUBE</label>
                <input type="url" required value={nuevoEjercicio.video}
                  onChange={e => setNuevoEjercicio({...nuevoEjercicio,video:e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold" placeholder="https://www.youtube.com/..."/>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 p-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit"
                  className="flex-1 p-3 bg-univo-blue-dark text-univo-gold font-bold rounded-xl cursor-pointer">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}