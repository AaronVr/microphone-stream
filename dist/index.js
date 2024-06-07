"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const stream_1 = require("stream");
const os_type_1 = require("./helpers/os-type");
function arecorderFormat(endianness, encoding, bitSize) {
    let formatEndian;
    switch (endianness) {
        case "big":
            formatEndian = "BE";
            break;
        case "little":
            formatEndian = "LE";
            break;
    }
    let formatEncoding;
    switch (encoding) {
        case "signed-integer":
            formatEncoding = "S";
            break;
        case "unsigned-integer":
            formatEncoding = "U";
    }
    return `${formatEncoding}${bitSize}_${formatEndian}`;
}
/**
 * A readable microphone stream that will output PCM data.
 */
class Microphone extends stream_1.Readable {
    constructor(options) {
        var _a, _b, _c, _d, _e, _f;
        super();
        //---------------//
        // Buffer fields //
        //---------------//
        this.unresolvedRead = false;
        this.audioBuffer = Buffer.from([]);
        this.endianness = (_a = options.endianness) !== null && _a !== void 0 ? _a : "little";
        this.bitSize = (_b = options.bitSize) !== null && _b !== void 0 ? _b : 16;
        this.encoding = (_c = options.encoding) !== null && _c !== void 0 ? _c : "signed-integer";
        this.sampleRate = (_d = options.sampleRate) !== null && _d !== void 0 ? _d : 44100;
        this.channels = (_e = options.channels) !== null && _e !== void 0 ? _e : 1;
        this.device = (_f = options.device) !== null && _f !== void 0 ? _f : "plughw:1,0";
        if (this.channels < 1)
            throw Error("Cannot record fewer than 1 channel.");
        if (this.sampleRate < 1)
            throw Error("Cannot have a sample rate lower than 1.");
    }
    _construct(callback) {
        const osType = (0, os_type_1.getOSType)();
        const audioProcessOptions = {
            stdio: ["ignore", "pipe", "ignore"],
        };
        switch (osType) {
            case "Mac":
                this.audioProcess = (0, child_process_1.spawn)("rec", [
                    "-b",
                    `${this.bitSize}`,
                    "--endian",
                    this.endianness,
                    "-c",
                    `${this.channels}`,
                    "-r",
                    `${this.sampleRate}`,
                    "-e",
                    `${this.encoding}`,
                    "-t",
                    "raw",
                    "-",
                ], audioProcessOptions);
                break;
            case "Linux":
                this.audioProcess = (0, child_process_1.spawn)("arecord", [
                    "-c",
                    `${this.channels}`,
                    "-r",
                    `${this.sampleRate}`,
                    "-f",
                    arecorderFormat(this.endianness, this.encoding, this.bitSize),
                    "-t",
                    "raw",
                    "-D",
                    `${this.device}`,
                ], audioProcessOptions);
                break;
            case "Windows":
                this.audioProcess = (0, child_process_1.spawn)("sox", [
                    "-b",
                    `${this.bitSize}`,
                    "--endian",
                    this.endianness,
                    "-c",
                    `${this.channels}`,
                    "-r",
                    `${this.sampleRate}`,
                    "-e",
                    this.encoding,
                    "-t",
                    "waveaudio",
                    "default",
                    "-p",
                ], audioProcessOptions);
                break;
        }
        const audioProcessStdout = this.audioProcess.stdout;
        if (audioProcessStdout === null) {
            throw Error("Audio process stdout is null");
        }
        audioProcessStdout.addListener("data", (chunk) => __awaiter(this, void 0, void 0, function* () {
            this.audioBuffer = Buffer.concat([this.audioBuffer, chunk]);
            this.resolveRead();
        }));
        callback();
    }
    _read(size) {
        this.unresolvedRead = size;
        this.resolveRead();
    }
    _destroy(error, callback) {
        this.audioProcess.kill();
        callback(error);
    }
    resolveRead() {
        const unresolvedRead = this.unresolvedRead;
        if (unresolvedRead === false)
            return;
        if (this.audioBuffer.length === 0)
            return;
        this.push(this.audioBuffer.subarray(0, unresolvedRead));
        this.audioBuffer = this.audioBuffer.subarray(unresolvedRead);
        this.unresolvedRead = false;
    }
}
exports.default = Microphone;
