import express from 'express';
import { Application, Request, Response } from 'express';
// import attRoutes from './routes/att.routes';
// import mainRoutes from './routes/main.routes';
import { setupWebSocketServer } from './ws.server'
import path from 'path';
import http from 'http';

const app = express();

const distDir = path.join(__dirname, '../public');
app.use(express.static(distDir));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distDir, 'index.html'));
});
// app.use('/att', attRoutes); В данной реализации предполагается использование веб-сокетов

const server = http.createServer(app);
// сейчас и сокет и веб-сервер работают на одном порту, возможно стоит переписать
setupWebSocketServer(server);

export { app, server };