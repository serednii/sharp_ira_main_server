const fs = require('fs').promises;
// const fs = require('fs');
const path = require('path');

// const deleteFilesInDirectory = (directory) => {
//     fs.readdir(directory, (err, files) => {
//         if (err) {
//             console.error(`Помилка при зчитуванні каталогу: ${err}`);
//             return;
//         }
//         files.forEach((file) => {
//             const filePath = path.join(directory, file);
//             fs.unlink(filePath, (err) => {
//                 if (err) {
//                     console.error(`Помилка при видаленні файлу: ${err}`);
//                 } else {
//                     console.log(`Файл видалено: ${filePath}`);
//                 }
//             });
//         });
//     });
// };


const deleteFilesInDirectory = async (directory) => {
    try {
        const files = await fs.readdir(directory); // Чекаємо список файлів
        for (const file of files) {
            const filePath = path.join(directory, file);
            await fs.unlink(filePath); // Чекаємо видалення кожного файлу
            console.log(`Файл видалено: ${filePath}`);
        }
    } catch (err) {
        console.error(`Помилка: ${err}`);
    }
};

const deleteFileAfterTimeout = (filePath, timeout = 60000) => { // 60000 мс = 1 хвилина
    setTimeout(() => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Помилка при видаленні файлу ${filePath}: ${err}`);
            } else {
                console.log(`Файл успішно видалено: ${filePath}`);
            }
        });
    }, timeout);
};

module.exports = { deleteFilesInDirectory, deleteFileAfterTimeout };

