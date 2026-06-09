import React from 'react';
import univoLogo from './assets/Logo-Univo.png'; 
import inc from './assets/imc.png';
import calendario from './assets/calendario.png';
import entrenamiento from './assets/entrenamiento.png';

export default function Sidebar({ activeView, onViewChange }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: calendario },
    { id: 'rutinas', label: 'Rutinas', icon: entrenamiento },
    { id: 'imc', label: 'IMC', icon: inc },
  ];

  return (
    <aside className="w-32 bg-univo-blue-dark flex flex-col items-center py-8 shadow-2xl z-20 min-h-screen">
      <img src={univoLogo} alt="UNIVO" className="w-20 h-20 object-contain drop-shadow-md mb-16" />
      
      <nav className="flex flex-col gap-12 w-full">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center justify-center gap-3 transition-all cursor-pointer w-full py-2 ${
              activeView === item.id ? 'text-univo-gold border-r-4 border-univo-gold' : 'text-white/50 hover:text-white'
            }`}
          >
            <img 
                src={item.icon} 
                alt={item.label} 
                className="w-6 h-6 object-contain"
            />
            <span className="text-xs font-bold tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}