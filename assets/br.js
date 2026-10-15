// Baton Rouge page: styled player for the test-call recording. Native <audio> stays as the no-JS fallback.
(() => {
  const audio = document.querySelector('.recording audio');
  const player = document.querySelector('.player');
  if (!audio || !player) return;
  const btn = player.querySelector('.player-btn');
  const seek = player.querySelector('.player-seek');
  const now = player.querySelector('.player-now');
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const paint = () => {
    const max = Number(seek.max) || 1;
    player.querySelector('.player-bar').style.setProperty('--p', `${(Number(seek.value) / max) * 100}%`);
  };
  audio.controls = false;
  audio.hidden = true;
  player.hidden = false;
  btn.addEventListener('click', () => { if (audio.paused) audio.play(); else audio.pause(); });
  audio.addEventListener('play', () => { btn.classList.add('playing'); btn.setAttribute('aria-label', 'Pause the test call'); });
  audio.addEventListener('pause', () => { btn.classList.remove('playing'); btn.setAttribute('aria-label', 'Play the test call'); });
  audio.addEventListener('loadedmetadata', () => { if (isFinite(audio.duration)) seek.max = Math.round(audio.duration); });
  audio.addEventListener('timeupdate', () => { seek.value = audio.currentTime; now.textContent = fmt(audio.currentTime); paint(); });
  seek.addEventListener('input', () => { audio.currentTime = Number(seek.value); now.textContent = fmt(Number(seek.value)); paint(); });
  paint();
})();
