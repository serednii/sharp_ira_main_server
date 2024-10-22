const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { AbortController } = require('node-abort-controller');
const EventEmitter = require('events');
const myEmitter = new EventEmitter();
const { generatorFormData } = require("./utils/generatorFormData");
const { CallServer } = require("./utils/CallServer");
const { generateNewServer } = require("./utils/generateNewServer");
const { archiveImages } = require("./utils/archiveImages");
const { imagesDir, archiveDir, workerServers, numberServers } = require('./utils/const');
const { deleteArchive } = require('./utils/deleteFilesInDirectory');
const { urlWorkServer } = require('./utils/const');

myEmitter.setMaxListeners(200); // Збільшуємо ліміт до 20
const app = express();
const port = 8000;
const dataIdQuery = {}
// Створимо директорію для збереження зображень, якщо вона не існує
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir);
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const processingStatus = {}; // Об'єкт для зберігання статусу обробки

let = promises = [];
let controller; // Один controller для всіх запитів

console.log(workerServers)
app.use(express.json());
app.use(cors());

app.post('/upload-multiple', upload.array('images', 300), async (req, res) => {
    // console.clear()
    console.log('upload-multiple')

    if (!req.files || req.files.length === 0) {
        return res.status(400).send('Будь ласка, завантажте зображення');
    }

    const { idQuery } = req.body;
    dataIdQuery[idQuery] = { status: "Image processing", idQuery }
    console.log('req.idQuery', idQuery)

    // console.log(req.files[0])
    controller = new AbortController();

    processingStatus.progress = 0;
    processingStatus.status = 'processing';
    processingStatus.total = req.files.length;

    const nextFormData = generatorFormData(req)
    const nextServer = generateNewServer(workerServers)
    // Використовуємо цикл `for...of` для послідовного завантаження
    const processedImages = [];
    const processedImagesUrl = [];


    CallServer.isServersTrue = new Array(numberServers).fill(true)
    const dataForCallServer = {
        controller,
        nextFormData,
        nextServer,
        processingStatus,
        processedImages,
        processedImagesUrl,
        imagesDir,
        idQuery: dataIdQuery[idQuery],
        res,
    }

    for (let i = 0; i < numberServers; i++) {
        new CallServer(dataForCallServer);
    }

});

app.use('/images', express.static(imagesDir));

// app.use('/archive', express.static(path.join(__dirname, 'archive')));


// Маршрут для завантаження конкретного файлу
app.get('/archive/:file', (req, res) => {
    const filePath = path.join(archiveDir, req.params.file);
    console.log('archive/:file')
    // Перевіряємо, чи існує файл
    if (fs.existsSync(filePath)) {
        console.log('Завантаження архіву:', filePath);

        // Відправляємо файл на завантаження
        res.download(filePath, (err) => {
            if (err) {
                console.error('Помилка при завантаженні файлу:', err);
                res.status(500).send('Помилка при завантаженні файлу.');
            } else {
                // Успішне завантаження, видаляємо файл
                deleteArchive(filePath)
            }
        });
    } else {
        res.status(404).send('Файл не знайдено.');
    }
});

// Маршрут для створення архіву та повернення посилання на завантаження
app.get('/download-archive', async (req, res) => {
    console.log('download-archive')

    try {
        const downloadUrl = await archiveImages(); // Архівація зображень
        res.json({
            downloadUrl: downloadUrl // Повертаємо URL для завантаження архіву
        });
    } catch (error) {
        console.error('Помилка при створенні архіву:', error);
        res.status(500).send('Помилка під час створення архіву');
    }
});

app.post('/cancel', (req, res) => {
    controller.abort(); // Скасовуємо всі запити
    res.send('Запит скасовано');
});

app.post('/init_progress', (req, res) => {
    const { idQuery, urlWorkServer: url } = req.body;

    dataIdQuery[idQuery] = { status: "Uploading files to the server", idQuery }
    urlWorkServer.url = String(url)
    console.log('req.body.idQuery', idQuery)
    processingStatus.progress = 0;
    processingStatus.total = 0;
    processingStatus.status = 'processing';
    res.send('Дані проініціалізовано');
});

// Додайте новий ендпоінт для отримання статусу
app.post('/status', (req, res) => {
    const { idQuery } = req.body;
    console.log('get status', idQuery)
    // console.log(dataIdQuery)
    res.json({ ...processingStatus, download: dataIdQuery[idQuery]?.status });
    // res.json(processingStatus);


});

app.get('/statusres', (req, res) => {
    console.log('get status')
    res.json("get status");
});

app.listen(port, () => {
    console.log(`Центральний сервер працює на http://localhost:${port}`);
});

// app.get('/archive/:file', (req, res) => {
//     console.log('download archive')
//     const filePath = path.join(archiveDir, req.params.file);
//     res.download(filePath, (err) => {
//         if (err) {
//             console.error('Помилка при завантаженні файлу:', err);
//             res.status(500).send('Помилка при завантаженні файлу.');
//         } else {
//             // Після успішного завантаження видаляємо файл
//             fs.unlink(filePath, (err) => {
//                 if (err) {
//                     console.error(`Помилка при видаленні файлу ${filePath}: ${err}`);
//                 } else {
//                     console.log(`Файл успішно видалено: ${filePath}`);
//                 }
//             });
//         }
//     });
// });


// app.get('/download-archive', async (req, res) => {
//     try {
//         const downloadUrl = await archiveImages();
//         res.json({
//             downloadUrl: downloadUrl // Повертаємо URL для завантаження архіву
//         });
//     } catch (error) {
//         res.status(500).send('Помилка під час створення архіву');
//     }
// });



//**************************************************************************************************** */
// let controller; // Один controller для всіх запитів

// app.post('/upload-multiple', upload.array('images', 200), async (req, res) => {
//     // console.log(req.files)
//     // console.log(req.files.length)

//     processingStatus.progress = 0;
//     if (!req.files || req.files.length === 0) {
//         return res.status(400).send('Будь ласка, завантажте зображення');
//     }
//     controller = new AbortController();
//     const processType = req.body.processType;
//     // Очищаємо статус перед початком обробки
//     processingStatus.progress = 0;
//     processingStatus.status = 'processing';
//     processingStatus.total = req.files.length;
//     const nextImage = generatorImages(req.files)
//     // Використовуємо цикл `for...of` для послідовного завантаження
//     const processedImages = [];

//     for (let index = 0; index < req.files.length; index++) {
//         console.log("originalname ", nextImage().image.originalname)

//         const file = req.files[index];
//         const workerServer = workerServers[index % workerServers.length];

//         // console.log(controller.signal.aborted)
//         const formData = new FormData();
//         formData.append('processType', req.body.processType);
//         formData.append('images', file.buffer, { filename: file.originalname });
//         formData.append('resizeWidth', req.body.resizeWidth);
//         formData.append('resizeHeight', req.body.resizeHeight);
//         formData.append('rotateDegrees', req.body.rotateDegrees);
//         formData.append('blurLevel', req.body.blurLevel);
//         formData.append('brightnessLevel', req.body.brightnessLevel);
//         formData.append('contrastLevel', req.body.contrastLevel);
//         formData.append('cropWidth', req.body.cropWidth);
//         formData.append('cropHeight', req.body.cropHeight);

//         if (controller.signal.aborted) {
//             processingStatus.status = 'cancelled';
//             break;
//         }
//         // formData.delete('images')

//         try {
//             const response = await fetch(workerServer, {
//                 method: 'POST',
//                 body: formData,
//                 headers: formData.getHeaders(),
//                 signal: controller.signal, // Передаємо сигнал скасування
//             });

//             if (!response.ok) {
//                 throw new Error('Помилка під час завантаження зображень');
//             }

//             const blobs = await response.json();
//             processedImages.push(blobs); // Зберігаємо результат обробки

//             // Оновлюємо статус
//             processingStatus.progress = index + 1;
//             console.log(`Оброблено зображень: ${index + 1}/${req.files.length}`);

//         } catch (error) {
//             if (error.name === 'AbortError') {
//                 console.log('Запит було скасовано на робочому сервері');

//                 break; // Виходимо з циклу у випадку скасування
//             } else {
//                 console.error('Сталася помилка:', error);
//             }
//         }
//     }

//     // Якщо оброблено всі файли, оновлюємо статус
//     if (processingStatus.progress === req.files.length) {
//         processingStatus.status = 'cancelled';
//         // processingStatus.progress = 0
//     }
//     res.json(processedImages);
// });
//**************************************************************************************************** */



//**************************************************************************************************** */

// app.post('/upload-multiple', upload.array('images', 200), async (req, res) => {
//     controlProcessing()
//     if (!req.files || req.files.length === 0) {
//         return res.status(400).send('Будь ласка, завантажте зображення');
//     }

//     const processType = req.body.processType;
//     const controller = new AbortController();
//     promises = req.files.map(async (file, index) => {
//         const workerServer = workerServers[index % workerServers.length];
//         // Додаємо статус для кожного зображення
//         // const jobId = `job-${index}`;
//         processingStatus.progress = index;
//         processingStatus.status = 'processing';
//         processingStatus.length = req.files.length - 1
//         // processingStatus[jobId] = { progress: 0, status: 'processing' };
//         if (req.files.length - 1 === index) {
//             processingStatus.status = 'stop';
//         }

//         console.log('processingStatus', processingStatus)
//         const formData = new FormData();
//         formData.append('images', file.buffer, { filename: file.originalname });
//         formData.append('processType', processType);
//         formData.append('resizeWidth', req.body.resizeWidth);
//         formData.append('resizeHeight', req.body.resizeHeight);
//         formData.append('rotateDegrees', req.body.rotateDegrees);
//         formData.append('blurLevel', req.body.blurLevel);
//         formData.append('brightnessLevel', req.body.brightnessLevel);
//         formData.append('contrastLevel', req.body.contrastLevel);
//         formData.append('cropWidth', req.body.cropWidth);
//         formData.append('cropHeight', req.body.cropHeight);
//         try {

//             const response = await fetch(workerServer, {
//                 method: 'POST',
//                 body: formData,
//                 headers: formData.getHeaders(),
//                 signal: controller.signal, // Передаємо сигнал скасування
//             })

//             if (!response.ok) {
//                 throw new Error('Помилка під час завантаження зображень');
//             }

//             const blobs = await response.json()
//             return blobs;
//             //     .then(response => {
//             //     if (!response.ok) {
//             //         throw new Error(`Помилка на сервері ${workerServer}`);
//             //     }
//             //     return response.json();
//             // })

//         } catch (error) {
//             if (error.name === 'AbortError') {
//                 console.log('Запит було скасовано на робочому сервері');
//             } else {
//                 console.error('Сталася помилка:', error);
//             }
//             return null;
//         };

//     });
//**************************************************************************************************** */



// try {
//     const results = await Promise.all(promises);
//     const processedImages = results.filter(result => result !== null).flat();
//     res.json(processedImages);
// } catch (error) {
//     console.error('Сталася помилка під час обробки зображень:', error);
//     res.status(500).send('Помилка при обробці зображень');
// }
// });

// Функція для скасування запитів







//На кожен запрос перемикається інший сервер
// const express = require('express');
// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
// const multer = require('multer');
// const cors = require('cors');
// const FormData = require('form-data');

// const app = express();
// const port = 8000;

// // Використовуємо CORS для дозволу запитів з інших доменів
// app.use(cors());

// // Налаштування multer для завантаження файлів
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// // Список оброблювальних серверів
// const workerServers = [
//     'http://localhost:8001/process-images',
//     'http://localhost:8002/process-images',
//     // Додайте більше серверів, якщо потрібно
// ];

// // Лічильник для кругового вибору серверів
// let serverIndex = 0;
// // const formData = new FormData();
// app.post('/upload-multiple', upload.array('images', 200), async (req, res) => {

//     if (!req.files || req.files.length === 0) {
//         return res.status(400).send('Будь ласка, завантажте зображення');
//     }

//     const workerServer = workerServers[serverIndex];
//     serverIndex = (serverIndex + 1) % workerServers.length;
//     console.log("workerServer", workerServer)
//     const formData = new FormData();

//     // Додаємо зображення у formData
//     req.files.forEach(file => {
//         // console.log(file)
//         formData.append('images', file.buffer, { filename: file.originalname });
//     });

//     // Додаємо тип обробки (processType) у formData
//     formData.append('processType', req.body.processType);

//     try {
//         const response = await fetch(workerServer, {
//             method: 'POST',
//             body: formData,
//             headers: formData.getHeaders(),
//         });

//         if (!response.ok) {
//             throw new Error('Помилка під час завантаження зображень на оброблювальний сервер');
//         }

//         const processedImages = await response.json();
//         res.json(processedImages);
//     } catch (error) {
//         console.error('Сталася помилка:', error);
//         res.status(500).send('Помилка при обробці зображень');
//     }
// });



// // Старт центрального сервера
// app.listen(port, () => {
//     console.log(`Центральний сервер працює на http://localhost:${port}`);
// });





// const express = require('express');
// const multer = require('multer');
// const sharp = require('sharp');
// const cors = require('cors');

// const app = express();
// const port = 8000;

// // Використовуємо CORS для дозволу запитів з інших доменів
// app.use(cors());

// // Налаштування multer для завантаження файлів
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// // Роут для обробки кількох зображень
// app.post('/upload-multiple', upload.array('images', 500), async (req, res) => {
//     if (!req.files || req.files.length === 0) {
//         return res.status(400).send('Будь ласка, завантажте зображення');
//     }

//     const processType = req.body.processType; // Отримуємо тип обробки зображень
//     const processedImages = [];

//     try {
//         // Обробляємо кожне зображення окремо
//         for (let i = 0; i < req.files.length; i++) {
//             let processedImage;
//             // Застосовуємо обробку залежно від вибору користувача
//             switch (processType) {
//                 case 'resize':
//                     processedImage = await sharp(req.files[i].buffer).resize(300, 300).toBuffer();
//                     break;
//                 case 'grayscale':
//                     processedImage = await sharp(req.files[i].buffer).grayscale().toBuffer();
//                     break;
//                 case 'rotate':
//                     processedImage = await sharp(req.files[i].buffer).rotate(90).toBuffer();
//                     break;
//                 case 'blur':
//                     processedImage = await sharp(req.files[i].buffer).blur(20).toBuffer();
//                     break;
//                 default:
//                     return res.status(400).send('Невідомий тип обробки');
//             }
//             console.log("i = ", i + 1)

//             // Створюємо URL для кожного обробленого зображення
//             const imageUrl = `data:image/jpeg;base64,${processedImage.toString('base64')}`;
//             processedImages.push(imageUrl);
//         }

//         // Відправляємо оброблені зображення назад у вигляді масиву
//         res.json(processedImages);
//     } catch (error) {
//         res.status(500).send('Помилка під час обробки зображень');
//     }
// });

// // Старт сервера
// app.listen(port, () => {
//     console.log(`Сервер працює на http://localhost:${port}`);
// });

