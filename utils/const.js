
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
const imagesDir = path.join(projectRoot, 'processed_images'); // Директорія для зображень
const archiveDir = path.join(projectRoot, 'archive'); // Директорія для архіву
const archivePath = path.join(archiveDir, 'images_archive.zip'); // Шлях до архіву, включаючи ім'я файлу
const linkWorkServers = [];

const numberServers = 5;

// const workerServers = Array.from({ length: numberServers }).map((_, i) => `http://localhost:${8100 + i}/process-images`)

// const workerServers = ['https://sharpiraworksserver-production.up.railway.app/process-images']
const NUMBER_IMAGE_TO_SERVER = 2;

const urlWorkServer = { url: "" };

module.exports = { linkWorkServers, NUMBER_IMAGE_TO_SERVER, imagesDir, archivePath, projectRoot, archiveDir, numberServers, urlWorkServer };