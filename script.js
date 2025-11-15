// --- script.js (ИСПРАВЛЕННАЯ ВЕРСИЯ) ---

// ✅ Ждем загрузки Supabase из CDN
window.addEventListener('DOMContentLoaded', async () => {
  
  // Проверяем, загружена ли библиотека Supabase
  if (typeof Supabase === 'undefined') {
    alert('❌ Ошибка: Библиотека Supabase не загружена! Проверьте подключение к интернету.');
    return;
  }

  const supabaseUrl = 'https://epyutucscivggoitkbnz.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweXV0dWNzY2l2Z2dvaXRrYm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODQ4NjksImV4cCI6MjA3ODc2MDg2OX0.eW-2GJni95aCleqHa85oBpATb8VVj7kBykqqrxFWa4k';

  const supabase = Supabase.createClient(supabaseUrl, supabaseKey);

  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileListDiv = document.getElementById("fileList");
  const uploadedFilesDiv = document.getElementById("uploadedFiles");

  // --- 1. Показ выбранных файлов ---
  fileInput.addEventListener("change", () => {
    fileListDiv.innerHTML = "";
    if (fileInput.files.length === 0) {
      fileListDiv.innerHTML = "<p>Файлы не выбраны</p>";
      return;
    }
    
    for (let file of fileInput.files) {
      const sizeKB = (file.size / 1024).toFixed(1);
      fileListDiv.innerHTML += `<p>📄 ${file.name} — ${sizeKB} KB</p>`;
    }
  });

  // --- 2. Загрузка файлов ---
  uploadBtn.addEventListener("click", async () => {
    if (fileInput.files.length === 0) {
      alert("⚠️ Выберите файлы для загрузки");
      return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Загрузка...";

    let successCount = 0;
    let errorCount = 0;

    for (let file of fileInput.files) {
      try {
        // Генерируем уникальное имя файла с timestamp
        const timestamp = Date.now();
        const uniqueName = `${timestamp}_${file.name}`;
        
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(uniqueName, file, { upsert: true });
        
        if (error) {
          console.error(`❌ Ошибка загрузки ${file.name}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Файл ${file.name} загружен как ${uniqueName}`);
          successCount++;
        }
        
      } catch (e) {
        console.error("❌ Критическая ошибка:", e);
        errorCount++;
      }
    }
    
    // Показываем результат
    if (successCount > 0) {
      alert(`✅ Загружено файлов: ${successCount}${errorCount > 0 ? `\n❌ Ошибок: ${errorCount}` : ''}`);
    } else {
      alert(`❌ Не удалось загрузить файлы. Проверьте консоль (F12).`);
    }
    
    // Очищаем форму и обновляем список
    fileInput.value = "";
    fileListDiv.innerHTML = "";
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Загрузить";
    
    await listFiles();
  });

  // --- 3. Список загруженных файлов ---
  async function listFiles() {
    try {
      const { data, error } = await supabase.storage.from('uploads').list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });
      
      if (error) {
        console.error("❌ Ошибка получения списка:", error.message);
        uploadedFilesDiv.innerHTML = `<p style="color: red;">❌ Ошибка: ${error.message}</p>`;
        return;
      }

      uploadedFilesDiv.innerHTML = "";
      let fileCount = 0;

      for (let file of data) {
        // Игнорируем служебные файлы
        if (file.name === '.emptyFolderPlaceholder') continue;
        
        fileCount++;
        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(file.name);
        
        const fileSizeKB = file.metadata?.size 
          ? (file.metadata.size / 1024).toFixed(1) 
          : '?';
        
        uploadedFilesDiv.innerHTML += `
          <div class="uploaded-file">
            <a href="${urlData.publicUrl}" target="_blank" rel="noopener">${file.name}</a>
            <span style="color: #888; font-size: 12px;">${fileSizeKB} KB</span>
          </div>
        `;
      }
      
      if (fileCount === 0) {
        uploadedFilesDiv.innerHTML = "<p style='color: #888;'>📭 Файлов пока нет</p>";
      } else {
        console.log(`📊 Всего файлов: ${fileCount}`);
      }
      
    } catch (e) {
      console.error("❌ Критическая ошибка при загрузке списка:", e);
      uploadedFilesDiv.innerHTML = "<p style='color: red;'>❌ Ошибка загрузки списка</p>";
    }
  }

  // --- 4. Загрузка списка при старте ---
  console.log("🚀 Загрузка списка файлов...");
  await listFiles();
  console.log("✅ Инициализация завершена");
  
});
