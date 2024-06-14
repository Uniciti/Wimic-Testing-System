"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
// import attRoutes from './routes/att.routes';
// import mainRoutes from './routes/main.routes';
const ws_server_1 = require("./ws.server");
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
exports.app = app;
const distDir = path_1.default.join(__dirname, '../public');
app.use(express_1.default.static(distDir));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(distDir, 'index.html'));
});
// app.use('/att', attRoutes); В данной реализации предполагается использование веб-сокетов
const server = http_1.default.createServer(app);
exports.server = server;
// сейчас и сокет и веб-сервер работают на одном порту, возможно стоит переписать
(0, ws_server_1.setupWebSocketServer)(server);
