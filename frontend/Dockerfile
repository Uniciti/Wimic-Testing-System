# Используем базовый образ node
FROM node:22

# Устанавливаем рабочую директорию
WORKDIR /src

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект в рабочую директорию
COPY . .

# Строим приложение для продакшн
RUN npm run build --configuration=production

# Устанавливаем базовый образ для сервера
FROM nginx:alpine

# Копируем билд в папку, из которой Nginx будет раздавать статические файлы
COPY --from=0 /dist/angular_system_for_testing /usr/share/nginx/html

# Экспонируем порт 80
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]
