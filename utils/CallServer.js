
const { sendData } = require("./sendData")
const path = require('path');
const fs = require('fs');
const { archiveImages } = require('./archiveImages');
const { deleteFilesInDirectory, deleteFileAfterTimeout } = require('./deleteFilesInDirectory');


class CallServer {
    static isServersTrue = [];

    constructor({ controller, nextFormData, nextServer, processingStatus, processedImages, processedImagesUrl, imagesDir, idQuery, res }) {
        this.controller = controller;
        this.nextFormData = nextFormData;
        this.nextServer = nextServer;
        this.processingStatus = processingStatus;
        this.processedImages = processedImages;
        this.processedImagesUrl = processedImagesUrl;
        this.res = res;
        this.imagesDir = imagesDir;
        this.idQuery = idQuery;
        this.#callNewServer()
    }

    async #callNewServer() {
        let { formData, index, finish } = this.nextFormData()
        // console.log('formData', formData)
        while (true) {
            if (finish) { break }

            if (this.controller.signal.aborted) {
                this.processingStatus.status = 'cancelled';
                break;
            }

            const { server } = this.nextServer();
            console.log(server)

            const res = await sendData(server, formData, this.controller)

            if (res) {
                // console.log('res', res)
                const base64Data = res[0].imageBase64.replace(/^data:image\/jpeg;base64,/, '');
                const filePath = path.join(this.imagesDir, res[0].fileName);
                fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
                res[0].imageUrl = `${server}${res[0].fileName}`

                this.processedImages.push(res)
                this.processingStatus.progress = index + 1;
            }

            ({ formData, index, finish } = this.nextFormData())
        }

        this.#checkServersTrue()
    }

    async #checkServersTrue() {

        CallServer.isServersTrue.pop();
        if (CallServer.isServersTrue.length === 0) {
            try {
                this.idQuery.status = "archive images"
                const downloadLink = await archiveImages();
                await deleteFilesInDirectory();
                this.idQuery.status = "Downloading photos from the server"
                this.processingStatus.status = 'cancelled';
                this.res.json({ processedImages: this.processedImages, downloadLink });
                console.log('url', downloadLink)
            } catch (error) {
                console.log(error)
            }
        }
    }
}

module.exports = { CallServer };