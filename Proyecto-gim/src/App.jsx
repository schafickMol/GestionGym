import React, { useState, useEffect, useCallback } from 'react';
import Login from './Login';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Rutinas from './Rutinas';
import IMC from './IMC';

export default function App() {
  const [usuario,     setUsuario]     = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [imcGlobal,   setImcGlobal]   = useState(null);
  const [misRutinas,  setMisRutinas]  = useState([]);
  const [reservas,    setReservas]    = useState([]);

  // ── Función centralizada para recargar reservas desde el servidor ──────────
  // Se llama después de CUALQUIER operación sobre reservas para garantizar
  // que el estado local siempre refleje la BD (IDs reales, datos completos).
  const recargarReservas = useCallback(() => {
    fetch('http://localhost:3000/api/reservas')
      .then(r => r.json())
      .then(d => setReservas(Array.isArray(d) ? d : []))
      .catch(err => console.log('Error recargando reservas:', err));
  }, []);

  // Carga inicial al hacer login
  useEffect(() => {
    if (!usuario) return;
    recargarReservas();
    fetch(`http://localhost:3000/api/rutinas/${usuario.id}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setMisRutinas(d); })
      .catch(err => console.log('Error rutina:', err));
  }, [usuario]);

  useEffect(() => {
    if (usuario?.imc_guardado) setImcGlobal(usuario.imc_guardado);
  }, [usuario]);

  const handleLogout = () => {
    setUsuario(null); setCurrentView('dashboard');
    setImcGlobal(null); setMisRutinas([]); setReservas([]);
  };

  if (!usuario) return <Login onStart={setUsuario} />;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeView={currentView}
        onViewChange={setCurrentView}
        usuario={usuario}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col pt-[60px] lg:pt-0 overflow-hidden">
        {currentView === 'dashboard' && (
          <Dashboard
            reservas={reservas}
            recargarReservas={recargarReservas}
            imcGlobal={imcGlobal}
            misRutinas={misRutinas}
            setMisRutinas={setMisRutinas}
            usuario={usuario}
            setUsuario={setUsuario}
          />
        )}
        {currentView === 'rutinas' && (
          <Rutinas misRutinas={misRutinas} setMisRutinas={setMisRutinas} usuario={usuario} />
        )}
        {currentView === 'imc' && (
          <IMC setImcGlobal={setImcGlobal} usuario={usuario} setMisRutinas={setMisRutinas} />
        )}
      </div>
    </div>
  );
}