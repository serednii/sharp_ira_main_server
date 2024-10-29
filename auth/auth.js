const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = 8500;
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(bodyParser.json());
app.use(cors());
// Ініціалізуємо файл, якщо він не існує
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// Функція для зчитування користувачів з файлу
const readUsers = () => {
    return JSON.parse(fs.readFileSync(USERS_FILE));
};

// Функція для запису користувачів у файл
const writeUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Ендпоінт для реєстрації
app.post('/register', async (req, res) => {
    try {
        const { login, password, name, email } = req.body;

        // Перевірка обов'язкових полів
        if (!login || !password || !name || !email) {
            return res.status(400).json({ message: 'Всі поля є обов’язковими' });
        }

        const users = readUsers();

        // Перевірка, чи існує користувач з таким логіном
        const userExists = users.some(user => user.login === login);
        if (userExists) {
            return res.status(400).json({ message: 'Користувач з таким логіном вже існує' });
        }

        // Хешування пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Додаємо нового користувача
        const newUser = { login, password: hashedPassword, name, email };
        users.push(newUser);
        writeUsers(users);

        res.status(201).json({ message: 'Реєстрація успішна' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// Ендпоінт для входу
app.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;

        // Перевірка обов'язкових полів
        if (!login || !password) {
            return res.status(400).json({ message: 'Логін і пароль є обов’язковими' });
        }

        const users = readUsers();

        // Знаходимо користувача за логіном
        const user = users.find(user => user.login === login);
        if (!user) {
            return res.status(400).json({ message: 'Невірний логін або пароль' });
        }

        // Перевірка пароля
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Невірний логін або пароль' });
        }

        res.status(200).json({ message: 'Вхід успішний' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});
