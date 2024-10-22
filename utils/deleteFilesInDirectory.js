const fs = require('fs').promises;
// const fs = require('fs');
// const path = require('path');



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


// const deleteFilesInDirectory = async (directory) => {
//     try {
//         const files = await fs.readdir(directory); // Чекаємо список файлів
//         for (const file of files) {
//             const filePath = path.join(directory, file);
//             await fs.unlink(filePath); // Чекаємо видалення кожного файлу
//             console.log(`Файл видалено: ${filePath}`);
//         }
//     } catch (err) {
//         console.error(`Помилка: ${err}`);
//     }
// };
const deleteArchive = async (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Помилка при видаленні файлу ${filePath}: ${err}`);
        } else {
            console.log(`Файл успішно видалено: ${filePath}`);
        }
    });
}

const deleteDirectory = async (directory) => {
    try {
        await fs.rm(directory, { recursive: true, force: true }); // Видаляємо папку рекурсивно
        console.log(`Директорія та її вміст видалені: ${directory}`);
    } catch (err) {
        console.error(`Помилка при видаленні директорії: ${err}`);
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

module.exports = { deleteDirectory, deleteFileAfterTimeout, deleteArchive };

