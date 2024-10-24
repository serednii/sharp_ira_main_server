
const { sendData } = require("./sendData")
const path = require('path');
const fs = require('fs');
const { archiveImages } = require('./archiveImages');
const { deleteDirectory, deleteArchive } = require('./deleteFilesInDirectory');
const { archivePath, imagesDir, archiveDir } = require('./const');
const { urlWorkServer } = require('./const');


class CallServer {
    static isServersTrue = {};

    constructor({ controller, nextFormData, nextServer, imagesDir, dataQueryId, res }) {
        this.controller = controller;
        this.nextFormData = nextFormData;
        this.nextServer = nextServer;
        this.res = res;
        this.imagesDir = imagesDir;
        this.dataQueryId = dataQueryId;
        this.idQuery = dataQueryId.id;
        this.#callNewServer()
        console.log('dataQueryId', dataQueryId)
    }

    async #callNewServer() {
        let { formData, index, finish } = this.nextFormData()
        // console.log('formData', formData)
        while (true) {
            if (finish) { break }

            if (this.controller.signal.aborted) {
                this.dataQueryId.download = 'cancelled';
                break;
            }

            const { server } = this.nextServer();
            console.log(server)

            const res = await sendData(server, formData, this.controller)

            if (res) {
                // console.log('res', res)
                const base64Data = res[0].imageBase64.replace(/^data:image\/jpeg;base64,/, '');

                const filePath = path.join(this.imagesDir, this.dataQueryId.id.toString());
                const filePathName = path.join(filePath, res[0].fileName);

                if (!fs.existsSync(filePath)) {
                    fs.mkdirSync(filePath);
                }

                fs.writeFileSync(filePathName, Buffer.from(base64Data, 'base64'));
                // res[0].imageUrl = `${server}${res[0].fileName}`

                this.dataQueryId.processedImages.push(res)
                this.dataQueryId.progress = index + 1;
            }

            ({ formData, index, finish } = this.nextFormData())
        }

        this.#checkServersTrue()
    }

    async #checkServersTrue() {
        console.log(CallServer.isServersTrue[this.idQuery])
        CallServer.isServersTrue[this.idQuery].pop();
        if (CallServer.isServersTrue[this.idQuery].length === 0) {
            try {
                // Перевіряємо існування вихідної директорії

                if (!fs.existsSync(imagesDir)) {
                    fs.mkdirSync(imagesDir);
                }

                if (!fs.existsSync(archiveDir)) {
                    fs.mkdirSync(archiveDir);
                }

                // Перевіряємо, чи "archivePath" не є директорією
                if (fs.existsSync(archivePath) && fs.lstatSync(archivePath).isDirectory()) {
                    throw new Error(`Помилка: ${archivePath} є директорією, а не файлом.`);
                }

                this.dataQueryId.download = "archive images"
                const id = this.idQuery.toString()
                const newImagesDir = path.join(imagesDir, id);
                const newArchivePath = path.join(archiveDir, `${id}_images_archive.zip`);
                const downloadUrlArchive = `${urlWorkServer.url}/archive/${id}_images_archive.zip`

                const downloadLink = await archiveImages(newImagesDir, newArchivePath, downloadUrlArchive);
                setTimeout(() => { deleteArchive(newArchivePath) }, 60000 * 3);
                await deleteDirectory(newImagesDir);
                // await deleteFilesInDirectory(this.idQuery.idQuery);
                this.dataQueryId.download = "Downloading photos from the server"
                this.dataQueryId.processingStatus = 'cancelled';
                this.res.json({ processedImages: this.dataQueryId.processedImages, downloadLink });
                console.log('url', downloadLink)
            } catch (error) {
                console.log(error)
            }
        }
    }
}

module.exports = { CallServer };