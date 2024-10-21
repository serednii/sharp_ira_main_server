const archiver = require('archiver'); // Для створення архівів
const fs = require('fs');
const { archivePath, imagesDir, archiveDir } = require('./const');
const { deleteFilesInDirectory, deleteFileAfterTimeout } = require('./deleteFilesInDirectory');


// Перевірка, чи існує папка "archive", якщо ні — створюємо її
if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir);
}

// Перевіряємо, чи "archivePath" не є директорією
if (fs.existsSync(archivePath) && fs.lstatSync(archivePath).isDirectory()) {
    throw new Error(`Помилка: ${archivePath} є директорією, а не файлом.`);
}



const archiveImages = async (server) => {
    const output = fs.createWriteStream(archivePath); // Створюємо потік для запису архіву

    const archive = archiver('zip', {
        zlib: { level: 9 } // Опція для максимального стиснення
    });

    return new Promise((resolve, reject) => {
        output.on('close', function () {
            console.log(`${archive.pointer()} байт записано до архіву`);
            const downloadUrl = `/archive/images_archive.zip`; // URL для завантаження
            resolve(downloadUrl); // Повертаємо URL для завантаження

            // Після успішної архівації видаляємо файли з папки
            // setTimeout(() => { deleteFilesInDirectory(imagesDir); }, (5 * 60 * 1000))
            deleteFilesInDirectory(imagesDir)
            // deleteFileAfterTimeout(archivePath, 10000)
        });

        archive.on('error', function (err) {
            reject(err); // Відхиляємо Promise у разі помилки
        });

        archive.pipe(output);

        // Додаємо всі зображення з папки до архіву
        archive.directory(imagesDir, false);

        // Завершуємо архів
        archive.finalize();
    });
};

module.exports = { archiveImages };
