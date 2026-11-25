# Video player

Custom controls over the native video element: play, seek with buffering, skip, volume, speed, captions, picture in picture, full screen and keyboard shortcuts; controls fade out while playing.

## Usage

Put your sources and caption tracks in the `<video>` as usual:

```html
<video
  class="bootcn-video__media"
  preload="metadata"
  playsinline
  controls
  poster="media/poster.jpg"
>
  <source src="media/sunrise.webm" type="video/webm" />
  <source src="media/sunrise.mp4" type="video/mp4" />
  <track kind="captions" src="media/sunrise.en.vtt" srclang="en" label="English" />
</video>
```

- Keep `controls` on the element: without JavaScript the browser's own
  player shows; with it, the custom controls replace them.
- MP4 (H.264) plays everywhere; add WebM for smaller files. Serve caption
  files (WebVTT) from the same site, as `text/vtt`.
- The player is 16:9; change `aspect-ratio` on `.bootcn-video` for other
  shapes. `data-captions` turns captions on from the start.
- Name the player after the video (`aria-label="Video: …"`).

## Keyboard

While the focus is in the player: **K** or **Space** play and pause,
**J** / **L** back and forward 10 seconds, **←** / **→** 5 seconds,
**↑** / **↓** volume, **M** mute, **C** captions, **F** full screen,
**0**–**9** jump to 0–90%. Double-click the picture for full screen.

## JavaScript API

`Bootcn.videoPlayer.setup(root)` for players added later,
`toggle(root)`, `captions(root, on)`, `init()` / `destroy()`. The
`<video>` element's own events (`play`, `timeupdate`, …) are there for
everything else. Messages `video.play`, `video.pause`, `video.of`,
`video.volume`, `video.muted`, `video.unmuted`, `video.speed`,
`video.captionsOn` and `video.captionsOff` are translatable.

## Accessibility

- Every control is a named native button, range or select; toggles
  (mute, captions, picture in picture, full screen) use `aria-pressed`;
  the play button reads "Play" or "Pause".
- The seek bar reads its position in words ("1 min 5 s of 3 min 12 s").
- Captions are drawn above the controls so they are never covered.
- Shortcut results ("+10 s", "Muted") are shown and announced.
- Controls hide only while playing and while neither the pointer nor the
  focus is on them; nothing plays until someone presses Play.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
