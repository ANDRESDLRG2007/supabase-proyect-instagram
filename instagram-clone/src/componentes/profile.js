import { supabase } from '../supabase.js';

export async function mostrarProfile() {
  const app = document.getElementById('app');
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Obtener datos del usuario
  const { data: perfil, error: errorPerfil } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (errorPerfil) {
    app.innerHTML = '<p>Error cargando perfil</p>';
    return;
  }

  // Contar publicaciones del usuario
  const { count: publicacionesCount } = await supabase
    .from('publicaciones')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', user.id);

  app.innerHTML = `
    <div class="profile-container">
      <div class="profile-header">
        <img src="${perfil.foto_perfil || 'https://via.placeholder.com/100'}" 
             alt="${perfil.username}" class="profile-pic-large">
        <div class="profile-info">
          <h2>@${perfil.username}</h2>
          <p><strong>${perfil.nombre}</strong></p>
          <p class="bio">${perfil.bio || 'Sin biografía'}</p>
          <p class="stats">📸 ${publicacionesCount || 0} publicaciones</p>
        </div>
      </div>

      <button id="edit-profile-btn" class="edit-btn">Editar Perfil</button>

      <div id="edit-form" style="display:none;">
        <h3>Editar Perfil</h3>
        <form id="profile-form">
          <input type="text" id="nombre" value="${perfil.nombre}" placeholder="Nombre" required />
          <input type="text" id="username" value="${perfil.username}" placeholder="Usuario" required />
          <textarea id="bio" placeholder="Biografía">${perfil.bio || ''}</textarea>
          <input type="url" id="foto_perfil" value="${perfil.foto_perfil || ''}" placeholder="URL foto de perfil" />
          <button type="submit">Guardar Cambios</button>
          <button type="button" id="cancel-edit">Cancelar</button>
        </form>
        <p id="mensaje"></p>
      </div>

      <h3>Mis Publicaciones</h3>
      <div id="mis-publicaciones" class="gallery-grid"></div>
    </div>
  `;

  const editBtn = document.getElementById('edit-profile-btn');
  const editForm = document.getElementById('edit-form');
  const cancelBtn = document.getElementById('cancel-edit');
  const profileForm = document.getElementById('profile-form');
  const mensaje = document.getElementById('mensaje');

  // Mostrar/ocultar formulario de edición
  editBtn.addEventListener('click', () => {
    editForm.style.display = 'block';
  });

  cancelBtn.addEventListener('click', () => {
    editForm.style.display = 'none';
  });

  // Guardar cambios del perfil
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const nombre = document.getElementById('nombre').value.trim();
    const username = document.getElementById('username').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const foto_perfil = document.getElementById('foto_perfil').value.trim();

    const { error } = await supabase
      .from('usuarios')
      .update({ nombre, username, bio, foto_perfil })
      .eq('auth_id', user.id);

    if (error) {
      mensaje.textContent = 'Error al actualizar: ' + error.message;
      mensaje.style.color = 'red';
    } else {
      mensaje.textContent = 'Perfil actualizado';
      mensaje.style.color = 'green';
      setTimeout(() => mostrarProfile(), 1000);
    }
  });

  // Cargar publicaciones del usuario
  async function cargarMisPublicaciones() {
    const galeria = document.getElementById('mis-publicaciones');
    
    const { data: publicaciones, error } = await supabase
      .from('publicaciones')
      .select('id, imagen_url, descripcion')
      .eq('usuario_id', user.id)
      .order('creado_en', { ascending: false });

    if (error || !publicaciones.length) {
      galeria.innerHTML = '<p>No tienes publicaciones aún</p>';
      return;
    }

    galeria.innerHTML = publicaciones.map(pub => `
      <div class="gallery-item">
        <img src="${pub.imagen_url}" alt="${pub.descripcion || 'Publicación'}">
      </div>
    `).join('');
  }

  cargarMisPublicaciones();
}