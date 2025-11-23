import { supabase } from './supabase.js';

export async function mostrarUpload() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="upload-container">
      <h2>Nueva Publicación</h2>
      <form id="upload-form">
        <label>URL de la imagen</label>
        <input type="url" name="imagen_url" placeholder="https://ejemplo.com/imagen.jpg" required />
        
        <label>Descripción</label>
        <textarea name="descripcion" placeholder="Escribe una descripción..." rows="3"></textarea>
        
        <button type="submit">Publicar</button>
      </form>
      
      <p id="mensaje"></p>
      
      <div class="preview-section">
        <h3>Vista previa</h3>
        <img id="preview" src="" alt="Vista previa" style="display:none; max-width: 100%; border-radius: 8px;">
      </div>
    </div>
  `;

  const form = document.getElementById('upload-form');
  const mensaje = document.getElementById('mensaje');
  const preview = document.getElementById('preview');
  const imagenInput = form.imagen_url;

  // Preview de imagen
  imagenInput.addEventListener('input', (e) => {
    const url = e.target.value;
    if (url) {
      preview.src = url;
      preview.style.display = 'block';
      preview.onerror = () => {
        preview.style.display = 'none';
      };
    } else {
      preview.style.display = 'none';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      mensaje.textContent = 'Debes iniciar sesión';
      mensaje.style.color = 'orange';
      return;
    }

    const imagen_url = form.imagen_url.value.trim();
    const descripcion = form.descripcion.value.trim();

    const { error } = await supabase.from('publicaciones').insert([
      {
        usuario_id: user.id,
        imagen_url,
        descripcion
      }
    ]);

    if (error) {
      mensaje.textContent = 'Error al publicar: ' + error.message;
      mensaje.style.color = 'red';
    } else {
      mensaje.textContent = 'Publicación creada exitosamente';
      mensaje.style.color = 'green';
      form.reset();
      preview.style.display = 'none';
      

      setTimeout(() => {
        const { mostrarFeed } = require('./feed.js');
        mostrarFeed();
      }, 1000);
    }
  });
}