const workerServers = [
    'http://localhost:8001/process-images',
    'http://localhost:8002/process-images',
    'http://localhost:8003/process-images',
];

//Returns the next element from the array, if the array reaches the end, move to the first element
function generateNewServer(workerServers) {
    let index = -1;

    const next = () => {
        // Спочатку збільшуємо індекс
        index++;
        // Якщо індекс більше або дорівнює кількості серверів, скидаємо його на 0
        if (index >= workerServers.length) {
            index = 0;
        }

        // Повертаємо поточний сервер
        return {
            server: workerServers[index]
        };
    };

    return next;
}


module.exports = { generateNewServer, workerServers };