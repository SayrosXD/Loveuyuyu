// --- LÓGICA DEL TRADUCTOR BLACKPINK ---

document.getElementById('btn-translate').addEventListener('click', async function() {
    // 1. Identificar la página que está al frente (la que no tiene la clase flipped)
    const allPages = Array.from(document.querySelectorAll('.page'));
    const activePageElement = allPages.find(p => !p.classList.contains('flipped'));

    if (!activePageElement) return;

    // Obtener la URL de la imagen del 'front' de esa página
    const frontDiv = activePageElement.querySelector('.front');
    const style = window.getComputedStyle(frontDiv);
    const bgUrl = style.backgroundImage.slice(5, -2).replace(/"/g, "");

    if (!bgUrl || bgUrl === "one") {
        Swal.fire({
            title: 'Ups!',
            text: 'No hay texto detectable en esta página.',
            icon: 'info',
            confirmButtonColor: '#ff4fd8'
        });
        return;
    }

    // 2. Mostrar estado de carga
    Swal.fire({
        title: 'Analizando imagen...',
        html: 'Buscando texto en la página',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); },
        customClass: { popup: 'bp-swal-popup', title: 'bp-swal-title' }
    });

    try {
        // 3. Tesseract OCR (Reconoce inglés y coreano por defecto)
        const worker = await Tesseract.createWorker('eng+kor');
        const { data: { text } } = await worker.recognize(bgUrl);
        await worker.terminate();

        if (!text.trim()) {
            throw new Error("No se encontró texto");
        }

        // 4. Traducir usando la API de Google (Gratuita para este uso)
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=es&dt=t&q=${encodeURIComponent(text)}`);
        const result = await response.json();
        const translatedText = result[0].map(item => item[0]).join("");

        // 5. Mostrar resultado final
        Swal.fire({
            title: 'Traducción',
            text: translatedText,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#ff4fd8',
            customClass: { popup: 'bp-swal-popup', title: 'bp-swal-title' }
        });

    } catch (error) {
        console.error(error);
        Swal.fire({
            title: 'Error',
            text: 'No pudimos leer el texto. Asegúrate de que la imagen sea clara.',
            icon: 'error',
            confirmButtonColor: '#ff4fd8',
            customClass: { popup: 'bp-swal-popup', title: 'bp-swal-title' }
        });
    }
});