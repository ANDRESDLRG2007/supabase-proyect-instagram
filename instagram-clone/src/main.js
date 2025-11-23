import { supabase } from './supabase.js';
import { mostrarRegistro } from './componentes/register.js';
import { mostrarLogin } from './componentes/login.js';
import { mostrarFeed } from './componentes/feed.js';
import { mostrarUpload } from './componentes/upload.js';
import { mostrarProfile } from './componentes/profile.js';

const routes = {
  'registro': mostrarRegistro,
  'login': mostrarLogin,
  'feed': mostrarFeed,
  'upload': mostrarUpload,
  'profile': mostrarProfile
};

async function cerrarSesion() {
  await supabase.auth.signOut();
  await cargarMenu();
  mostrarLogin();
}

export async function cargarMenu() {
  const menu = document.getElementById('menu');
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Usuario no logueado
    menu.innerHTML = `
      <nav class="nav-bar">
        <div class="nav-brand">📸 Instagram Clone</div>
        <div class="nav-links">
          <button data-action="login">Iniciar sesión</button>
          <button data-action="registro">Registrarse</button>
        </div>
      </nav>
    `;
  } else {
    // Usuario logueado
    menu.innerHTML = `
      <nav class="nav-bar">
        <div class="nav-brand">📸 Instagram Clone</div>
        <div class="nav-links">
          <button data-action="feed">🏠 Inicio</button>
          <button data-action="upload">➕ Publicar</button>
          <button data-action="profile">👤 Perfil</button>
          <button data-action="logout">🚪 Salir</button>
        </div>
      </nav>
    `;
  }

  // Asignar event listeners
  menu.querySelectorAll('button').forEach(button => {
    const action = button.getAttribute('data-action');
    if (action === 'logout') {
      button.addEventListener('click', cerrarSesion);
    } else if (routes[action]) {
      button.addEventListener('click', routes[action]);
    }
  });
}

// Inicializar app
document.addEventListener('DOMContentLoaded', async () => {
  await cargarMenu();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    mostrarFeed();
  } else {
    mostrarLogin();
  }
});