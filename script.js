const supabaseUrl = 'https://epyutucscivggoitkbnz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweXV0dWNzY2l2Z2dvaXRrYm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODQ4NjksImV4cCI6MjA3ODc2MDg2OX0.eW-2GJni95aCleqHa85oBpATb8VVj7kBykqqrxFWa4k';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const uploadedFilesDiv = document.getElementById("uploadedFiles");

// Загрузка файлов
uploadBtn.addEventListener("click", async () => {
    for (let file of fileInput.files) {
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(file.name, file, { upsert: true });

        if (error) console.log("Ошибка загрузки:", error.message);
    }
    fileInput.value = "";
    await listFiles();
});

// Список файлов
async function listFiles() {
    const { data, error } = await supabase.storage.from('uploads').list();
    if (error) { console.log(error.message); return; }

    uploadedFilesDiv.innerHTML = "";
    for (let file of data) {
        const { publicURL } = supabase.storage.from('uploads').getPublicUrl(file.name);
        uploadedFilesDiv.innerHTML += `<div><a href="${publicURL}" target="_blank">${file.name}</a></div>`;
    }
}

// Загружаем список при открытии
listFiles();
