(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.audioPlayer) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-audio]';
  const ready = new WeakSet();
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function time(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const s = Math.floor(seconds % 60);
    const m = Math.floor(seconds / 60) % 60;
    const h = Math.floor(seconds / 3600);
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  }

  function spoken(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return (m ? m + ' min ' : '') + s + ' s';
  }

  function parts(root) {
    return {
      audio: root.querySelector('audio'),
      seek: root.querySelector('[data-bootcn-audio-seek]'),
      current: root.querySelector('[data-bootcn-audio-current]'),
      duration: root.querySelector('[data-bootcn-audio-duration]'),
      play: root.querySelector('[data-bootcn-audio-play]'),
      mute: root.querySelector('[data-bootcn-audio-mute]'),
      volume: root.querySelector('[data-bootcn-audio-volume]'),
      tracks: Array.from(root.querySelectorAll('.bootcn-audio__track')),
    };
  }

  function fill(range) {
    const min = Number(range.min || 0);
    const max = Number(range.max || 100);
    range.style.setProperty(
      '--bootcn-audio-fill',
      ((Number(range.value) - min) / (max - min || 1)) * 100 + '%',
    );
  }

  function sync(root) {
    const p = parts(root);
    const a = p.audio;
    const duration = Number.isFinite(a.duration) ? a.duration : 0;
    p.seek.max = String(Math.max(1, Math.floor(duration)));
    if (!root.classList.contains('is-seeking')) p.seek.value = String(Math.floor(a.currentTime));
    p.seek.setAttribute(
      'aria-valuetext',
      spoken(a.currentTime) + ' ' + t('audio.of', 'of') + ' ' + spoken(duration),
    );
    p.current.textContent = time(a.currentTime);
    p.duration.textContent = time(duration);
    fill(p.seek);
    const playing = !a.paused && !a.ended;
    root.classList.toggle('is-playing', playing);
    p.play.setAttribute(
      'aria-label',
      playing ? t('audio.pause', 'Pause') : t('audio.play', 'Play'),
    );
  }

  function load(root, track, autoplay) {
    const p = parts(root);
    p.tracks.forEach(function (other) {
      if (other === track) other.setAttribute('aria-current', 'true');
      else other.removeAttribute('aria-current');
    });
    p.audio.src = track.getAttribute('data-src');
    const title = root.querySelector('[data-bootcn-audio-title]');
    const artist = root.querySelector('[data-bootcn-audio-artist]');
    const cover = root.querySelector('.bootcn-audio__cover');
    if (title) title.textContent = track.getAttribute('data-title') || '';
    if (artist) artist.textContent = track.getAttribute('data-artist') || '';
    if (cover && track.getAttribute('data-cover'))
      cover.style.setProperty('--bootcn-audio-cover', track.getAttribute('data-cover'));
    if (autoplay) p.audio.play().catch(function () {});
    root.dispatchEvent(
      new CustomEvent('bootcn:audio:track', {
        bubbles: true,
        detail: { src: p.audio.src, title: track.getAttribute('data-title') },
      }),
    );
  }

  function step(root, delta) {
    const p = parts(root);
    if (!p.tracks.length) return;
    const index = p.tracks.findIndex(function (track) {
      return track.getAttribute('aria-current') === 'true';
    });
    const next = p.tracks[(index + delta + p.tracks.length) % p.tracks.length];
    load(root, next, !p.audio.paused || delta !== 0);
  }

  function setup(root) {
    if (ready.has(root)) return;
    ready.add(root);
    const p = parts(root);
    const a = p.audio;
    ['loadedmetadata', 'timeupdate', 'play', 'pause', 'durationchange'].forEach(function (name) {
      a.addEventListener(name, function () {
        sync(root);
      });
    });
    a.addEventListener('ended', function () {
      const last =
        p.tracks.length && p.tracks[p.tracks.length - 1].getAttribute('aria-current') === 'true';
      if (p.tracks.length && !last) step(root, 1);
      else sync(root);
    });
    a.volume = Number(p.volume ? p.volume.value : 80) / 100;
    if (p.volume) fill(p.volume);
    sync(root);
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest(ROOT + ' button');
    if (!button) return;
    const root = button.closest(ROOT);
    const p = parts(root);
    if (button.hasAttribute('data-bootcn-audio-play')) {
      if (p.audio.paused) p.audio.play().catch(function () {});
      else p.audio.pause();
    } else if (button.hasAttribute('data-bootcn-audio-prev')) {
      // Like most players: back to the start, or the previous track near it.
      if (p.audio.currentTime > 3) p.audio.currentTime = 0;
      else step(root, -1);
    } else if (button.hasAttribute('data-bootcn-audio-next')) {
      step(root, 1);
    } else if (button.hasAttribute('data-bootcn-audio-mute')) {
      p.audio.muted = !p.audio.muted;
      button.setAttribute('aria-pressed', String(p.audio.muted));
    } else if (button.classList.contains('bootcn-audio__track')) {
      load(root, button, true);
    }
  }

  function onInput(event) {
    const range = event.target;
    const root = range.closest && range.closest(ROOT);
    if (!root) return;
    const p = parts(root);
    if (range.hasAttribute('data-bootcn-audio-seek')) {
      root.classList.add('is-seeking');
      p.audio.currentTime = Number(range.value);
      fill(range);
    } else if (range.hasAttribute('data-bootcn-audio-volume')) {
      p.audio.volume = Number(range.value) / 100;
      p.audio.muted = Number(range.value) === 0;
      if (p.mute) p.mute.setAttribute('aria-pressed', String(p.audio.muted));
      fill(range);
    }
  }

  function onChange(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root) root.classList.remove('is-seeking');
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('input', onInput);
      document.addEventListener('change', onChange);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('input', onInput);
    document.removeEventListener('change', onChange);
    listening = false;
  }

  ns.audioPlayer = { init: init, destroy: destroy, setup: setup };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
