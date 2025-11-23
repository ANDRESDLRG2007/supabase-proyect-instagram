// src/componentes/upload.js
import { supabase } from '../supabase.js';

export async function mostrarUpload() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="upload-container">
      <h2>Nueva Publicación</h2>
      <form id="upload-form">
        <label>Selecciona una imagen</label>
        <input type="file" name="imagen" accept="image/*" required />
        
        <label>Descripción</label>
        <textarea name="descripcion" placeholder="Escribe una descripción..." rows="3"></textarea>
        
        <button type="submit" id="btn-publicar">Publicar</button>
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
  const imagenInput = form.imagen;
  const btnPublicar = document.getElementById('btn-publicar');

  // Preview de imagen seleccionada
  imagenInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      preview.style.display = 'none';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';
    btnPublicar.disabled = true;
    btnPublicar.textContent = 'Subiendo...';

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      mensaje.textContent = '⚠️ Debes iniciar sesión';
      mensaje.style.color = 'orange';
      btnPublicar.disabled = false;
      btnPublicar.textContent = 'Publicar';
      return;
    }

    const file = imagenInput.files[0];
    const descripcion = form.descripcion.value.trim();

    if (!file) {
      mensaje.textContent = '⚠️ Selecciona una imagen';
      mensaje.style.color = 'orange';
      btnPublicar.disabled = false;
      btnPublicar.textContent = 'Publicar';
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      mensaje.textContent = '⚠️ Solo se permiten imágenes';
      mensaje.style.color = 'orange';
      btnPublicar.disabled = false;
      btnPublicar.textContent = 'Publicar';
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      mensaje.textContent = '⚠️ La imagen no puede superar 5MB';
      mensaje.style.color = 'orange';
      btnPublicar.disabled = false;
      btnPublicar.textContent = 'Publicar';
      return;
    }

    try {
      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Subir imagen a Supabase Storage (bucket FOTOS)
      mensaje.textContent = 'Subiendo imagen...';
      mensaje.style.color = 'blue';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública de la imagen
      const { data: { publicUrl } } = supabase.storage
        .from('fotos')
        .getPublicUrl(fileName);

      // Guardar publicación en la base de datos
      mensaje.textContent = 'Guardando publicación...';
      
      const { error: insertError } = await supabase.from('publicaciones').insert([
        {
          usuario_id: user.id,
          imagen_url: publicUrl,
          descripcion
        }
      ]);

      if (insertError) {
        // Si falla al guardar en DB, eliminar la imagen subida
        await supabase.storage.from('fotos').remove([fileName]);
        throw insertError;
      }

      // Éxito
      mensaje.textContent = 'Publicación creada exitosamente';
      mensaje.style.color = 'green';
      form.reset();
      preview.style.display = 'none';

      // Volver al feed después de 1 segundo
      setTimeout(() => {
        location.reload();
      }, 1000);

    } catch (error) {
      mensaje.textContent = '❌ Error: ' + error.message;
      mensaje.style.color = 'red';
      console.error('Error al publicar:', error);
    } finally {
      btnPublicar.disabled = false;
      btnPublicar.textContent = 'Publicar';
    }
  });
}