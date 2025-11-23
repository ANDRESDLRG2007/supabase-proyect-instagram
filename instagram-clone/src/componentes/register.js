import { supabase } from '../supabase.js';

export function mostrarRegistro() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-container">
      <h1>Instagram Clone</h1>
      <h2>Crear Cuenta</h2>
      <form id="registro-form">
        <input type="text" name="username" placeholder="Nombre de usuario" required />
        <input type="text" name="nombre" placeholder="Nombre completo" required />
        <input type="email" name="correo" placeholder="Correo electrónico" required />
        <input type="password" name="password" placeholder="Contraseña" required />
        <input type="text" name="bio" placeholder="Biografía (opcional)" />
        <button type="submit">Registrarse</button>
      </form>
      <p id="error" style="color:red;"></p>
      <p class="toggle-auth">¿Ya tienes cuenta? <span id="ir-login">Inicia sesión</span></p>
    </div>
  `;

  const form = document.getElementById('registro-form');
  const errorMsg = document.getElementById('error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    const username = form.username.value.trim();
    const nombre = form.nombre.value.trim();
    const correo = form.correo.value.trim();
    const password = form.password.value.trim();
    const bio = form.bio.value.trim();

    if (!username || !nombre || !correo || !password) {
      errorMsg.textContent = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    // Crear usuario en Auth
    const { data: dataAuth, error: errorAuth } = await supabase.auth.signUp({
      email: correo,
      password: password,
    });

    if (errorAuth) {
      errorMsg.textContent = `Error: ${errorAuth.message}`;
      return;
    }

    const uid = dataAuth.user?.id;
    if (!uid) {
      errorMsg.textContent = 'No se pudo obtener el ID del usuario.';
      return;
    }

    const { error: errorInsert } = await supabase.from('usuarios').insert([
      { 
        auth_id: uid, 
        username, 
        nombre, 
        bio: bio || null,
        foto_perfil: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`
      },
    ]);

    if (errorInsert) {
      errorMsg.textContent = 'Error guardando perfil: ' + errorInsert.message;
      return;
    }

    alert('Registro exitoso. Verifica tu correo y luego inicia sesión.');
  });

  document.getElementById('ir-login').addEventListener('click', () => {
    const { mostrarLogin } = require('./login.js');
    mostrarLogin();
  });
}