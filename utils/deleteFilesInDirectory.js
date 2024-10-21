const fs = require('fs');
const path = require('path');

const deleteFilesInDirectory = (directory) => {
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error(`Помилка при зчитуванні каталогу: ${err}`);
            return;
        }
        files.forEach((file) => {
            const filePath = path.join(directory, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Помилка при видаленні файлу: ${err}`);
                } else {
                    console.log(`Файл видалено: ${filePath}`);
                }
            });
        });
    });
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

