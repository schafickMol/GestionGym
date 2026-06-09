import { useState } from 'react';

export default function IMC({ setImcGlobal, usuario, setMisRutinas }) {

  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [resultado, setResultado] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [ejerciciosRecomendados, setEjerciciosRecomendados] = useState([]);
  const [cargandoRecomendacion, setCargandoRecomendacion] = useState(false);

  const calcular = () => {
    if (!peso || !altura) return;

    const altMeters = altura / 100;
    const imc = (peso / (altMeters * altMeters)).toFixed(1);

    setResultado(imc);
    setImcGlobal(imc);

    if (usuario && usuario.id) {
      fetch('http://localhost:3000/api/usuarios/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: usuario.id, imc: imc })
      })
      .then(res => {
        if (!res.ok) throw new Error('Falló la conexión con el servidor');
        return res.json();
      })
      .then(data => console.log('✅ IMC guardado permanentemente en SQL:', data.mensaje))
      .catch(err => console.log('❌ Error al guardar el IMC en SQL:', err));
    }
  };

  const handleGenerarRecomendacion = (grupo) => {
    setGrupoSeleccionado(grupo);
    if (!grupo) {
      setEjerciciosRecomendados([]);
      return;
    }

    setCargandoRecomendacion(true);

    fetch('http://localhost:3000/api/ejercicios')
      .then(res => res.json())
      .then(todosLosEjercicios => {
        const imc = parseFloat(resultado); // 👈 usamos el resultado guardado en state
        const delGrupo = todosLosEjercicios.filter(
          ej => ej.grupo_muscular.toLowerCase() === grupo.toLowerCase()
        );

        let seleccionados = [];
        if (imc < 18.5) {
          seleccionados = delGrupo.slice(0, 4);
        } else if (imc >= 18.5 && imc < 25) {
          seleccionados = delGrupo.slice(2, 6);
        } else {
          seleccionados = delGrupo.filter(ej => !ej.nombre.toLowerCase().includes('salto')).slice(0, 4);
        }

        if (seleccionados.length === 0) seleccionados = delGrupo.slice(0, 4);

        setEjerciciosRecomendados(seleccionados);
        setCargandoRecomendacion(false);
      })
      .catch(err => {
        console.error("Error al recomendar:", err);
        setCargandoRecomendacion(false);
      });
  };

  // 👇 Función que faltaba en tu código original
  const handleGuardarRecomendacion = async () => {
    if (ejerciciosRecomendados.length === 0) return;

    try {
      // 1. Guardamos los 4 ejercicios uno por uno de forma segura
      for (const ej of ejerciciosRecomendados) {
        const respuesta = await fetch('http://localhost:3000/api/rutinas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario_id: usuario.id,
            ejercicio_nombre: ej.ejercicio_nombre 
          })
        });

        if (!respuesta.ok) {
          console.error("Error en SQL al intentar guardar:", ej.ejercicio_nombre);
        }
      }

      // 2. Cuando termina de guardar todos, volvemos a descargar la lista para el Dashboard
      const resLista = await fetch(`http://localhost:3000/api/rutinas/${usuario.id}`);
      const datosActualizados = await resLista.json();
      
      // 3. Actualizamos la pantalla
      setMisRutinas(datosActualizados);
      
      alert("¡Sistema Experto: Los ejercicios recomendados se agregaron a tu rutina!");
      
      // 4. Limpiamos la pantalla
      setEjerciciosRecomendados([]);
      setGrupoSeleccionado('');

    } catch (error) {
      console.error("Error fatal al guardar las recomendaciones:", error);
      alert("Hubo un error de conexión al guardar los ejercicios.");
    }
  };
  return (
    <div className="p-12 w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-univo-blue-dark mb-8">
        Calculadora de Salud (IMC)
      </h1>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">PESO (KG)</label>
            <input
              type="number"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-univo-gold focus:ring-1 focus:ring-univo-gold"
              placeholder="Ej: 75"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">ALTURA (CM)</label>
            <input
              type="number"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-univo-gold focus:ring-1 focus:ring-univo-gold"
              placeholder="Ej: 175"
            />
          </div>
        </div>

        <button
          onClick={calcular}
          className="w-full bg-univo-blue-dark text-univo-gold py-4 rounded-xl font-bold text-lg shadow-md hover:bg-opacity-90 cursor-pointer"
        >
          CALCULAR AHORA
        </button>

        {/* Resultado del IMC */}
        {resultado && (
          <div className="mt-8 text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-univo-gold transition-all">
            <p className="text-gray-500 uppercase font-bold text-xs">
              Tu índice de masa corporal es:
            </p>
            <h2 className="text-5xl font-black text-univo-blue-dark mt-2">
              {resultado}
            </h2>
          </div>
        )}

        {/* SISTEMA EXPERTO DE RECOMENDACIÓN */}
        {resultado && (
          <div className="mt-8 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-univo-blue-mid/10 p-2.5 rounded-xl text-univo-blue-dark">
                <i className="fa-solid fa-brain text-xl"></i>
              </div>
              <div>
                <h3 className="text-base font-black text-univo-blue-dark">Rutina Inteligente por IMC</h3>
                <p className="text-xs text-gray-400">El sistema adaptará los ejercicios según tu composición corporal</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                ¿Qué grupo muscular vas a entrenar hoy?
              </label>
              <select
                value={grupoSeleccionado}
                onChange={(e) => handleGenerarRecomendacion(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-univo-blue-dark focus:outline-none focus:border-univo-blue-mid transition-colors"
              >
                <option value="">-- Selecciona un grupo muscular --</option>
                <option value="Pecho">Pecho</option>
                <option value="Pierna">Pierna</option>
                <option value="Espalda">Espalda</option>
                <option value="Brazos">Brazos</option>
                <option value="Hombros">Hombros</option>
                <option value="Full Body">Full Body</option>
              </select>
            </div>

            {cargandoRecomendacion && (
              <p className="text-xs text-center text-gray-400 py-4">Analizando catálogo de ejercicios...</p>
            )}

            {!cargandoRecomendacion && ejerciciosRecomendados.length > 0 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-univo-blue-dark/5 p-3 rounded-xl border border-univo-blue-dark/10">
                  <p className="text-[11px] text-univo-blue-dark font-medium leading-relaxed">
                    💡 <strong>Enfoque de entrenamiento:</strong> Al estar en rango de{' '}
                    <span className="font-bold underline">
                      {resultado < 18.5 ? 'Bajo Peso (Enfoque Fuerza/Hipertrofia)' : resultado < 25 ? 'Normal (Enfoque Tonificación)' : 'Sobrepeso (Enfoque Bajo Impacto/Cardio)'}
                    </span>
                    , hemos seleccionado 4 ejercicios clave de la base de datos para ti.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ejerciciosRecomendados.map((ej) => (
                    <div key={ej.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-univo-blue-dark leading-tight">{ej.nombre}</p>
                        <span className="text-[10px] text-gray-400 font-semibold">{ej.grupo_muscular}</span>
                      </div>
                      {ej.video_url && (
                        <a href={ej.video_url} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-600 text-base">
                          <i className="fa-brands fa-youtube"></i>
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGuardarRecomendacion}
                  className="w-full mt-2 bg-univo-gold hover:bg-univo-blue-dark hover:text-white text-univo-blue-dark font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-calendar-plus"></i>
                  Agregar estos 4 ejercicios a Mi Rutina
                </button>
              </div>
            )}

            {grupoSeleccionado && ejerciciosRecomendados.length === 0 && !cargandoRecomendacion && (
              <p className="text-xs text-center text-red-500 bg-red-50 py-3 rounded-xl border border-red-100">
                Aún no hay ejercicios registrados en la categoría "{grupoSeleccionado}" dentro de SQL Server. ¡Ve a agregarlos antes!
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
