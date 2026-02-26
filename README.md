# goey-toast

[![goey-toast](https://goey-toast.vercel.app/og-image.png)](https://goey-toast.vercel.app)

**[Live Demo & Docs](https://goey-toast.vercel.app)**

## Features

- Organic blob morph animation (pill &rarr; blob &rarr; pill)
- Five toast types: default, success, error, warning, info
- Promise toasts with loading &rarr; success/error transitions
- Action buttons with optional success label morph-back
- Description body supporting strings and React components
- Configurable display duration and bounce intensity
- Custom fill color, border color, and border width
- CSS class overrides via `classNames` prop
- 6 positions with automatic horizontal mirroring for right-side positions
- Center positions with symmetric morph animation
- Hover pause: hovering an expanded toast pauses the dismiss timer
- Hover re-expand: hovering a collapsed pill re-expands the toast
- Pre-dismiss collapse animation
- In-place toast updates via `goeyToast.update()`
- Dismiss by type filter: `goeyToast.dismiss({ type: 'error' })`
- Dark mode and RTL layout support
- Animation presets: smooth, bouncy, subtle, snappy
- Countdown progress bar
- Keyboard dismiss (Escape) and swipe-to-dismiss on mobile
- Toast queue with configurable overflow strategy
- Dismiss callbacks: `onDismiss` and `onAutoClose`

## Installation

```bash
npm install goey-toast
```

### shadcn/ui

```bash
npx shadcn@latest add https://goey-toast.vercel.app/r/goey-toaster.json
```

This installs a thin wrapper component at `components/ui/goey-toaster.tsx` and auto-installs the `goey-toast` and `framer-motion` packages.

### Peer Dependencies

goey-toast requires the following peer dependencies:

```bash
npm install react react-dom framer-motion
```

| Package        | Version    |
| -------------- | ---------- |
| react          | >= 18.0.0  |
| react-dom      | >= 18.0.0  |
| framer-motion  | >= 10.0.0  |

### CSS Import (Required)

You **must** import the goey-toast stylesheet for the component to render correctly:

```tsx
import 'goey-toast/styles.css'
```

Add this import once in your app's entry point (e.g., `main.tsx` or `App.tsx`). Without it, toasts will appear unstyled.

## Quick Start

```tsx
import { GoeyToaster, goeyToast } from 'goey-toast'
import 'goey-toast/styles.css'

function App() {
  return (
    <>
      <GoeyToaster position="bottom-right" />
      <button onClick={() => goeyToast.success('Saved!')}>
        Save
      </button>
    </>
  )
}
```

## API Reference

### `goeyToast` Methods

```ts
goeyToast(title, options?)              // default (neutral)
goeyToast.success(title, options?)      // green
goeyToast.error(title, options?)        // red
goeyToast.warning(title, options?)      // yellow
goeyToast.info(title, options?)         // blue
goeyToast.promise(promise, data)        // loading -> success/error
goeyToast.update(id, options)           // update an existing toast in-place
goeyToast.dismiss(idOrFilter?)          // dismiss one, by type, or all toasts
```

#### `goeyToast.update(id, options)`

Updates an existing toast in-place without removing and re-creating it.

```ts
const id = goeyToast.success('Uploading...')

// Later, update the toast
goeyToast.update(id, {
  title: 'Upload complete',
  type: 'success',
  description: '3 files uploaded.',
})
```

**`GoeyToastUpdateOptions`:**

| Option        | Type              | Description                   |
| ------------- | ----------------- | ----------------------------- |
| `title`       | `string`          | New title text                |
| `description` | `ReactNode`       | New body content              |
| `type`        | `GoeyToastType`   | Change the toast type/color   |
| `action`      | `GoeyToastAction` | New action button             |

#### `goeyToast.dismiss(idOrFilter?)`

Dismiss a single toast by ID, all toasts of a given type, or all toasts at once.

```ts
// Dismiss a specific toast
goeyToast.dismiss(toastId)

// Dismiss all error toasts
goeyToast.dismiss({ type: 'error' })

// Dismiss multiple types
goeyToast.dismiss({ type: ['error', 'warning'] })

// Dismiss all toasts
goeyToast.dismiss()
```

### `GoeyToastOptions`

Options passed as the second argument to `goeyToast()` and type-specific methods.

| Option        | Type                 | Description                        |
| ------------- | -------------------- | ---------------------------------- |
| `description` | `ReactNode`          | Body content (string or component) |
| `action`      | `GoeyToastAction`    | Action button configuration        |
| `icon`        | `ReactNode`          | Custom icon override               |
| `duration`    | `number`             | Display duration in ms             |
| `id`          | `string \| number`   | Unique toast identifier            |
| `classNames`  | `GoeyToastClassNames`| CSS class overrides                |
| `fillColor`   | `string`             | Background color of the blob       |
| `borderColor` | `string`             | Border color of the blob           |
| `borderWidth` | `number`             | Border width in px (default 1.5)   |
| `timing`      | `GoeyToastTimings`   | Animation timing overrides         |
| `spring`      | `boolean`            | Enable spring/bounce animations (default `true`) |
| `bounce`      | `number`             | Spring intensity from `0.05` (subtle) to `0.8` (dramatic), default `0.4` |
| `showProgress`| `boolean`            | Show countdown progress bar                      |
| `onDismiss`   | `(id) => void`       | Called when toast is dismissed (any reason)       |
| `onAutoClose` | `(id) => void`       | Called only on timer-based auto-dismiss           |
| `preset`      | `AnimationPresetName`| Animation preset (`'smooth'`, `'bouncy'`, `'subtle'`, `'snappy'`) |

### `GoeyToastAction`

| Property       | Type       | Required | Description                                  |
| -------------- | ---------- | -------- | -------------------------------------------- |
| `label`        | `string`   | Yes      | Button text                                  |
| `onClick`      | `() => void` | Yes   | Click handler                                |
| `successLabel` | `string`   | No       | Label shown after click (morphs back to pill)|

### `GoeyToastTimings`

Fine-tune animation speeds per toast.

| Property           | Type     | Default | Description                          |
| ------------------ | -------- | ------- | ------------------------------------ |
| `displayDuration`  | `number` | 4000    | Milliseconds toast stays expanded    |

### `GoeyToastClassNames`

Override styles for any part of the toast.

| Key             | Target           |
| --------------- | ---------------- |
| `wrapper`       | Outer container  |
| `content`       | Content area     |
| `header`        | Icon + title row |
| `title`         | Title text       |
| `icon`          | Icon wrapper     |
| `description`   | Body text        |
| `actionWrapper` | Button container |
| `actionButton`  | Action button    |

### `GoeyToasterProps`

Props for the `<GoeyToaster />` component.

| Prop         | Type                                  | Default          | Description                                   |
| ------------ | ------------------------------------- | ---------------- | --------------------------------------------- |
| `position`   | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'bottom-right'` | Toast position |
| `duration`   | `number`                              | --               | Default display duration in ms                |
| `gap`        | `number`                              | `14`             | Gap between stacked toasts (px)               |
| `offset`     | `number \| string`                    | `'24px'`         | Distance from screen edge                     |
| `theme`      | `'light' \| 'dark'`                   | `'light'`        | Color theme                                   |
| `toastOptions` | `Partial<ExternalToast>`            | --               | Default options passed to Sonner              |
| `spring`     | `boolean`                             | `true`           | Enable spring/bounce animations globally      |
| `bounce`     | `number`                              | `0.4`            | Spring intensity: `0.05` (subtle) to `0.8` (dramatic) |
| `preset`     | `AnimationPresetName`                 | --               | Animation preset for all toasts               |
| `closeOnEscape` | `boolean`                          | `true`           | Dismiss most recent toast on Escape key       |
| `showProgress` | `boolean`                           | `false`          | Show countdown progress bar on all toasts     |
| `maxQueue`   | `number`                              | `Infinity`       | Maximum queued toasts                         |
| `queueOverflow` | `'drop-oldest' \| 'drop-newest'`   | `'drop-oldest'`  | Queue overflow strategy                       |
| `dir`        | `'ltr' \| 'rtl'`                     | `'ltr'`          | Layout direction                              |
| `swipeToDismiss` | `boolean`                         | `true`           | Enable swipe-to-dismiss on mobile             |

### `GoeyPromiseData<T>`

Configuration for `goeyToast.promise()`.

| Property      | Type                                          | Required | Description                                    |
| ------------- | --------------------------------------------- | -------- | ---------------------------------------------- |
| `loading`     | `string`                                      | Yes      | Title shown during loading                     |
| `success`     | `string \| ((data: T) => string)`             | Yes      | Title on success (static or derived from result)|
| `error`       | `string \| ((error: unknown) => string)`      | Yes      | Title on error (static or derived from error)  |
| `description` | `object`                                      | No       | Per-phase descriptions (see below)             |
| `action`      | `object`                                      | No       | Per-phase action buttons (see below)           |
| `classNames`  | `GoeyToastClassNames`                         | No       | CSS class overrides                            |
| `fillColor`   | `string`                                      | No       | Background color of the blob                   |
| `borderColor` | `string`                                      | No       | Border color of the blob                       |
| `borderWidth` | `number`                                      | No       | Border width in px                             |
| `timing`      | `GoeyToastTimings`                            | No       | Animation timing overrides                     |
| `spring`      | `boolean`                                     | No       | Enable spring/bounce animations (default `true`) |
| `bounce`      | `number`                                      | No       | Spring intensity: `0.05` (subtle) to `0.8` (dramatic), default `0.4` |

**`description` sub-fields:**

| Key       | Type                                             |
| --------- | ------------------------------------------------ |
| `loading` | `ReactNode`                                      |
| `success` | `ReactNode \| ((data: T) => ReactNode)`          |
| `error`   | `ReactNode \| ((error: unknown) => ReactNode)`   |

**`action` sub-fields:**

| Key       | Type              |
| --------- | ----------------- |
| `success` | `GoeyToastAction` |
| `error`   | `GoeyToastAction` |

## Usage Examples

### Description

```tsx
goeyToast.error('Payment failed', {
  description: 'Your card was declined. Please try again.',
})
```

### Custom React Component as Description

```tsx
goeyToast.success('Deployment complete', {
  description: (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <span>Environment:</span> <strong>Production</strong>
      </div>
      <div>
        <span>Branch:</span> <strong>main @ 3f8a2c1</strong>
      </div>
    </div>
  ),
})
```

### Action Button with Success Label

```tsx
goeyToast.info('Share link ready', {
  description: 'Your link has been generated.',
  action: {
    label: 'Copy to Clipboard',
    onClick: () => navigator.clipboard.writeText(url),
    successLabel: 'Copied!',
  },
})
```

### Promise Toast

```tsx
goeyToast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Changes saved',
  error: 'Something went wrong',
  description: {
    success: 'All changes have been synced.',
    error: 'Please try again later.',
  },
  action: {
    error: {
      label: 'Retry',
      onClick: () => retry(),
    },
  },
})
```

### Custom Styling

```tsx
goeyToast.success('Styled!', {
  fillColor: '#1a1a2e',
  borderColor: '#333',
  borderWidth: 2,
  classNames: {
    wrapper: 'my-wrapper',
    title: 'my-title',
    description: 'my-desc',
    actionButton: 'my-btn',
  },
})
```

### Display Duration

```tsx
goeyToast.success('Saved', {
  description: 'Your changes have been synced.',
  timing: { displayDuration: 5000 },
})
```

### Disabling Spring Animations

Disable bounce/spring animations for a cleaner, more subtle look:

```tsx
// Per-toast: disable spring for this toast only
goeyToast.success('Saved', {
  description: 'Your changes have been synced.',
  spring: false,
})

// Globally: disable spring for all toasts
<GoeyToaster spring={false} />
```

When `spring` is `false`, all spring-based animations (landing squish, blob squish, morph transitions, pill resize, header squish) use smooth ease-in-out curves instead. Error shake animations still work regardless of this setting.

### Bounce Intensity

Control how dramatic the spring effect feels with a single `bounce` value:

```tsx
// Subtle, barely-there spring
goeyToast.success('Saved', { bounce: 0.1 })

// Default feel
goeyToast.success('Saved', { bounce: 0.4 })

// Jelly mode
goeyToast.success('Saved', { bounce: 0.8 })

// Set globally via GoeyToaster
<GoeyToaster bounce={0.6} />
```

The `bounce` value (0.05 to 0.8) controls spring stiffness, damping, and squish magnitude together so you get a consistent feel from one number.

### Dark Mode

```tsx
<GoeyToaster theme="dark" />
```

### RTL Support

```tsx
<GoeyToaster dir="rtl" />
```

### Animation Presets

Four built-in presets: `smooth`, `bouncy`, `subtle`, `snappy`. Apply per-toast or globally:

```tsx
goeyToast.success('Saved', { preset: 'bouncy' })

// Or globally
<GoeyToaster preset="smooth" />
```

### Progress Bar

Show a countdown progress bar on toasts:

```tsx
goeyToast.success('Saved', { showProgress: true })

// Or enable globally
<GoeyToaster showProgress />
```

### Keyboard Shortcuts

Press **Escape** to dismiss the most recent toast. Enabled by default; disable with `closeOnEscape={false}`.

### Swipe to Dismiss

On mobile, swipe toasts to dismiss them. Enabled by default; disable with `swipeToDismiss={false}`.

## Exports

```ts
// Components
export { GoeyToaster } from 'goey-toast'

// Toast function
export { goeyToast } from 'goey-toast'

// Animation presets
export { animationPresets } from 'goey-toast'

// Types
export type {
  GoeyToastOptions,
  GoeyPromiseData,
  GoeyToasterProps,
  GoeyToastAction,
  GoeyToastClassNames,
  GoeyToastTimings,
  GoeyToastUpdateOptions,
  DismissFilter,
  AnimationPreset,
  AnimationPresetName,
} from 'goey-toast'
```

## Browser Support

goey-toast works in all modern browsers that support:

- CSS Modules
- SVG path animations
- ResizeObserver
- `framer-motion` (Chrome, Firefox, Safari, Edge)

## License

[MIT](./LICENSE)
