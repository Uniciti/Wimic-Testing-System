"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./src/index");
require("dotenv/config");
const PORT = process.env.SERVER_PORT || 3000;
index_1.server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
