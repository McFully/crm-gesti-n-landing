import { FernandoVoiceAgent } from './fernandoAgent.js';

export function initFernandoAvatar() {
  const avatarEl = document.getElementById('fernando-voice-avatar');
  if (!avatarEl) return;

  const statusLabel = avatarEl.querySelector('#fernando-status-label');
  const pulseEl = avatarEl.querySelector('#fernando-pulse');

  const agent = new FernandoVoiceAgent({
    onStateChange: (state) => {
      window.fernandoVoiceActive = state.isActive;
      avatarEl.classList.toggle('active', state.isActive);
      avatarEl.classList.toggle('heartbeat-float', !state.isActive);
      avatarEl.classList.toggle('speaking', state.isSpeaking && !state.isTakingNotes);
      avatarEl.classList.toggle('thinking', state.isThinking && !state.isTakingNotes);
      avatarEl.classList.toggle('taking-notes', state.isTakingNotes);

      if (!state.isActive) {
        if (statusLabel) statusLabel.style.display = 'none';
        if (pulseEl) pulseEl.style.display = 'none';
        avatarEl.setAttribute('aria-label', 'Hablar con Fernando, asesor de IA');
        avatarEl.setAttribute('title', 'Hablar con Fernando');
        return;
      }

      avatarEl.setAttribute('aria-label', 'Detener conversación con Fernando');
      avatarEl.setAttribute('title', 'Detener conversación');

      if (state.isConnecting) {
        if (statusLabel) {
          statusLabel.textContent = 'Conectando...';
          statusLabel.className = 'avatar-status-label';
          statusLabel.style.display = 'block';
        }
        if (pulseEl) pulseEl.style.display = 'none';
      } else if (state.isTakingNotes) {
        if (statusLabel) {
          statusLabel.textContent = 'Fernando tomando nota...';
          statusLabel.className = 'avatar-status-label taking-notes';
          statusLabel.style.display = 'block';
        }
        if (pulseEl) {
          pulseEl.className = 'avatar-pulse taking-notes';
          pulseEl.style.display = 'block';
        }
      } else if (state.isThinking) {
        if (statusLabel) {
          statusLabel.textContent = 'Procesando...';
          statusLabel.className = 'avatar-status-label thinking';
          statusLabel.style.display = 'block';
        }
        if (pulseEl) {
          pulseEl.className = 'avatar-pulse thinking';
          pulseEl.style.display = 'block';
        }
      } else if (state.isSpeaking) {
        if (statusLabel) {
          statusLabel.textContent = 'Fernando hablando...';
          statusLabel.className = 'avatar-status-label';
          statusLabel.style.display = 'block';
        }
        if (pulseEl) pulseEl.style.display = 'none';
        stopVolumeAnim();
      } else if (state.isListening) {
        if (statusLabel) {
          statusLabel.textContent = 'Escuchando...';
          statusLabel.className = 'avatar-status-label';
          statusLabel.style.display = 'block';
        }
        if (pulseEl) {
          pulseEl.className = 'avatar-pulse';
          pulseEl.style.display = 'block';
        }
        startVolumeAnim();
      } else {
        stopVolumeAnim();
      }
    }
  });

  let animVolumeId = null;
  const updateVis = () => {
    if (agent.isListening) {
      const vol = window.fernandoVoiceVolume || 0;
      const scale = 1 + (vol / 200);
      avatarEl.style.setProperty('--voice-scale', scale);
      animVolumeId = requestAnimationFrame(updateVis);
    } else {
      avatarEl.style.setProperty('--voice-scale', 1);
      animVolumeId = null;
    }
  };

  const startVolumeAnim = () => {
    if (!animVolumeId) {
      animVolumeId = requestAnimationFrame(updateVis);
    }
  };

  const stopVolumeAnim = () => {
    if (animVolumeId) {
      cancelAnimationFrame(animVolumeId);
      animVolumeId = null;
    }
    avatarEl.style.setProperty('--voice-scale', 1);
  };

  avatarEl.addEventListener('click', () => {
    if (agent.isActive) {
      agent.stop();
    } else {
      agent.start();
    }
  });
}
