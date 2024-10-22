const archiver = require('archiver'); // Для створення архівів
const fs = require('fs');
const path = require('path');

const { archivePath, imagesDir, archiveDir } = require('./const');
const { deleteDirectory, deleteArchive, deleteFileAfterTimeout } = require('./deleteFilesInDirectory');
const { urlWorkServer } = require('./const');

// Перевірка, чи існує папка "archive", якщо ні — створюємо її
if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir);
}

// Перевіряємо, чи "archivePath" не є директорією
if (fs.existsSync(archivePath) && fs.lstatSync(archivePath).isDirectory()) {
    throw new Error(`Помилка: ${archivePath} є директорією, а не файлом.`);
}

const archiveImages = async (idQuery) => {
    const newImagesDir = path.join(imagesDir, idQuery);
    const newArchivePath = path.join(archiveDir, `${idQuery}_images_archive.zip`);
    // const downloadUrlArchive = path.join(urlWorkServer.url, `/archive/${idQuery}_images_archive.zip`);
    const downloadUrlArchive = `${urlWorkServer.url}/archive/${idQuery}_images_archive.zip`

    console.log('req.params.file archiveImages', urlWorkServer.url, downloadUrlArchive)
    const output = fs.createWriteStream(newArchivePath); // Створюємо потік для запису архіву

    const archive = archiver('zip', {
        zlib: { level: 9 } // Опція для максимального стиснення
    });

    return new Promise((resolve, reject) => {
        //папка з малюнками  + папка idQuery
        console.log('newImagesDir', newImagesDir)
        output.on('close', async function () {
            console.log(`${archive.pointer()} байт записано до архіву`);

            // Після успішної архівації видаляємо файли з папки
            setTimeout(() => { deleteArchive(newArchivePath) }, (TIME_DELETE_ARCHIVE))
            await deleteDirectory(newImagesDir)
            // deleteFileAfterTimeout(archivePath, 10000)
            resolve(downloadUrlArchive); // Повертаємо URL для завантаження
        });

        archive.on('error', function (err) {
            reject(err); // Відхиляємо Promise у разі помилки
        });

        archive.pipe(output);

        // Додаємо всі зображення з папки до архіву
        archive.directory(newImagesDir, false);

        // Завершуємо архів
        archive.finalize();
    });
};

module.exports = { archiveImages };
