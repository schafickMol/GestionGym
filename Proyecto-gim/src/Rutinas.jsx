import React, { useState, useEffect } from 'react';

export default function Rutinas({ misRutinas = [], setMisRutinas, usuario }) {
  const [rutinasData, setRutinasData] = useState([]);
  const [grupoSeleccionadoId, setGrupoSeleccionadoId] = useState(null);
  const [ejerciciosMarcados, setEjerciciosMarcados] = useState([]);

  useEffect(function () {
    fetch('http://localhost:3000/api/ejercicios')
      .then(function (respuesta) {
        return respuesta.json();
      })
      .then(function (datosSQL) {
        const datosFormateados = datosSQL.map(function (ej) {
          return { id: ej.id, nombre: ej.nombre, video: ej.video_url, grupo_muscular: ej.grupo_muscular };
        });

        const estructuraFinal = [
          {
            id: 'pecho', titulo: 'Pecho',
            imagen: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
            colorBola: 'bg-red-500',
            ejercicios: datosFormateados.filter(function (e) { return e.grupo_muscular === 'pecho'; })
          },
          {
            id: 'espalda', titulo: 'Espalda',
            imagen: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?auto=format&fit=crop&w=800&q=80',
            colorBola: 'bg-blue-500',
            ejercicios: datosFormateados.filter(function (e) { return e.grupo_muscular === 'espalda'; })
          },
          {
            id: 'pierna', titulo: 'Pierna',
            imagen: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=800&q=80',
            colorBola: 'bg-green-500',
            ejercicios: datosFormateados.filter(function (e) { return e.grupo_muscular === 'pierna'; })
          },
          {
            id: 'hombros', titulo: 'Hombros',
            imagen: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
            colorBola: 'bg-purple-500',
            ejercicios: datosFormateados.filter(function (e) { return e.grupo_muscular === 'hombros'; })
          },
          {
            id: 'brazos', titulo: 'Brazos',
            imagen: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
            colorBola: 'bg-orange-500',
            ejercicios: datosFormateados.filter(function (e) { return e.grupo_muscular === 'brazos'; })
          },
          {
            id: 'fullbody', titulo: 'Full Body & HIIT',
            imagen: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=800&q=80',
            colorBola: 'bg-indigo-500',
            ejercicios: datosFormateados.filter(function (e) { return e.grupo_muscular === 'full body'; })
          }
        ];

        setRutinasData(estructuraFinal);
      })
      .catch(function (error) {
        console.log('Error al obtener los ejercicios del servidor:', error);
      });
  }, []);

  useEffect(() => {
    if (misRutinas.length > 0) {
      setEjerciciosMarcados(misRutinas);
    }
  }, [misRutinas]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nuevoEjercicio, setNuevoEjercicio] = useState({ nombre: '', video: '' });

  const grupoSeleccionado = rutinasData.find(g => g.id === grupoSeleccionadoId);

  const toggleEjercicio = (ejercicio) => {
    if (ejerciciosMarcados.some(e => e.id === ejercicio.id)) {
      setEjerciciosMarcados(ejerciciosMarcados.filter(e => e.id !== ejercicio.id));
    } else {
      setEjerciciosMarcados([...ejerciciosMarcados, ejercicio]);
    }
  };

  const handleGuardarRutina = () => {
    if (ejerciciosMarcados.length === 0) {
      alert("Selecciona al menos un ejercicio antes de guardar.");
      return;
    }

    // Guardamos cada ejercicio marcado en SQL uno por uno
    const promesas = ejerciciosMarcados.map(function (ejercicio) {
      return fetch('http://localhost:3000/api/rutinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuario.id,
          ejercicio_nombre: ejercicio.nombre
        })
      });
    });

    Promise.all(promesas)
      .then(function () {
        // Una vez guardados todos, descargamos la lista fresca con IDs reales de SQL
        return fetch(`http://localhost:3000/api/rutinas/${usuario.id}`);
      })
      .then(function (res) {
        return res.json();
      })
      .then(function (datos) {
        setMisRutinas(datos);
        setEjerciciosMarcados([]);
        alert("¡Rutina guardada! Ve al Dashboard para verla en tu panel lateral.");
      })
      .catch(function (err) {
        console.log("Error al guardar la rutina en SQL:", err);
        alert("Hubo un problema al guardar la rutina.");
      });
  };

  // ✅ FUNCIÓN CORREGIDA — sin código duplicado afuera
  const handleAddEjercicio = function (e) {
    e.preventDefault();
    if (!nuevoEjercicio.nombre || !nuevoEjercicio.video) return;

    const datosParaEnviar = {
      nombre: nuevoEjercicio.nombre,
      video: nuevoEjercicio.video,
      grupo_muscular: grupoSeleccionadoId
    };

    fetch('http://localhost:3000/api/ejercicios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosParaEnviar)
    })
      .then(function (respuesta) {
        if (respuesta.ok) {
          // Re-descargamos los ejercicios desde SQL para obtener los IDs reales de la base de datos
          return fetch('http://localhost:3000/api/ejercicios')
            .then(function (respuesta2) {
              return respuesta2.json();
            })
            .then(function (datosSQL) {
              const datosFormateados = datosSQL.map(function (ej) {
                return { id: ej.id, nombre: ej.nombre, video: ej.video_url, grupo_muscular: ej.grupo_muscular };
              });

              // Reconstruimos la estructura de categorías con los datos frescos de SQL
              const estructuraActualizada = rutinasData.map(function (grupo) {
                return {
                  ...grupo,
                  ejercicios: datosFormateados.filter(function (e) {
                    return e.grupo_muscular === grupo.id;
                  })
                };
              });

              // Actualizamos el filtro especial de fullbody
              const conFullbody = estructuraActualizada.map(function (grupo) {
                if (grupo.id === 'fullbody') {
                  return {
                    ...grupo,
                    ejercicios: datosFormateados.filter(function (e) {
                      return e.grupo_muscular === 'full body';
                    })
                  };
                }
                return grupo;
              });

              setRutinasData(conFullbody);
              setNuevoEjercicio({ nombre: '', video: '' });
              setIsAddModalOpen(false);
              alert('¡Ejercicio guardado exitosamente en la base de datos!');
            });
        } else {
          alert('Hubo un problema al intentar guardar el ejercicio.');
        }
      })
      .catch(function (error) {
        console.log('Error de conexión con el servidor:', error);
      });
  };

  const handleDeleteEjercicio = (idEjercicio) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este ejercicio?");
    if (!confirmar) return;

    const nuevosDatos = rutinasData.map(grupo => {
      if (grupo.id === grupoSeleccionadoId) {
        return { ...grupo, ejercicios: grupo.ejercicios.filter(ej => ej.id !== idEjercicio) };
      }
      return grupo;
    });

    setRutinasData(nuevosDatos);
    setEjerciciosMarcados(ejerciciosMarcados.filter(e => e.id !== idEjercicio));
    if (setMisRutinas) {
      setMisRutinas(misRutinas.filter(e => e.id !== idEjercicio));
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-8 h-screen overflow-y-auto relative">
      {!grupoSeleccionado ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-univo-blue-dark">Tablero de Rutinas</h1>
            <p className="text-gray-500">Selecciona un grupo muscular para explorar o configurar tu entrenamiento.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rutinasData.map((rutina) => (
              <div
                key={rutina.id}
                onClick={() => setGrupoSeleccionadoId(rutina.id)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                <div className="h-48 w-full relative overflow-hidden bg-gray-200">
                  <img src={rutina.imagen} alt={rutina.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-white ${rutina.colorBola} shadow-sm`}></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-univo-blue-dark mb-1">{rutina.titulo}</h3>
                  <p className="text-sm text-gray-500">{rutina.ejercicios ? rutina.ejercicios.length : 0} ejercicios registrados</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-5xl mx-auto pb-12">

          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setGrupoSeleccionadoId(null)}
              className="flex items-center text-univo-blue-mid font-bold hover:text-univo-blue-dark transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i> Volver a categorías
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-48 w-full relative">
              <img src={grupoSeleccionado.imagen} alt={grupoSeleccionado.titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8">
                <h1 className="text-4xl font-black text-white">{grupoSeleccionado.titulo}</h1>
              </div>
            </div>

            <div className="p-8">

              <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <h3 className="font-bold text-univo-blue-dark">Ejercicios seleccionados: {ejerciciosMarcados.length}</h3>
                  {ejerciciosMarcados.length > 5 && (
                    <p className="text-xs text-yellow-600 font-bold mt-1">
                      <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                      Se recomienda solo escoger 5 ejercicios por rutina para evitar fatiga.
                    </p>
                  )}
                </div>
                <button
                  onClick={handleGuardarRutina}
                  className="mt-4 md:mt-0 bg-univo-blue-dark text-univo-gold px-6 py-2 rounded-lg font-bold shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  Agregar a Mi Rutina
                </button>
              </div>

              <div className="space-y-3 mb-8">
                {grupoSeleccionado.ejercicios && grupoSeleccionado.ejercicios.map((ejercicio, index) => {
                  const estaMarcado = ejerciciosMarcados.some(e => e.id === ejercicio.id);

                  return (
                    <div
                      key={ejercicio.id}
                      className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all ${estaMarcado ? 'border-univo-blue-mid bg-univo-blue-mid/5 shadow-sm' : 'border-gray-100 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-4 mb-3 md:mb-0 cursor-pointer flex-1" onClick={() => toggleEjercicio(ejercicio)}>
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${estaMarcado ? 'bg-univo-blue-mid border-univo-blue-mid' : 'border-gray-300'}`}>
                          {estaMarcado && <i className="fa-solid fa-check text-white text-xs"></i>}
                        </div>
                        <div>
                          <span className="font-bold text-univo-blue-dark block">{ejercicio.nombre}</span>
                          <span className="text-xs text-gray-400">Ejercicio {index + 1}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={ejercicio.video}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-colors text-xs"
                        >
                          <i className="fa-brands fa-youtube mr-1"></i> Tutorial
                        </a>

                        <button
                          onClick={() => handleDeleteEjercicio(ejercicio.id)}
                          className="bg-red-500 text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
                          title="Eliminar ejercicio de la base de datos"
                        >
                          <i className="fa-solid fa-minus text-sm"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 font-bold rounded-xl hover:border-univo-blue-mid hover:text-univo-blue-mid hover:bg-blue-50/50 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-plus mr-2"></i> Añadir Nuevo Ejercicio a {grupoSeleccionado.titulo}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl w-[400px] shadow-2xl">
            <h2 className="text-2xl font-bold text-univo-blue-dark mb-2">Nuevo Ejercicio</h2>
            <p className="text-sm text-gray-500 mb-6">Categoría: <span className="font-bold">{grupoSeleccionado?.titulo}</span></p>

            <form onSubmit={handleAddEjercicio} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">NOMBRE DEL EJERCICIO</label>
                <input type="text" required value={nuevoEjercicio.nombre} onChange={e => setNuevoEjercicio({ ...nuevoEjercicio, nombre: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold" placeholder="Ej: Press Francés" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">ENLACE DE YOUTUBE</label>
                <input type="url" required value={nuevoEjercicio.video} onChange={e => setNuevoEjercicio({ ...nuevoEjercicio, video: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-univo-gold" placeholder="https://www.youtube.com/..." />
              </div>

              <div className="flex gap-4 mt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 p-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 p-3 bg-univo-blue-dark text-univo-gold font-bold rounded-xl shadow-md cursor-pointer">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
