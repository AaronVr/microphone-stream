import { ChildProcess, SpawnOptions, spawn } from "child_process";
import { Readable } from "stream";
import { getOSType } from "./helpers/os-type";

type Endianness = "little" | "big";
type BitSize = 8 | 16 | 24 | 32;
type Encoding = "signed-integer" | "unsigned-integer";
type SampleRate = number;
type Channels = number;
type Device = string;

type MicrophoneConstructorOptions = Partial<{
  /** The endianness of the PCM stream. Either little or big endian. */
  endianness: Endianness;
  /** The bit size of the PCM data. */
  bitSize: BitSize;
  /** The encoding of the PCM data.*/
  encoding: Encoding;
  /** The sample rate of the PCM data. Common values are 8Khz (human speech),
   * 16Khz (VoIP) 44.1Khz (audio CD), 96Khz (Blu-ray audio) */
  sampleRate: SampleRate;
  /** The amount of channels. Common values are 1 (mono) and 2 (stereo) */
  channels: Channels;
  /** The device to get the data from. */
  device: Device;
}>;

function arecorderFormat(
  endianness: Endianness,
  encoding: Encoding,
  bitSize: BitSize
) {
  let formatEndian: string;
  switch (endianness) {
    case "big":
      formatEndian = "BE";
      break;
    case "little":
      formatEndian = "LE";
      break;
  }

  let formatEncoding: string;
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
export default class Microphone extends Readable {
  //-----------------------//
  // Configuration Options //
  //-----------------------//
  private readonly endianness: Endianness;
  private readonly bitSize: BitSize;
  private readonly encoding: Encoding;
  private readonly sampleRate: SampleRate;
  private readonly channels: Channels;
  private readonly device: Device;

  //---------------//
  // Audio Process //
  //---------------//
  private audioProcess!: ChildProcess;

  //---------------//
  // Buffer fields //
  //---------------//
  private unresolvedRead: false | number = false;
  private audioBuffer: Buffer = Buffer.from([]);

  constructor(options: MicrophoneConstructorOptions) {
    super();

    this.endianness = options.endianness ?? "little";
    this.bitSize = options.bitSize ?? 16;
    this.encoding = options.encoding ?? "signed-integer";
    this.sampleRate = options.sampleRate ?? 44100;
    this.channels = options.channels ?? 1;
    this.device = options.device ?? "plughw:1,0";

    if (this.channels < 1) throw Error("Cannot record fewer than 1 channel.");
    if (this.sampleRate < 1)
      throw Error("Cannot have a sample rate lower than 1.");
  }

  _construct(callback: (error?: Error | null | undefined) => void): void {
    const osType = getOSType();

    const audioProcessOptions: SpawnOptions = {
      stdio: ["ignore", "pipe", "ignore"],
    };

    switch (osType) {
      case "Mac":
        this.audioProcess = spawn(
          "rec",
          [
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
          ],
          audioProcessOptions
        );
        break;
      case "Linux":
        this.audioProcess = spawn(
          "arecord",
          [
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
          ],
          audioProcessOptions
        );
        break;
      case "Windows":
        this.audioProcess = spawn(
          "sox",
          [
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
          ],
          audioProcessOptions
        );
        break;
    }

    const audioProcessStdout = this.audioProcess.stdout;

    if (audioProcessStdout === null) {
      throw Error("Audio process stdout is null");
    }

    audioProcessStdout.addListener("data", async (chunk) => {
      this.audioBuffer = Buffer.concat([this.audioBuffer, chunk]);

      this.resolveRead();
    });

    callback();
  }

  _read(size: number): void {
    this.unresolvedRead = size;

    this.resolveRead();
  }

  _destroy(
    error: Error | null,
    callback: (error?: Error | null | undefined) => void
  ): void {
    this.audioProcess.kill();
    callback(error);
  }

  private resolveRead() {
    const unresolvedRead = this.unresolvedRead;

    if (unresolvedRead === false) return;
    if (this.audioBuffer.length === 0) return;

    this.push(this.audioBuffer.subarray(0, unresolvedRead));
    this.audioBuffer = this.audioBuffer.subarray(unresolvedRead);

    this.unresolvedRead = false;
  }
}
