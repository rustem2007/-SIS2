// --- script.js (Финальная и исправленная версия) ---

const supabaseUrl = 'https://epyutucscivggoitkbnz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweXV0dWNzY2l2Z2dvaXRrYm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODQ4NjksImV4cCI6MjA3ODc2MDg2OX0.eW-2GJni95aCleqHa85oBpATb8VVj7kBykqqrxFWa4k';

// ⚠️ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем 'Supabase' (с большой S)
const supabase = Supabase.createClient(supabaseUrl, supabaseKey); 

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const fileListDiv = document.getElementById("fileList");
const uploadedFilesDiv = document.getElementById("uploadedFiles");

// Показ выбранных файлов
fileInput.addEventListener("change", () => {
  fileListDiv.innerHTML = "";
  for (let file of fileInput.files) {
    const sizeKB = (file.size / 1024).toFixed(1);
    fileListDiv.innerHTML += `<p>📄 ${file.name} — ${sizeKB} KB</p>`;
  }
});

// Загрузка файлов
uploadBtn.addEventListener("click", async () => {
  if (fileInput.files.length === 0) return alert("Выберите файлы");

  for (let file of fileInput.files) {
    try {
      const { error } = await supabase.storage
        .from('uploads')
        .upload(file.name, file, { upsert: true }); 
      
      if (error) {
        console.error(`Ошибка загрузки ${file.name}:`, error.message);
        alert(`❌ Ошибка загрузки файла ${file.name}: ${error.message}. Проверьте политики RLS!`);
        return; 
      }
      
      console.log(`✅ Файл ${file.name} загружен успешно.`);
      
    } catch (e) {
      console.error("Критическая ошибка:", e);
      alert("Произошла критическая ошибка во время загрузки. Проверьте консоль.");
      return;
    }
  }
  
  fileInput.value = "";
  fileListDiv.innerHTML = "";
  await listFiles();
});

// Список загруженных файлов
async function listFiles() {
  const { data, error } = await supabase.storage.from('uploads').list();
  
  // Если ошибка, выводим ее в консоль и на сайт
  if (error) { 
    console.error("Ошибка получения списка файлов:", error.message); 
    uploadedFilesDiv.innerHTML = `<p style="color: red;">Ошибка загрузки списка: ${error.message}</p>`;
    return; 
  }

  uploadedFilesDiv.innerHTML = "";
  let fileCount = 0;

  for (let file of data) {
    // Игнорируем системные файлы
    if (file.name === '.emptyFolderPlaceholder') continue; 
    
    fileCount++;
    // Получаем публичный URL
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(file.name);
    
    // Используем div с классом uploaded-file для стилизации
    uploadedFilesDiv.innerHTML += `
      <div class="uploaded-file">
        <a href="${urlData.publicUrl}" target="_blank">${file.name}</a>
      </div>
    `;
  }
  
  if (fileCount === 0) {
      uploadedFilesDiv.innerHTML = "<p>Файлов пока нет.</p>";
  }
}

// При загрузке страницы
listFiles();
