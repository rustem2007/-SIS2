// === Настройка Supabase ===
const supabaseUrl = 'https://epyutucscivggoitkbnz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweXV0dWNzY2l2Z2dvaXRrYm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODQ4NjksImV4cCI6MjA3ODc2MDg2OX0.eW-2GJni95aCleqHa85oBpATb8VVj7kBykqqrxFWa4k';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const fileListDiv = document.getElementById("fileList");
const uploadedFilesDiv = document.getElementById("uploadedFiles");

// === Показ выбранных файлов ===
fileInput.addEventListener("change", () => {
    fileListDiv.innerHTML = "";
    for (let file of fileInput.files) {
        const sizeKB = (file.size / 1024).toFixed(1);
        fileListDiv.innerHTML += `<p>📄 ${file.name} — ${sizeKB} KB</p>`;
    }
});

// === Загрузка файлов ===
uploadBtn.addEventListener("click", async () => {
    if (fileInput.files.length === 0) return alert("Выберите файлы для загрузки");

    for (let file of fileInput.files) {
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(file.name, file, { upsert: true });
        if (error) {
            console.error("Ошибка загрузки:", error.message);
            alert(`Ошибка загрузки файла: ${file.name}`);
        }
    }
    fileInput.value = "";
    fileListDiv.innerHTML = "";
    await listFiles();
});

// === Список загруженных файлов ===
async function listFiles() {
    const { data, error } = await supabase.storage.from('uploads').list();
    if (error) { console.error(error.message); return; }

    uploadedFilesDiv.innerHTML = "";
    for (let file of data) {
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(file.name);
        uploadedFilesDiv.innerHTML += `
            <div class="uploaded-file">
                <span>📄 ${file.name}</span>
                <a href="${urlData.publicUrl}" target="_blank">Скачать</a>
            </div>
        `;
    }
}

// Загружаем список при старте страницы
listFiles();
