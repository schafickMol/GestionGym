// Añade useEffect al import de React
import React, { useState, useEffect } from 'react';
import Login from './Login';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Rutinas from './Rutinas';
import IMC from './IMC';

export default function App() {
  const [usuario, setUsuario] = useState(null); 
  const [currentView, setCurrentView] = useState('dashboard');
  const [imcGlobal, setImcGlobal] = useState(null);
  const [misRutinas, setMisRutinas] = useState([]);
  
  // Iniciamos el arreglo vacío en lugar de datos quemados
  const [reservas, setReservas] = useState([]);

  // NUEVO: Efecto que carga las reservas desde SQL cuando hay un usuario activo
  useEffect(() => {
    if (usuario) {
      // 1. Tu fetch de reservas actual...
      fetch('http://localhost:3000/api/reservas')
        .then(res => res.json())
        .then(datos => setReservas(Array.isArray(datos) ? datos : []))
        .catch(err => console.log('Error cargando reservas:', err));

      // 2. NUEVO: Fetch para cargar los ejercicios guardados de este usuario
      fetch(`http://localhost:3000/api/rutinas/${usuario.id}`)
        .then(res => res.json())
        .then(datos => {
          if (Array.isArray(datos)) {
            setMisRutinas(datos);
          }
        })
        .catch(err => console.log('Error cargando la rutina:', err));
    }
  }, [usuario]);
  // Cargar IMC guardado al iniciar sesión
  useEffect(() => {
    if (usuario && usuario.imc_guardado) {
      setImcGlobal(usuario.imc_guardado);
    }
  }, [usuario]);

  if (!usuario) {
    return <Login onStart={(datosUsuario) => setUsuario(datosUsuario)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeView={currentView} 
        onViewChange={setCurrentView}
        usuario={usuario} 
      />
      
      <div className="flex-1 flex flex-col">
        {currentView === 'dashboard' && (
          <Dashboard 
            reservas={reservas} 
            onAddReserva={(newR) => setReservas([...reservas, newR])} 
            imcGlobal={imcGlobal} 
            misRutinas={misRutinas}
            setMisRutinas={setMisRutinas}
            usuario={usuario}
          />
        )}
        
        {currentView === 'rutinas' && (
          <Rutinas 
            misRutinas={misRutinas} 
            setMisRutinas={setMisRutinas}
            usuario={usuario} /* 👈 Agrega esta línea */
          />
        )}
        
        {currentView === 'imc' && <IMC setImcGlobal={setImcGlobal} usuario={usuario} setMisRutinas={setMisRutinas} />}
      </div>
    </div>
  );
}