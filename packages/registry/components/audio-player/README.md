# Audio player

A music player over the native audio element: play, pause, previous and next, a seek bar with times, volume and mute, and a playlist.

## Usage

Serve your audio files (MP3 or AAC for every browser) and list them in the
playlist; remove the playlist for a single track. Without JavaScript, add
the `controls` attribute to the `<audio>` element so the browser's own
player shows.

## JavaScript API

- `data-bootcn-audio` on the player, with one `<audio>` and the controls:
  `data-bootcn-audio-play`, `-prev`, `-next`, `-mute`, the ranges
  `data-bootcn-audio-seek` and `data-bootcn-audio-volume`, and the texts
  `data-bootcn-audio-title`, `-artist`, `-current`, `-duration`.
- Playlist: buttons `.bootcn-audio__track` with `data-src`, `data-title`,
  `data-artist` and optionally `data-cover` (a CSS background); the current
  one has `aria-current="true"`. Tracks continue to the next one at the end.
- Previous goes back to the start of the track after 3 seconds, as most
  players do.
- Event `bootcn:audio:track` (`detail: { src, title }`).
  `Bootcn.audioPlayer.setup(root)` for players added later; `init()` /
  `destroy()`. Messages `audio.play`, `audio.pause`, `audio.of` are
  translatable.

## Accessibility

- Every control is a named native button or range: "Play"/"Pause",
  "Previous track", "Next track", "Mute" (a toggle), "Seek" and "Volume".
- The seek bar reads its position in words ("1 min 5 s of 3 min 12 s").
- The playlist is an ordered list; the current track is marked with
  `aria-current`. Nothing plays until someone presses Play.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
