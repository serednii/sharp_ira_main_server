
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
const imagesDir = path.join(projectRoot, 'processed_images'); // Директорія для зображень
const archiveDir = path.join(projectRoot, 'archive'); // Директорія для архіву
const archivePath = path.join(archiveDir, 'images_archive.zip'); // Шлях до архіву, включаючи ім'я файлу

const numberServers = 1;

const workerServers = Array.from({ length: numberServers }).map((_, i) => `http://localhost:${8001 + i}/process-images`)

// const workerServers = ['https://sharpiraworksserver-production.up.railway.app/process-images',
//     'https://athletic-inspiration-production.up.railway.app/process-images']
const urlWorkServer = { url: "" };

module.exports = { imagesDir, archivePath, projectRoot, archiveDir, workerServers, numberServers, urlWorkServer };