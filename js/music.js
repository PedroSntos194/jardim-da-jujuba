/* player discreto: nossa música */

const Music = (() => {
  const player = document.getElementById('player');
  const audio = document.getElementById('audio');
  const toggleBtn = document.getElementById('player-toggle');
  const playBtn = document.getElementById('player-play');
  const muteBtn = document.getElementById('player-mute');
  const volume = document.getElementById('player-volume');
  const label = player.querySelector('.player__label');

  const INITIAL_VOLUME = 0.15;
  const FADE_MS = 3200;

  let targetVolume = INITIAL_VOLUME;
  let fadeFrame = null;
  let available = true;

  function setLevelIcon() {
    const level = audio.muted || audio.volume === 0 ? 'off' : audio.volume < 0.4 ? 'low' : 'high';
    player.dataset.level = level;
  }

  function fadeTo(value, duration = FADE_MS) {
    cancelAnimationFrame(fadeFrame);
    const from = audio.volume;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      audio.volume = from + (value - from) * eased;
      setLevelIcon();
      if (t < 1) fadeFrame = requestAnimationFrame(step);
    };
    fadeFrame = requestAnimationFrame(step);
  }

  async function play(withFade = true) {
    if (!available) return;
    try {
      if (withFade) audio.volume = 0;
      await audio.play();
      player.classList.add('is-playing');
      if (withFade) fadeTo(targetVolume);
      else audio.volume = targetVolume;
    } catch (err) {
      player.classList.remove('is-playing');
    }
  }

  function pause() {
    cancelAnimationFrame(fadeFrame);
    audio.pause();
    player.classList.remove('is-playing');
  }

  function toggle() {
    if (audio.paused) play(false);
    else pause();
  }

  function setVolume(value) {
    targetVolume = value;
    if (!audio.paused) {
      cancelAnimationFrame(fadeFrame);
      audio.volume = value;
    }
    if (value > 0 && audio.muted) audio.muted = false;
    setLevelIcon();
  }

  function toggleMute() {
    audio.muted = !audio.muted;
    setLevelIcon();
  }

  function markUnavailable() {
    available = false;
    player.classList.add('is-unavailable');
    player.classList.remove('is-playing');
    label.textContent = 'música não encontrada';
  }

  function show() {
    player.classList.add('is-visible');
  }

  function init() {
    audio.volume = INITIAL_VOLUME;
    volume.value = INITIAL_VOLUME;
    setLevelIcon();

    toggleBtn.addEventListener('click', () => {
      player.classList.toggle('is-open');
      if (!player.classList.contains('is-playing') && audio.paused) play(false);
    });
    playBtn.addEventListener('click', toggle);
    muteBtn.addEventListener('click', toggleMute);
    volume.addEventListener('input', () => setVolume(parseFloat(volume.value)));
    audio.addEventListener('error', markUnavailable);
    audio.addEventListener('ended', () => player.classList.remove('is-playing'));
  }

  return { init, play, pause, toggle, show };
})();
