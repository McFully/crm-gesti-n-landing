import { VOICE_WORKLET_CODE, convertPCMToFloat32 } from './fernandoAudioWorklet.js';
import { getFernandoVoiceConfig } from './fernandoVoiceConfig.js';
import { syncLeadToSupabase } from './fernandoSync.js';

export class FernandoVoiceAgent {
  constructor({ apiKey, onStateChange }) {
    this.apiKey = apiKey || 'd27e0015c253297455e9ffb654aaebfb87add5dd';
    this.onStateChange = onStateChange || (() => {});
    
    this.isListening = false;
    this.isSpeaking = false;
    this.isThinking = false;
    this.isTakingNotes = false;
    this.isConnecting = false;
    this.isActive = false;

    this.socket = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.nextStartTime = 0;
    this.handshakeComplete = false;
    this.keepAliveInterval = null;
    this.activeSources = new Set();
    this.workletLoaded = false;
    this.wakeLock = null;
    this.noteTimeout = null;
    this.lastSync = null;
  }

  notifyState() {
    this.onStateChange({
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      isThinking: this.isThinking,
      isTakingNotes: this.isTakingNotes,
      isConnecting: this.isConnecting,
      isActive: this.isActive
    });
  }

  stopAgentPlayback() {
    this.isSpeaking = false;
    this.activeSources.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    this.activeSources.clear();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.nextStartTime = this.audioContext.currentTime + 0.05;
    }
  }

  isAudioDead() {
    const ctxDead = !this.audioContext || this.audioContext.state !== 'running';
    const track = this.mediaStream?.getAudioTracks?.()[0];
    const micDead = !track || track.readyState === 'ended' || track.muted;
    return ctxDead || micDead;
  }

  scheduleGracefulEnd() {
    if (this.endTimer) clearTimeout(this.endTimer);
    const startedAt = Date.now();
    const check = () => {
      const ctx = this.audioContext;
      if (!ctx || ctx.state === 'closed') return this.cleanup();
      const pending = Math.max(0, this.nextStartTime - ctx.currentTime);
      const idle = Date.now() - (this.lastAudioAt || 0) > 2500;
      const drained = (this.agentAudioDone || idle) && this.activeSources.size === 0 && pending <= 0.05;
      if (drained || Date.now() - startedAt > 10000) {
        this.endTimer = setTimeout(() => this.cleanup(), 400);
        return;
      }
      this.endTimer = setTimeout(check, 250);
    };
    this.endTimer = setTimeout(check, 300);
  }

  handleVisibilityChange = () => {
    if (document.visibilityState !== 'visible' || !this.isActive) return;
    if (this.audioContext && this.audioContext.state !== 'running' && this.audioContext.state !== 'closed') {
      this.audioContext.resume().catch(() => {});
    }
    setTimeout(() => {
      if (this.isActive && this.isAudioDead()) {
        console.warn('[Fernando] Sesión sin audio tras volver de segundo plano. Cerrando.');
        this.cleanup();
      }
    }, 600);
  };

  async handleBinaryAudio(data) {
    if (!this.audioContext || !this.handshakeComplete) return;
    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.lastAudioAt = Date.now();
      this.isSpeaking = true;
      this.isThinking = false;
      this.notifyState();

      const floatData = convertPCMToFloat32(data);
      const audioBuffer = this.audioContext.createBuffer(1, floatData.length, 24000);
      audioBuffer.getChannelData(0).set(floatData);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1.0;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;
      if (this.nextStartTime < now) {
        this.nextStartTime = now + 0.04;
      }

      source.onended = () => {
        this.activeSources.delete(source);
      };
      this.activeSources.add(source);

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
    } catch (e) {
      console.error('[Fernando] Error en reproducción de audio:', e);
    }
  }

  async setupAudioProcessor(socket) {
    try {
      const ctx = this.audioContext;
      if (!ctx || !this.mediaStream) return;

      const source = ctx.createMediaStreamSource(this.mediaStream);
      this.micSource = source;

      if (!this.workletLoaded) {
        const blob = new Blob([VOICE_WORKLET_CODE], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
        await ctx.audioWorklet.addModule(workletUrl);
        URL.revokeObjectURL(workletUrl);
        this.workletLoaded = true;
      }

      const workletNode = new AudioWorkletNode(ctx, 'voice-processor');
      this.workletNode = workletNode;
      workletNode.port.onmessage = (event) => {
        if (this.socket === socket && socket.readyState === WebSocket.OPEN && this.handshakeComplete) {
          socket.send(event.data);
        }
      };
      source.connect(workletNode);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          analyser.getByteFrequencyData(dataArray);
          window.fernandoVoiceVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();
    } catch (e) {
      console.error('[Fernando] Fallo al inicializar AudioWorklet:', e);
    }
  }

  cleanup() {
    this.isActive = false;
    this.isListening = false;
    this.isConnecting = false;
    this.isSpeaking = false;
    this.isThinking = false;
    this.isTakingNotes = false;
    this.handshakeComplete = false;
    this.endingGracefully = false;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if (this.endTimer) {
      clearTimeout(this.endTimer);
      this.endTimer = null;
    }
    if (this.noteTimeout) {
      clearTimeout(this.noteTimeout);
      this.noteTimeout = null;
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.socket) {
      try { this.socket.close(1000); } catch(e) {}
      this.socket = null;
    }
    this.activeSources.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    this.activeSources.clear();
    if (this.micSource) {
      try { this.micSource.disconnect(); } catch (e) {}
      this.micSource = null;
    }
    if (this.workletNode) {
      try { this.workletNode.port.onmessage = null; this.workletNode.disconnect(); } catch (e) {}
      this.workletNode = null;
    }
    if (this.audioContext) {
      if (this.audioContext.state !== 'closed') {
        try { this.audioContext.close(); } catch (e) {}
      }
      this.audioContext = null;
      this.workletLoaded = false;
    }
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }

    this.notifyState();
  }

  async start() {
    if (this.isConnecting || this.isListening || this.isActive) return;

    this.endingGracefully = false;
    this.agentAudioDone = false;
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.isActive = true;
    this.isConnecting = true;
    this.notifyState();

    try {
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then(lock => { this.wakeLock = lock; }).catch(() => {});
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
      });

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000,
        latencyHint: 'interactive'
      });
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.nextStartTime = 0;

      const socket = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', ['token', this.apiKey.trim()]);
      socket.binaryType = 'arraybuffer';
      this.socket = socket;

      socket.onopen = () => {
        console.log('[Fernando] Conexión de voz establecida.');
        this.isConnecting = false;
        this.notifyState();
      };

      socket.onerror = (err) => {
        console.error('[Fernando] Error de conexión:', err);
        if (this.socket !== socket || this.endingGracefully) return;
        this.cleanup();
      };

      socket.onclose = () => {
        if (this.socket !== socket) return;
        if (this.endingGracefully) {
          this.agentAudioDone = true;
          return;
        }
        this.cleanup();
      };

      socket.onmessage = async (event) => {
        if (this.socket !== socket) return;
        try {
          if (typeof event.data === 'string') {
            const msg = JSON.parse(event.data);
            if (!msg) return;

            switch (msg.type) {
              case 'Welcome':
                if (socket.readyState !== WebSocket.OPEN) return;
                const now = new Date();
                const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                const dayStr = now.toLocaleDateString('es-ES', { weekday: 'long' });

                const handshake = getFernandoVoiceConfig(dayStr, timeStr);
                socket.send(JSON.stringify(handshake));

                if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
                this.keepAliveInterval = setInterval(() => {
                  if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'KeepAlive' }));
                  }
                }, 5000);
                break;

              case 'SettingsApplied':
                this.handshakeComplete = true;
                this.isListening = true;
                this.isConnecting = false;
                this.notifyState();
                await this.setupAudioProcessor(socket);
                break;

              case 'UserSpeaking':
                if (this.noteTimeout) {
                  clearTimeout(this.noteTimeout);
                  this.noteTimeout = null;
                }
                this.isTakingNotes = false;
                this.isSpeaking = false;
                this.isThinking = false;
                this.isListening = true;
                this.notifyState();
                break;

              case 'UserStoppedSpeaking':
                if (this.isTakingNotes) break;
                setTimeout(() => {
                  if (this.isTakingNotes) return;
                  this.isListening = false;
                  this.isThinking = true;
                  this.notifyState();
                }, 50);
                break;

              case 'AgentStartedSpeaking':
                this.agentAudioDone = false;
                this.isThinking = false;
                this.isSpeaking = true;
                this.notifyState();
                break;

              case 'AgentAudioDone':
                this.agentAudioDone = true;
                if (this.isTakingNotes || this.endingGracefully) break;
                this.isSpeaking = false;
                this.notifyState();
                setTimeout(() => {
                  if (this.isTakingNotes) return;
                  this.isThinking = false;
                  this.isListening = true;
                  this.notifyState();
                }, 200);
                break;

              case 'FunctionCall':
              case 'FunctionCallRequest':
                const firstFunc = (msg.functions && msg.functions.length > 0) ? msg.functions[0] : msg;
                const fCallId = msg.id || msg.function_call_id || firstFunc?.id || firstFunc?.function_call_id;
                const fName = msg.name || msg.function_name || firstFunc?.name || firstFunc?.function?.name;
                const rawArgs = msg.arguments || firstFunc?.arguments || firstFunc?.args || firstFunc?.function?.arguments || {};
                const fArgs = (typeof rawArgs === 'string') ? JSON.parse(rawArgs) : rawArgs;

                console.log(`[Fernando] Invocación de función: ${fName}`, fArgs);

                if (fName === 'end_conversation') {
                  if (fCallId) {
                    socket.send(JSON.stringify({
                      type: "FunctionCallResponse",
                      id: fCallId,
                      name: fName,
                      content: "SUCCESS"
                    }));
                  }
                  this.endingGracefully = true;
                  this.agentAudioDone = false;
                  this.scheduleGracefulEnd();
                } 
                else if (fName === 'scroll_to_section') {
                  const targetId = fArgs?.section_id?.replace('#', '');
                  const targetEl = document.getElementById(targetId);
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                  }
                  if (fCallId) {
                    socket.send(JSON.stringify({
                      type: "FunctionCallResponse",
                      id: fCallId,
                      name: fName,
                      content: `Scrolled to ${targetId}`
                    }));
                  }
                } 
                else if (fName === 'request_contact') {
                  const safeArgs = fArgs || {};
                  const contactData = {
                    name: safeArgs.client_name || 'Sin Nombre',
                    company: safeArgs.company_name || '',
                    email: safeArgs.client_email || '',
                    phone: safeArgs.client_phone || '',
                    message: safeArgs.message_reason || 'Consulta vía Fernando AI',
                    sentiment: safeArgs.internal_sentiment || 'Neutral',
                    summary: safeArgs.business_summary || 'N/A'
                  };

                  const hash = `${contactData.name}-${contactData.email}-${contactData.phone}`;
                  const nowTs = Date.now();
                  if (this.lastSync && this.lastSync.hash === hash && (nowTs - this.lastSync.timestamp < 5000)) {
                    if (fCallId) {
                      socket.send(JSON.stringify({
                        type: "FunctionCallResponse",
                        id: fCallId,
                        name: fName,
                        content: "SUCCESS"
                      }));
                    }
                    return;
                  }
                  this.lastSync = { hash, timestamp: nowTs };

                  this.isTakingNotes = true;
                  this.isListening = false;
                  this.isSpeaking = false;
                  this.isThinking = false;
                  this.stopAgentPlayback();
                  this.notifyState();

                  try {
                    await syncLeadToSupabase(contactData);
                    console.log('[Fernando] Lead registrado con éxito.');
                  } catch (err) {
                    console.error('[Fernando] Error al registrar lead:', err);
                    localStorage.setItem(`fernando_lead_${Date.now()}`, JSON.stringify(contactData));
                  } finally {
                    this.noteTimeout = setTimeout(() => {
                      this.isTakingNotes = false;
                      this.isListening = true;
                      this.notifyState();
                    }, 1200);

                    if (fCallId) {
                      socket.send(JSON.stringify({
                        type: "FunctionCallResponse",
                        id: fCallId,
                        name: fName,
                        content: "SUCCESS"
                      }));
                    }
                  }
                }
                break;
            }
          } else if (event.data instanceof ArrayBuffer) {
            await this.handleBinaryAudio(event.data);
          }
        } catch (e) {
          console.error('[Fernando] Error procesando mensaje WebSocket:', e);
        }
      };
    } catch (err) {
      console.error('[Fernando] Fallo al iniciar sesión:', err);
      this.cleanup();
    }
  }

  stop() {
    this.cleanup();
  }
}
