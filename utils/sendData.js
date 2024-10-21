
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function sendData(workerServer, formData, controller) {
    try {
        const response = await fetch(workerServer, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
            signal: controller.signal, // Передаємо сигнал скасування
        });

        if (!response.ok) {
            throw new Error('Помилка під час завантаження зображень');
        }

        return await response.json();
        // processedImages.push(blobs); // Зберігаємо результат обробки

        // Оновлюємо статус
        // processingStatus.progress = index + 1;
        // console.log(`Оброблено зображень: ${index + 1}/${req.files.length}`);

    } catch (error) {
        // if (error.name === 'AbortError') {
        // console.log('Запит було скасовано на робочому сервері');
        // break; // Виходимо з циклу у випадку скасування
        // } else {
        console.error('Сталася помилка:', error);
        // }
    }
}

module.exports = { sendData };