(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.videoPlayer) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-video]';
  const IDLE_MS = 2500;
  const ready = new WeakSet();
  const timers = new WeakMap();
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

  function q(root, name) {
    return root.querySelector('[data-bootcn-video-' + name + ']');
  }

  function parts(root) {
    return {
      video: root.querySelector('video'),
      play: Array.from(root.querySelectorAll('[data-bootcn-video-play]')),
      seek: q(root, 'seek'),
      current: q(root, 'current'),
      duration: q(root, 'duration'),
      mute: q(root, 'mute'),
      volume: q(root, 'volume'),
      speed: q(root, 'speed'),
      captions: q(root, 'captions'),
      captionText: q(root, 'caption-text'),
      pip: q(root, 'pip'),
      fullscreen: q(root, 'fullscreen'),
      osd: q(root, 'osd'),
      live: q(root, 'live'),
    };
  }

  function captionTracks(video) {
    return Array.from(video.textTracks || []).filter(function (track) {
      return track.kind === 'captions' || track.kind === 'subtitles';
    });
  }

  // ------------------------------------------------------------------ render

  function fill(range) {
    const max = Number(range.max) || 1;
    range.style.setProperty('--bootcn-video-fill', (Number(range.value) / max) * 100 + '%');
  }

  function sync(root) {
    const p = parts(root);
    const v = p.video;
    const duration = Number.isFinite(v.duration) ? v.duration : 0;
    const playing = !v.paused && !v.ended;
    root.classList.toggle('is-playing', playing);
    root.classList.toggle('is-started', v.played.length > 0 || v.currentTime > 0);
    p.play.forEach(function (button) {
      button.setAttribute(
        'aria-label',
        playing ? t('video.pause', 'Pause') : t('video.play', 'Play'),
      );
    });
    if (p.seek) {
      p.seek.max = String(duration || 1);
      if (!root.classList.contains('is-seeking')) p.seek.value = String(v.currentTime);
      p.seek.setAttribute(
        'aria-valuetext',
        spoken(v.currentTime) + ' ' + t('video.of', 'of') + ' ' + spoken(duration),
      );
      fill(p.seek);
      let buffered = 0;
      for (let i = 0; i < v.buffered.length; i++) {
        if (v.buffered.start(i) <= v.currentTime + 0.5) buffered = v.buffered.end(i);
      }
      root.style.setProperty(
        '--bootcn-video-buffered',
        (duration ? Math.min(100, (buffered / duration) * 100) : 0) + '%',
      );
    }
    if (p.current) p.current.textContent = time(v.currentTime);
    if (p.duration) p.duration.textContent = time(duration);
    if (p.mute) p.mute.setAttribute('aria-pressed', String(v.muted || v.volume === 0));
    root.classList.toggle('is-muted', v.muted || v.volume === 0);
    if (p.volume && document.activeElement !== p.volume) {
      p.volume.value = String(v.muted ? 0 : Math.round(v.volume * 100));
      fill(p.volume);
    }
    if (p.speed && Number(p.speed.value) !== v.playbackRate) p.speed.value = String(v.playbackRate);
    const tracks = captionTracks(v);
    if (p.captions) {
      p.captions.hidden = !tracks.length;
      p.captions.setAttribute('aria-pressed', String(root.classList.contains('has-captions')));
    }
    const full = document.fullscreenElement === root;
    root.classList.toggle('is-fullscreen', full);
    if (p.fullscreen) {
      p.fullscreen.setAttribute('aria-pressed', String(full));
    }
    if (p.pip) {
      p.pip.hidden = !(document.pictureInPictureEnabled && !v.disablePictureInPicture);
      p.pip.setAttribute('aria-pressed', String(document.pictureInPictureElement === v));
    }
  }

  // A short message over the video ("+10 s", "Speed 1.5×"), also announced.
  function osd(root, message) {
    const p = parts(root);
    if (p.osd) {
      p.osd.textContent = message;
      p.osd.classList.remove('is-visible');
      void p.osd.offsetWidth;
      p.osd.classList.add('is-visible');
    }
    if (p.live) p.live.textContent = message;
  }

  // ---------------------------------------------------------------- captions

  function setCaptions(root, on) {
    const p = parts(root);
    const tracks = captionTracks(p.video);
    root.classList.toggle('has-captions', on && tracks.length > 0);
    // Our own caption box shows the cue: the browser's stays hidden so the
    // controls never cover it.
    tracks.forEach(function (track, i) {
      track.mode = on && i === 0 ? 'hidden' : 'disabled';
      if (on && i === 0) track.oncuechange = () => renderCue(root, track);
    });
    if (!on && p.captionText) p.captionText.textContent = '';
    if (on && tracks[0]) renderCue(root, tracks[0]);
    sync(root);
  }

  function renderCue(root, track) {
    const box = parts(root).captionText;
    if (!box) return;
    const cues = Array.from(track.activeCues || []);
    box.textContent = cues
      .map(function (cue) {
        return (cue.text || '').replace(/<[^>]+>/g, '');
      })
      .join('\n');
  }

  // -------------------------------------------------------------------- idle

  // While playing, the controls fade out after a moment without movement.
  function wake(root) {
    root.classList.remove('is-idle');
    clearTimeout(timers.get(root));
    timers.set(
      root,
      setTimeout(function () {
        const v = parts(root).video;
        const controls = root.querySelector('.bootcn-video__controls');
        const overControls = controls && controls.matches(':hover');
        const focusInControls = controls && controls.contains(document.activeElement);
        if (!v.paused && !overControls && !focusInControls) {
          root.classList.add('is-idle');
        }
      }, IDLE_MS),
    );
  }

  // ----------------------------------------------------------------- actions

  function toggle(root) {
    const v = parts(root).video;
    if (v.paused || v.ended) {
      const result = v.play();
      if (result && result.catch) result.catch(function () {});
    } else v.pause();
  }

  function skip(root, seconds) {
    const v = parts(root).video;
    const duration = Number.isFinite(v.duration) ? v.duration : 0;
    v.currentTime = Math.max(0, Math.min(duration || Infinity, v.currentTime + seconds));
    osd(root, (seconds > 0 ? '+' : '−') + Math.abs(seconds) + ' s');
  }

  function setVolume(root, value) {
    const v = parts(root).video;
    v.volume = Math.max(0, Math.min(1, value));
    v.muted = v.volume === 0;
    osd(root, t('video.volume', 'Volume') + ' ' + Math.round(v.volume * 100) + '%');
  }

  function toggleMute(root) {
    const v = parts(root).video;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 0.5;
    osd(root, v.muted ? t('video.muted', 'Muted') : t('video.unmuted', 'Sound on'));
  }

  function toggleFullscreen(root) {
    const v = parts(root).video;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
    } else if (root.requestFullscreen) {
      root.requestFullscreen().catch(function () {});
    } else if (v.webkitEnterFullscreen) {
      v.webkitEnterFullscreen(); // iPhone: the system player
    }
  }

  function togglePip(root) {
    const v = parts(root).video;
    if (document.pictureInPictureElement === v) {
      document.exitPictureInPicture().catch(function () {});
    } else if (v.requestPictureInPicture) {
      v.requestPictureInPicture().catch(function () {});
    }
  }

  function setSpeed(root, rate) {
    const v = parts(root).video;
    v.playbackRate = rate;
    osd(root, t('video.speed', 'Speed') + ' ' + rate + '×');
    sync(root);
  }

  // ------------------------------------------------------------------ events

  function rootOf(event) {
    const target = event.target;
    return target instanceof Element ? target.closest(ROOT) : null;
  }

  function onClick(event) {
    const root = rootOf(event);
    if (!root) return;
    const button = event.target.closest('button');
    if (!button) {
      // A click on the picture plays or pauses, as everywhere.
      if (event.target.closest('video, .bootcn-video__stage')) toggle(root);
      return;
    }
    if (button.hasAttribute('data-bootcn-video-play')) toggle(root);
    else if (button.hasAttribute('data-bootcn-video-mute')) toggleMute(root);
    else if (button.hasAttribute('data-bootcn-video-captions')) {
      setCaptions(root, !root.classList.contains('has-captions'));
    } else if (button.hasAttribute('data-bootcn-video-fullscreen')) toggleFullscreen(root);
    else if (button.hasAttribute('data-bootcn-video-pip')) togglePip(root);
    else if (button.hasAttribute('data-bootcn-video-back')) skip(root, -10);
    else if (button.hasAttribute('data-bootcn-video-forward')) skip(root, 10);
    wake(root);
  }

  function onDoubleClick(event) {
    const root = rootOf(event);
    if (root && event.target.closest('video, .bootcn-video__stage')) toggleFullscreen(root);
  }

  function onInput(event) {
    const root = rootOf(event);
    if (!root) return;
    const p = parts(root);
    if (event.target === p.seek) {
      root.classList.add('is-seeking');
      p.video.currentTime = Number(p.seek.value);
      fill(p.seek);
    } else if (event.target === p.volume) {
      p.video.volume = Number(p.volume.value) / 100;
      p.video.muted = Number(p.volume.value) === 0;
      fill(p.volume);
    }
  }

  function onChange(event) {
    const root = rootOf(event);
    if (!root) return;
    const p = parts(root);
    if (event.target === p.seek) root.classList.remove('is-seeking');
    if (event.target === p.speed) setSpeed(root, Number(p.speed.value));
  }

  // YouTube-style keys while the focus is in the player.
  function onKeydown(event) {
    const root = rootOf(event);
    if (!root || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    const p = parts(root);
    const onControl = target.matches('input, select');
    const onButton = target.matches('button');
    const key = event.key.toLowerCase();
    let handled = true;
    if (key === 'k' || (key === ' ' && !onControl && !onButton)) toggle(root);
    else if (key === 'j') skip(root, -10);
    else if (key === 'l') skip(root, 10);
    else if (key === 'arrowleft' && !onControl) skip(root, -5);
    else if (key === 'arrowright' && !onControl) skip(root, 5);
    else if (key === 'arrowup' && !onControl) setVolume(root, p.video.volume + 0.1);
    else if (key === 'arrowdown' && !onControl) setVolume(root, p.video.volume - 0.1);
    else if (key === 'm') toggleMute(root);
    else if (key === 'f') toggleFullscreen(root);
    else if (key === 'c' && captionTracks(p.video).length) {
      setCaptions(root, !root.classList.contains('has-captions'));
      osd(
        root,
        root.classList.contains('has-captions')
          ? t('video.captionsOn', 'Captions on')
          : t('video.captionsOff', 'Captions off'),
      );
    } else if (/^[0-9]$/.test(key) && !onControl && Number.isFinite(p.video.duration)) {
      p.video.currentTime = (p.video.duration * Number(key)) / 10;
    } else handled = false;
    if (handled) {
      event.preventDefault();
      wake(root);
    }
  }

  function onMove(event) {
    const root = rootOf(event);
    if (root) wake(root);
  }

  const MEDIA_EVENTS = [
    'play',
    'pause',
    'ended',
    'timeupdate',
    'durationchange',
    'loadedmetadata',
    'progress',
    'volumechange',
    'ratechange',
    'enterpictureinpicture',
    'leavepictureinpicture',
  ];

  function onMedia(event) {
    const root = rootOf(event);
    if (!root || event.target.tagName !== 'VIDEO') return;
    if (event.type === 'waiting') root.classList.add('is-waiting');
    if (event.type === 'playing' || event.type === 'pause' || event.type === 'canplay') {
      root.classList.remove('is-waiting');
    }
    if (event.type === 'pause' || event.type === 'ended') root.classList.remove('is-idle');
    if (event.type === 'play') wake(root);
    sync(root);
  }

  function onFullscreen() {
    document.querySelectorAll(ROOT).forEach(sync);
  }

  function setup(root) {
    const p = parts(root);
    if (!p.video) return;
    if (!ready.has(root)) {
      ready.add(root);
      // Native controls stay as the fallback without JavaScript.
      p.video.controls = false;
      root.classList.add('is-enhanced');
      if (p.video.textTracks && p.video.textTracks.addEventListener) {
        p.video.textTracks.addEventListener('addtrack', function () {
          setCaptions(
            root,
            root.classList.contains('has-captions') || root.hasAttribute('data-captions'),
          );
        });
      }
    }
    const tracks = captionTracks(p.video);
    const on =
      root.hasAttribute('data-captions') ||
      tracks.some(function (track) {
        return track.mode === 'showing';
      });
    setCaptions(root, on);
    sync(root);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('dblclick', onDoubleClick);
      document.addEventListener('input', onInput);
      document.addEventListener('change', onChange);
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('pointermove', onMove);
      document.addEventListener('focusin', onMove);
      MEDIA_EVENTS.concat(['waiting', 'playing', 'canplay']).forEach(function (type) {
        document.addEventListener(type, onMedia, true);
      });
      document.addEventListener('fullscreenchange', onFullscreen);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('dblclick', onDoubleClick);
    document.removeEventListener('input', onInput);
    document.removeEventListener('change', onChange);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('focusin', onMove);
    MEDIA_EVENTS.concat(['waiting', 'playing', 'canplay']).forEach(function (type) {
      document.removeEventListener(type, onMedia, true);
    });
    document.removeEventListener('fullscreenchange', onFullscreen);
    listening = false;
  }

  ns.videoPlayer = {
    init: init,
    destroy: destroy,
    setup: setup,
    toggle: toggle,
    captions: setCaptions,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
