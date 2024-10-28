const { sendData } = require("./sendData")
const path = require('path');
const fs = require('fs');
const { archiveImages } = require('./archiveImages');
const { deleteDirectory, deleteArchive } = require('./deleteFilesInDirectory');
const { archivePath, imagesDir, archiveDir } = require('./const');
const { urlWorkServer } = require('./const');
const { ServerPorts } = require('./ServerPorts');
const { linkWorkServers } = require('./const');

let flag = 0
let knacked = false
class CallServer {
    static isServersTrue = {};
    static process = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    constructor({ generatorData, nextServer, dataQueryId, res, serverPorts, linkWorkServers }, indexProcess) {
        this.generatorData = generatorData;
        this.nextServer = nextServer;
        this.res = res;
        this.dataQueryId = dataQueryId;
        this.idQuery = dataQueryId.id;
        this.serverPorts = serverPorts;
        this.linkWorkServers = linkWorkServers;
        this.indexProcess = indexProcess;
        this.#callNewServer();
        // console.log('dataQueryId', dataQueryId);
    }

    async #callNewServer() {
        let { formData, index, finish } = this.generatorData.nextFormData()
        // console.log('this.linkWorkServers', this.linkWorkServers)


        processingLoop: while (!finish) {
            try {
                console.log('start start start start star start start start' + this.indexProcess)
                // if (flag === 3) {
                //     await this.linkWorkServers[0].close(() => {
                //     })
                //     console.log(`Сервер  зупинено ` + this.indexProcess);
                // }
                await new Promise(resolve => setTimeout(resolve, 300));
                if (this.dataQueryId.controller.signal.aborted) {
                    this.dataQueryId.download = 'cancelled';
                    break;
                }

                const { server } = this.nextServer.next();
                // Якщо немає доступних серверів, припиняємо обробку
                console.log('server', server + " " + this.indexProcess)
                if (!server) {
                    throw new Error('No available servers');
                }
                // console.log('this.controller.aborted', this.dataQueryId.controller.signal.aborted)
                let res;
                formData.append('idProcess', this.indexProcess);
                // if (flag === 2) {
                //     knacked = true
                //     console.log(`Сервер  зупинено ` + this.indexProcess);

                //     res = await sendData(server + '45', formData, this.dataQueryId.controller, this.indexProcess)
                //     console.log(`Сервер  зупинено ` + this.indexProcess);

                // } else {
                //     console.log('11111111111111111111111111111111111111111111111111 ' + this.indexProcess)
                //     if (knacked) {
                //         console.log('********************************************************')
                //         console.log(server)
                //         console.log(formData)
                //         console.log(this.dataQueryId.controller.signal.aborted)
                //         console.log('********************************************************')
                //     }
                res = await sendData(server, formData, this.dataQueryId.controller, this.indexProcess)
                // }
                // flag++
                // console.log('222222222222222222222222222222222222222222222222222222 ' + this.indexProcess)

                if (res) {
                    // console.log('33333333333333333333333333333333333333333333333333 ' + this.indexProcess)

                    const base64Data = res[0].imageBase64.replace(/^data:image\/jpeg;base64,/, '');
                    const filePath = path.join(imagesDir, this.dataQueryId.id.toString());
                    const filePathName = path.join(filePath, res[0].fileName);

                    if (!fs.existsSync(filePath)) {
                        fs.mkdirSync(filePath);
                    }

                    fs.writeFileSync(filePathName, Buffer.from(base64Data, 'base64'));
                    // CallServer.process[this.indexProcess]++
                    this.dataQueryId.processedImages.push(res)
                    this.dataQueryId.progress += 1;
                    ({ formData, index, finish } = this.generatorData.nextFormData())
                    // console.log('444444444444444444444444444444444444444444444444444444444 ' + this.indexProcess)

                } else {
                    // console.log('6666666666666666666666666666666666666666666666666666666666 ' + this.indexProcess)
                    throw new Error('ошибка отправки на сервер')
                    // this.generatorData.returnFormData(formData);
                    // console.log('this.dataQueryId.serverPorts.urlPorts', this.dataQueryId.serverPorts.urlPorts)
                    // this.nextServer.deleteErrorServer(server);
                    // continue processingLoop; // Пропустить сервер и перейти к следующему
                    // console.log('this.dataQueryId.serverPorts.urlPorts', this.dataQueryId.serverPorts.urlPorts)
                    // ({ formData, index, finish } = this.generatorData.nextFormData())
                    // continue
                    // this.#checkServersTrue()
                    // break;
                }
                // console.log('55555555555555555555555555555555555555555555555555555555555555 ' + this.indexProcess)

            } catch (error) {
                // console.log('777777777777777777777777777777777777777777777777777777777777 ' + this.indexProcess)
                // console.log('this.dataQueryId.serverPorts.urlPorts', this.dataQueryId.serverPorts.urlPorts)
                console.log(error)
                // this.nextServer.deleteErrorServer(server);
                await new Promise(resolve => setTimeout(resolve, 1000));
                // console.log('6666666666666666666666666666666666666666666666666666666666 ' + this.indexProcess)
                // continue processingLoop; // Пропустить сервер и перейти к следующему
            }

        }


        // console.log('888888888888888888888888888888888888888888888888888888888888888888888 ' + this.indexProcess)

        this.#checkServersTrue()
    }

    async #checkServersTrue() {
        console.log('999999999999999999999999999999999999999999999999999999999999999 ' + this.indexProcess)
        try {

            CallServer.isServersTrue[this.idQuery].pop();
            console.log('CallServer.isServersTrue[this.idQuery]', CallServer.isServersTrue[this.idQuery])

            if (CallServer.isServersTrue[this.idQuery].length === 0) {
                this.dataQueryId.serverPorts.returnPorts();
                linkWorkServers.forEach(server => server.close(() => console.log(`Сервер  зупинено`)));
                linkWorkServers.length = 0;

                console.log('ServerPorts.ports**********************************', ServerPorts.freePorts)
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

                const id = this.idQuery.toString();
                const newImagesDir = path.join(imagesDir, id);//Папка для нових фото

                if (this.dataQueryId.controller.signal.aborted) {

                    await deleteDirectory(newImagesDir);
                    throw new Error('Aborted process')
                }


                this.dataQueryId.progress = this.dataQueryId.total;
                const newArchivePath = path.join(archiveDir, `${id}_images_archive.zip`);//Папка для архіва з фото
                const downloadUrlArchive = `${urlWorkServer.url}/archive/${id}_images_archive.zip`//Імя архів з фотографіями
                this.dataQueryId.processingStatus = 'archive images';
                const downloadLink = await archiveImages(newImagesDir, newArchivePath, downloadUrlArchive);

                setTimeout(() => { deleteArchive(newArchivePath) }, 60000);
                await deleteDirectory(newImagesDir);
                this.dataQueryId.processingStatus = "downloading"
                this.res.json({ processedImages: this.dataQueryId.processedImages, downloadLink });
                // console.log('CallServer.process', CallServer.process)
                // console.log('this.dataQueryId.processedImages', this.dataQueryId.processedImages.length)
                // CallServer.process = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                // console.log('url', downloadLink)
            }
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports = { CallServer };