export const VOICE_WORKLET_CODE = `
class VoiceProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      const pcmData = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      this.port.postMessage(pcmData.buffer, [pcmData.buffer]);
    }
    return true;
  }
}
registerProcessor('voice-processor', VoiceProcessor);
`;

export const convertPCMToFloat32 = (data) => {
  const pcmData = new Int16Array(data);
  const floatData = new Float32Array(pcmData.length);
  for (let i = 0; i < pcmData.length; i++) {
    floatData[i] = pcmData[i] / 32768.0;
  }
  return floatData;
};
