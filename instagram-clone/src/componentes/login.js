import { supabase } from '../supabase.js';
import { mostrarRegistro } from './register.js';

export function mostrarLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-container">
      <h1>📸 Instagram Clone</h1>
      <h2>Iniciar Sesión</h2>
      <form id="login-form">
        <input type="email" name="correo" placeholder="Correo electrónico" required />
        <input type="password" name="password" placeholder="Contraseña" required />
        <button type="submit">Ingresar</button>
      </form>
      <p id="error" style="color:red;"></p>
      <p class="toggle-auth">¿No tienes cuenta? <span id="ir-registro">Regístrate</span></p>
    </div>
  `;

  const form = document.getElementById('login-form');
  const errorMsg = document.getElementById('error');

  document.getElementById('ir-registro').addEventListener('click', () => {
    mostrarRegistro();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    const correo = form.correo.value.trim();
    const password = form.password.value.trim();

    if (!correo || !password) {
      errorMsg.textContent = 'Por favor completa todos los campos.';
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: password,
    });

    if (error) {
      errorMsg.textContent = 'Error al iniciar sesión: ' + error.message;
      return;
    }

    console.log('Usuario logueado:', data.user);
    location.reload();
  });
}