# Laravel

Bootcn fits Laravel well: components are plain markup, styled with
[Bootstrap](https://getbootstrap.com/) and enhanced with small vanilla
JavaScript files, so they work in Blade views, with or without Livewire, and
need no build step.

## Set up

Run the CLI in the project root:

```bash
npx bootcn@latest init
```

It recognizes Laravel (an `artisan` file and `laravel/framework` in
`composer.json`) and writes a `bootcn.json` with `"framework": "laravel"`:

| What                  | Where                           |
| --------------------- | ------------------------------- |
| Components and blocks | `resources/views/components/ui` |
| Templates (pages)     | `resources/views/bootcn`        |
| CSS                   | `public/vendor/bootcn/css`      |
| JavaScript            | `public/vendor/bootcn/js`       |

Markup is written as Blade views (`dialog.blade.php`). Anything Blade would
run is escaped, so the views render exactly like the HTML.

## Load Bootstrap and the tokens

In your layout, load Bootstrap, then the tokens and the component styles;
scripts go before `</body>`:

```blade
{{-- resources/views/layouts/app.blade.php --}}
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.9/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="{{ asset('vendor/bootcn/css/tokens.css') }}">
  <link rel="stylesheet" href="{{ asset('vendor/bootcn/css/dialog.css') }}">
  @stack('styles')
</head>
<body>
  {{ $slot }}
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.9/dist/js/bootstrap.bundle.min.js"></script>
  <script src="{{ asset('vendor/bootcn/js/dialog.js') }}"></script>
  @stack('scripts')
</body>
```

`bootcn add` prints the exact tags for what it installed. If you already use
Bootstrap through npm and Vite, keep that and only add the Bootcn files.

## Use a component

Each installed view is an anonymous Blade component:

```blade
<x-ui.dialog />
```

The view holds the component's example markup. Edit it like any other view,
or turn it into a component with props. A button, for example:

```blade
{{-- resources/views/components/ui/button.blade.php --}}
@props(['variant' => 'default', 'size' => null])

<button {{ $attributes->merge([
    'type' => 'button',
    'class' => 'btn bootcn-button bootcn-button--' . $variant . ($size ? ' bootcn-button--' . $size : ''),
]) }}>
  {{ $slot }}
</button>
```

```blade
<x-ui.button variant="outline" size="sm" wire:click="cancel">Cancel</x-ui.button>
```

## Templates

`npx bootcn add admin-dashboard` writes
`resources/views/bootcn/admin-dashboard.blade.php`, already linking its CSS
and JavaScript with `asset()`. Give it a route:

```php
// routes/web.php
Route::view('/admin', 'bootcn.admin-dashboard');
```

## With Vite instead of public/

Prefer bundling? Point the paths at `resources/` in `bootcn.json` and import
the files from your entry points:

```json
{
  "framework": "laravel",
  "paths": {
    "components": "resources/views/components/ui",
    "css": "resources/css/bootcn",
    "js": "resources/js/bootcn",
    "lib": "resources/js/bootcn/lib",
    "pages": "resources/views/bootcn"
  }
}
```

```js
// resources/js/app.js
import './bootcn/dialog.js';
```

```css
/* resources/css/app.css */
@import './bootcn/tokens.css';
@import './bootcn/dialog.css';
```

Templates link their files with `asset()` and expect them under `public/`;
with Vite, replace those tags with `@vite`.

## Livewire

Most components listen on the document, so they keep working when Livewire
updates the page. A few set themselves up once (Calendar, Date input, Color
area, Conversation, Chart). After `wire:navigate` and after an update that
adds them, run every component's `init()` again; it only sets up what is new:

```js
// resources/js/app.js
function initBootcn() {
  Object.values(window.Bootcn || {}).forEach((component) => component.init?.());
}

document.addEventListener('livewire:navigated', initBootcn);
document.addEventListener('livewire:init', () => {
  Livewire.hook('commit', ({ succeed }) => succeed(() => queueMicrotask(initBootcn)));
});
```

For a widget whose state should survive Livewire's updates (an open
calendar, a half-typed date), put `wire:ignore` on its wrapper and send the
value to Livewire from its event:

```blade
<div wire:ignore x-data @bootcn:date-input:change="$wire.set('meeting', $event.detail.value)">
  <x-ui.date-input />
</div>
```

## Forms and validation

Components post normal form fields (`name`, `name[]`, hidden inputs with ISO
dates), so Laravel's validation works as usual. Show its errors with the
Form component's markup:

```blade
<input
  class="form-control bootcn-input"
  id="email"
  name="email"
  value="{{ old('email') }}"
  aria-describedby="email-error"
  @error('email') aria-invalid="true" @enderror
>
@error('email')
  <p class="bootcn-field__error" id="email-error">{{ $message }}</p>
@enderror
```
