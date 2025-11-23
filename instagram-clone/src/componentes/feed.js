import { supabase } from '../supabase.js';

export async function mostrarFeed() {
  const app = document.getElementById('app');
  
  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  
  app.innerHTML = `
    <div class="feed-container">
      <header class="app-header">
        <h1>Instagram Clone</h1>
      </header>
      
      <div id="publicaciones-feed"></div>
      
      <p id="mensaje"></p>
    </div>
  `;

  const feedDiv = document.getElementById('publicaciones-feed');
  const mensaje = document.getElementById('mensaje');

  // Cargar publicaciones
  async function cargarPublicaciones() {
    feedDiv.innerHTML = '<p>Cargando publicaciones...</p>';

    const { data: publicaciones, error } = await supabase
      .from('publicaciones')
      .select(`
        id,
        imagen_url,
        descripcion,
        creado_en,
        usuarios!publicaciones_usuario_id_fkey(username, foto_perfil, auth_id)
      `)
      .order('creado_en', { ascending: false });

    if (error) {
      feedDiv.innerHTML = '<p>Error al cargar publicaciones</p>';
      console.error(error);
      return;
    }

    if (!publicaciones.length) {
      feedDiv.innerHTML = '<p class="empty-state">No hay publicaciones aún. ¡Sé el primero en publicar!</p>';
      return;
    }

    feedDiv.innerHTML = '';

    for (const pub of publicaciones) {
      // Obtener likes count
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('publicacion_id', pub.id);

      // Verificar si el usuario actual dio like
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('publicacion_id', pub.id)
        .eq('usuario_id', user.id)
        .single();

      const tienelike = !!userLike;
      const esPropia = pub.usuarios.auth_id === user.id;

      // Obtener comentarios count
      const { count: comentariosCount } = await supabase
        .from('comentarios')
        .select('*', { count: 'exact', head: true })
        .eq('publicacion_id', pub.id);

      const postDiv = document.createElement('div');
      postDiv.className = 'post-card';
      postDiv.innerHTML = `
        <div class="post-header">
          <img src="${pub.usuarios.foto_perfil || 'https://via.placeholder.com/40'}" 
               alt="${pub.usuarios.username}" class="profile-pic-small">
          <strong>@${pub.usuarios.username}</strong>
          ${esPropia ? `<button class="delete-btn" data-id="${pub.id}">🗑️</button>` : ''}
        </div>
        
        <img src="${pub.imagen_url}" alt="Publicación" class="post-image">
        
        <div class="post-actions">
          <button class="like-btn ${tienelike ? 'liked' : ''}" data-id="${pub.id}">
            ${tienelike ? '❤️' : '🤍'} ${likesCount || 0}
          </button>
          <span>💬 ${comentariosCount || 0}</span>
        </div>
        
        <div class="post-description">
          <strong>@${pub.usuarios.username}</strong> ${pub.descripcion || ''}
        </div>
        
        <div class="post-comments" id="comments-${pub.id}"></div>
        
        <div class="add-comment">
          <input type="text" placeholder="Agrega un comentario..." 
                 class="comment-input" data-pub-id="${pub.id}">
          <button class="comment-btn" data-pub-id="${pub.id}">Publicar</button>
        </div>
      `;

      feedDiv.appendChild(postDiv);

      // Cargar comentarios
      cargarComentarios(pub.id);
    }

    // Event listeners para likes
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const pubId = e.target.getAttribute('data-id');
        await toggleLike(pubId);
      });
    });

    // Event listeners para eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const pubId = e.target.getAttribute('data-id');
        if (confirm('¿Eliminar esta publicación?')) {
          await eliminarPublicacion(pubId);
        }
      });
    });

    // Event listeners para comentarios
    document.querySelectorAll('.comment-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const pubId = e.target.getAttribute('data-pub-id');
        const input = document.querySelector(`.comment-input[data-pub-id="${pubId}"]`);
        await agregarComentario(pubId, input.value);
        input.value = '';
      });
    });
  }

  // Función para dar/quitar like
  async function toggleLike(publicacionId) {
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('publicacion_id', publicacionId)
      .eq('usuario_id', user.id)
      .single();

    if (existingLike) {
      // Quitar like
      await supabase.from('likes').delete().eq('id', existingLike.id);
    } else {
      // Dar like
      await supabase.from('likes').insert([
        { publicacion_id: publicacionId, usuario_id: user.id }
      ]);
    }

    cargarPublicaciones(); // Recargar feed
  }

  // Función para eliminar publicación
  async function eliminarPublicacion(publicacionId) {
    const { error } = await supabase
      .from('publicaciones')
      .delete()
      .eq('id', publicacionId);

    if (error) {
      mensaje.textContent = 'Error al eliminar';
      mensaje.style.color = 'red';
    } else {
      mensaje.textContent = 'Publicación eliminada';
      mensaje.style.color = 'green';
      cargarPublicaciones();
    }
  }

  // Función para cargar comentarios
  async function cargarComentarios(publicacionId) {
    const { data: comentarios } = await supabase
      .from('comentarios')
      .select(`
        id,
        texto,
        creado_en,
        usuarios!comentarios_usuario_id_fkey(username)
      `)
      .eq('publicacion_id', publicacionId)
      .order('creado_en', { ascending: true })
      .limit(3);

    const commentsDiv = document.getElementById(`comments-${publicacionId}`);
    if (comentarios && comentarios.length > 0) {
      commentsDiv.innerHTML = comentarios.map(c => `
        <p class="comment">
          <strong>@${c.usuarios.username}</strong> ${c.texto}
        </p>
      `).join('');
    }
  }

  // Función para agregar comentario
  async function agregarComentario(publicacionId, texto) {
    if (!texto.trim()) return;

    const { error } = await supabase.from('comentarios').insert([
      { publicacion_id: publicacionId, usuario_id: user.id, texto: texto.trim() }
    ]);

    if (error) {
      console.error(error);
    } else {
      cargarComentarios(publicacionId);
    }
  }

  cargarPublicaciones();
}