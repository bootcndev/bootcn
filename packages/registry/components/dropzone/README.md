# Dropzone

Drag-and-drop file upload: a large target that also opens the file picker, a list of files with thumbnails, progress and errors (type and size checked), and remove buttons; uploads to a URL or through your own code.

## Usage

A real `<input type="file">` sits inside the label, so clicking, the
keyboard and screen readers work as with any file input, and a form can
submit it. Drag files onto the area to add them. `accept` and `multiple` on
the input, and `data-max-size` (bytes) on the dropzone, are checked for
every file; refused files stay in the list with the reason.

## Uploading

- `data-upload-url="/upload"`: each file is POSTed as multipart form data
  (field `data-field`, default `file`) with real progress.
- Your own code (S3 presigned URLs, chunks, …): listen for
  `bootcn:dropzone:file`, call `event.preventDefault()`, and use
  `event.detail.progress(percent)`, `done()` and `fail(message)`.
- Without either, files are just chosen and shown as ready.

Events `bootcn:dropzone:done` (`detail: { file, id }`) and
`bootcn:dropzone:remove`. `Bootcn.dropzone.add(root, files)`,
`progress(root, id, percent)`, `done(root, id)`, `fail(root, id, message)`,
`clear(root)` and `size(bytes)`. Messages `dropzone.*` are translatable.

## Accessibility

- The area is the input's label; the hint is tied to it with
  `aria-describedby`; the focus ring shows on the whole area.
- Each upload has a named progress bar and a Remove button named after the
  file; added, finished, failed and removed files are announced. Errors are
  written in words, not only in red.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
