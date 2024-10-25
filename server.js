const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
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
const dataQuery = {}
// Створимо директорію для збереження зображень, якщо вона не існує
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir);
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
    console.log('req.idQuery', idQuery)

    // console.log(req.files[0])
    dataQuery[idQuery].download = 'processing';
    dataQuery[idQuery].total = req.files.length;

    const nextFormData = generatorFormData(req)
    const nextServer = generateNewServer(workerServers)
    // Використовуємо цикл `for...of` для послідовного завантаження

    // console.log('nextFormData', nextFormData)

    CallServer.isServersTrue[idQuery] = new Array(numberServers).fill('hello')

    const dataForCallServer = {
        nextFormData,
        nextServer,
        imagesDir,
        dataQueryId: dataQuery[idQuery],
        res,
    }

    for (let i = 0; i < numberServers; i++) {
        new CallServer(dataForCallServer);
    }

});

app.post('/init', (req, res) => {

    const { idQuery, urlWorkServer: url } = req.body;

    dataQuery[idQuery] = {
        controller: new AbortController(),
        download: "Uploading files to the server",
        id: idQuery,
        progress: 0,
        total: 0,
        processingStatus: 'processing',
        processedImages: [],
    }

    urlWorkServer.url = String(url)
    console.log('req.body.idQuery', idQuery, url)
    // processingStatus.progress = 0;
    // processingStatus.total = 0;
    // processingStatus.status = 'processing';
    res.send('Дані проініціалізовано');
});

// Додайте новий ендпоінт для отримання статусу
app.post('/status', (req, res) => {
    const { idQuery } = req.body;
    console.log('get status', idQuery)
    // console.log(dataQuery)
    res.json({
        progress: dataQuery[idQuery]?.progress,
        download: dataQuery[idQuery]?.download,
        total: dataQuery[idQuery]?.total,
        processingStatus: dataQuery[idQuery]?.processingStatus,
    });
});

app.post('/cancel', (req, res) => {
    const { idQuery } = req.body;
    console.log('cancell', idQuery)
    dataQuery[idQuery].processingStatus = 'cancelled'
    dataQuery[idQuery].controller.abort(); // Скасовуємо всі запити
    res.send('Запит скасовано');
});
app.use('/images', express.static(imagesDir));

// app.use('/archive', express.static(path.join(__dirname, 'archive')));


// Маршрут для завантаження конкретного файлу
app.get('/archive/:file', (req, res) => {
    const filePath = path.join(archiveDir, req.params.file);
    console.log('archive/:file', req.params.file)
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


app.get('/statusres', (req, res) => {
    console.log('get status')
    res.json("get status");
});

app.listen(port, () => {
    console.log(`Центральний сервер працює на http://localhost:${port}`);
});



// // Маршрут для створення архіву та повернення посилання на завантаження
// app.get('/download-archive', async (req, res) => {
//     console.log('download-archive')

//     try {
//         const downloadUrl = await archiveImages(); // Архівація зображень
//         res.json({
//             downloadUrl: downloadUrl // Повертаємо URL для завантаження архіву
//         });
//     } catch (error) {
//         console.error('Помилка при створенні архіву:', error);
//         res.status(500).send('Помилка під час створення архіву');
//     }
// });








// // Функція для створення сервера
// const createServer = (port) => {
//     const app = express();

//     // Використовуємо CORS для дозволу запитів з інших доменів
//     app.use(cors());

//     // Налаштування multer для завантаження файлів
//     const storage = multer.memoryStorage();
//     const upload = multer({ storage: storage });

//     // Функція обробки зображень
//     const processImages = async (req, res) => {
//         console.log('processImages')
//         if (!req.files || req.files.length === 0) {
//             return res.status(400).send('Будь ласка, завантажте зображення');
//         }

//         const processType = req.body.processType;
//         const processedImages = [];

//         try {
//             for (let i = 0; i < req.files.length; i++) {
//                 let processedImage;
//                 console.log(`Обробляється зображення на сервері з портом: ${port}`); // Виводимо номер порта
//                 switch (processType) {
//                     case 'resize':
//                         const width = parseInt(req.body.resizeWidth) || 300;
//                         const height = parseInt(req.body.resizeHeight) || 300;
//                         processedImage = await sharp(req.files[i].buffer).resize(width, height).toBuffer();
//                         break;
//                     case 'grayscale':
//                         processedImage = await sharp(req.files[i].buffer).grayscale().toBuffer();
//                         break;
//                     case 'rotate':
//                         const degrees = parseInt(req.body.rotateDegrees) || 90;
//                         processedImage = await sharp(req.files[i].buffer).rotate(degrees).toBuffer();
//                         break;
//                     case 'blur':
//                         const blurLevel = parseFloat(req.body.blurLevel) || 5;
//                         processedImage = await sharp(req.files[i].buffer).blur(blurLevel).toBuffer();
//                         break;
//                     case 'brightness':
//                         const brightnessLevel = parseFloat(req.body.brightnessLevel) || 1;
//                         processedImage = await sharp(req.files[i].buffer).modulate({ brightness: brightnessLevel }).toBuffer();
//                         break;
//                     case 'contrast':
//                         const contrastLevel = parseFloat(req.body.contrastLevel) || 1;
//                         processedImage = await sharp(req.files[i].buffer).modulate({ contrast: contrastLevel }).toBuffer();
//                         break;
//                     case 'crop':
//                         const cropWidth = parseInt(req.body.cropWidth) || 300;
//                         const cropHeight = parseInt(req.body.cropHeight) || 300;
//                         processedImage = await sharp(req.files[i].buffer).extract({ width: cropWidth, height: cropHeight, left: 0, top: 0 }).toBuffer();
//                         break;
//                     default:
//                         return res.status(400).send('Невідомий тип обробки');
//                 }

//                 const imageBase64 = `data:image/jpeg;base64, ${processedImage.toString('base64')}`;
//                 const fileName = req.files[i].originalname;
//                 processedImages.push({ imageBase64, fileName });

//             }

//             res.json(processedImages);
//         } catch (error) {
//             if (req.aborted) {
//                 console.log('Запит було скасовано');
//             } else {
//                 res.status(500).send('Помилка під час обробки зображень');
//             }
//         }
//     };

//     // Роут для обробки зображень
//     app.post('/process-images', upload.array('images', 200), processImages);

//     // Запускаємо сервер
//     app.listen(port, () => {
//         console.log(`Оброблювальний сервер працює на http://localhost:${port}`);
//     });
//     app.get('/status', (req, res) => {
//         console.log('get status port  ', port)
//         res.json({ st: "Сервер работает" });
//     });
// };

// // Функція для створення кількох серверів
// const createServers = (numServers, startPort) => {
//     for (let i = 0; i < numServers; i++) {
//         const port = startPort + i;
//         createServer(port);
//     }
// };




// // Кількість серверів і стартовий порт
// const startPort = 8100; // Початковий порт

// createServers(numberServers, startPort);

