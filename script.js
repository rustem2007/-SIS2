// --- script.js (ВЕРСИЯ С ДЕТАЛЬНОЙ ДИАГНОСТИКОЙ) ---

window.addEventListener('DOMContentLoaded', async () => {
  
  console.log("=== СТАРТ ДИАГНОСТИКИ ===");
  
  // Проверка 1: Загружена ли библиотека?
  if (typeof Supabase === 'undefined') {
    console.error("❌ ОШИБКА: Supabase библиотека НЕ загружена!");
    alert('❌ Supabase не загружен! Проверь подключение к интернету или CDN ссылку в HTML.');
    return;
  }
  console.log("✅ Supabase библиотека загружена");

  const supabaseUrl = 'https://epyutucscivggoitkbnz.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweXV0dWNzY2l2Z2dvaXRrYm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODQ4NjksImV4cCI6MjA3ODc2MDg2OX0.eW-2GJni95aCleqHa85oBpATb8VVj7kBykqqrxFWa4k';

  let supabase;
  try {
    supabase = Supabase.createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase клиент создан успешно");
  } catch (e) {
    console.error("❌ Ошибка создания Supabase клиента:", e);
    alert('❌ Не удалось подключиться к Supabase');
    return;
  }

  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileListDiv = document.getElementById("fileList");
  const uploadedFilesDiv = document.getElementById("uploadedFiles");

  // Проверка 2: Найдены ли элементы на странице?
  if (!fileInput || !uploadBtn || !fileListDiv || !uploadedFilesDiv) {
    console.error("❌ ОШИБКА: Не найдены элементы на странице!");
    console.log("fileInput:", fileInput);
    console.log("uploadBtn:", uploadBtn);
    console.log("fileListDiv:", fileListDiv);
    console.log("uploadedFilesDiv:", uploadedFilesDiv);
    alert('❌ Ошибка: элементы страницы не найдены. Проверь ID в HTML.');
    return;
  }
  console.log("✅ Все элементы страницы найдены");

  // --- 1. Показ выбранных файлов ---
  fileInput.addEventListener("change", () => {
    fileListDiv.innerHTML = "";
    if (fileInput.files.length === 0) {
      fileListDiv.innerHTML = "<p>Файлы не выбраны</p>";
      return;
    }
    
    console.log(`📁 Выбрано файлов: ${fileInput.files.length}`);
    for (let file of fileInput.files) {
      const sizeKB = (file.size / 1024).toFixed(1);
      fileListDiv.innerHTML += `<p>📄 ${file.name} — ${sizeKB} KB</p>`;
      console.log(`  - ${file.name} (${sizeKB} KB)`);
    }
  });

  // --- 2. Загрузка файлов ---
  uploadBtn.addEventListener("click", async () => {
    console.log("=== НАЧАЛО ЗАГРУЗКИ ===");
    
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
        const timestamp = Date.now();
        const uniqueName = `${timestamp}_${file.name}`;
        
        console.log(`📤 Загрузка: ${file.name} → ${uniqueName}`);
        
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(uniqueName, file, { upsert: true });
        
        if (error) {
          console.error(`❌ ОШИБКА загрузки ${file.name}:`, error);
          console.error("   Код ошибки:", error.statusCode);
          console.error("   Сообщение:", error.message);
          errorCount++;
        } else {
          console.log(`✅ Успешно загружен: ${uniqueName}`);
          console.log("   Данные:", data);
          successCount++;
        }
        
      } catch (e) {
        console.error("❌ КРИТИЧЕСКАЯ ОШИБКА:", e);
        errorCount++;
      }
    }
    
    console.log(`=== ИТОГ ЗАГРУЗКИ: ✅${successCount} ❌${errorCount} ===`);
    
    if (successCount > 0) {
      alert(`✅ Загружено: ${successCount}${errorCount > 0 ? `\n❌ Ошибок: ${errorCount}` : ''}`);
    } else {
      alert(`❌ Не удалось загрузить файлы.\n\nОткрой консоль (F12) и посмотри ошибки!`);
    }
    
    fileInput.value = "";
    fileListDiv.innerHTML = "";
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Загрузить";
    
    await listFiles();
  });

  // --- 3. Список загруженных файлов ---
  async function listFiles() {
    console.log("=== ЗАГРУЗКА СПИСКА ФАЙЛОВ ===");
    
    try {
      console.log("📋 Запрос списка из bucket 'uploads'...");
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (error) {
        console.error("❌ ОШИБКА получения списка файлов:");
        console.error("   Код:", error.statusCode);
        console.error("   Сообщение:", error.message);
        console.error("   Полная ошибка:", error);
        
        uploadedFilesDiv.innerHTML = `
          <p style="color: red; font-weight: bold;">❌ ОШИБКА ЗАГРУЗКИ СПИСКА</p>
          <p style="color: red; font-size: 12px;">${error.message}</p>
          <p style="color: #666; font-size: 11px;">Код: ${error.statusCode || 'нет'}</p>
        `;
        return;
      }

      console.log("✅ Список получен успешно");
      console.log("   Всего объектов в ответе:", data ? data.length : 0);
      console.log("   Данные:", data);

      uploadedFilesDiv.innerHTML = "";
      let fileCount = 0;

      if (!data || data.length === 0) {
        console.log("⚠️ Массив data пустой или null");
        uploadedFilesDiv.innerHTML = "<p style='color: #888;'>📭 Файлов в bucket нет</p>";
        return;
      }

      for (let file of data) {
        console.log(`  📄 Файл: ${file.name}`);
        
        // Игнорируем служебные файлы
        if (file.name === '.emptyFolderPlaceholder') {
          console.log("    ⏩ Пропущен (служебный файл)");
          continue;
        }
        
        fileCount++;
        
        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(file.name);
        
        console.log(`    🔗 URL: ${urlData.publicUrl}`);
        
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
        console.log("⚠️ Нет файлов после фильтрации");
        uploadedFilesDiv.innerHTML = "<p style='color: #888;'>📭 Файлов нет (только служебные)</p>";
      } else {
        console.log(`✅ Отображено файлов: ${fileCount}`);
      }
      
    } catch (e) {
      console.error("❌ КРИТИЧЕСКАЯ ОШИБКА при загрузке списка:");
      console.error(e);
      uploadedFilesDiv.innerHTML = `
        <p style='color: red;'>❌ Критическая ошибка</p>
        <p style='color: #666; font-size: 11px;'>${e.message}</p>
      `;
    }
  }

  // --- 4. Первая загрузка при старте ---
  console.log("🚀 Инициализация: загрузка списка файлов...");
  await listFiles();
  console.log("=== ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА ===\n\n");
  
});

