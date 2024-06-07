"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOSType = void 0;
const os_1 = require("os");
function getOSType() {
    const osString = (0, os_1.type)();
    switch (osString) {
        case "Darwin":
            return "Mac";
        case "windows":
            return "Windows";
        default:
            return "Linux";
    }
}
exports.getOSType = getOSType;
