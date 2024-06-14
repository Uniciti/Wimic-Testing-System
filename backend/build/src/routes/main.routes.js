"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const main_controllers_1 = require("../controllers/main.controllers");
const mainRouter = (0, express_1.Router)();
mainRouter.get('/test', main_controllers_1.test);
mainRouter.get('*', main_controllers_1.frontSender);
exports.default = mainRouter;
