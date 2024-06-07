/// <reference types="node" />
import { Readable } from "stream";
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
/**
 * A readable microphone stream that will output PCM data.
 */
export default class Microphone extends Readable {
    private readonly endianness;
    private readonly bitSize;
    private readonly encoding;
    private readonly sampleRate;
    private readonly channels;
    private readonly device;
    private audioProcess;
    private unresolvedRead;
    private audioBuffer;
    constructor(options: MicrophoneConstructorOptions);
    _construct(callback: (error?: Error | null | undefined) => void): void;
    _read(size: number): void;
    _destroy(error: Error | null, callback: (error?: Error | null | undefined) => void): void;
    private resolveRead;
}
export {};
//# sourceMappingURL=index.d.ts.map