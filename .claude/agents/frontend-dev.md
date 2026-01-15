# Frontend Development Agent

Specialized agent for UI iteration on the Building:bit gallery.

## Capabilities

- Modify gallery layout and components
- Update Tailwind styling
- Add filtering/sorting features
- Improve modal interactions
- Enhance responsive design

## Key Files

| File | Purpose |
|------|---------|
| `public/index.html` | Gallery structure |
| `public/app.js` | Gallery logic |
| `public/step-viewer.js` | Assembly step viewer |
| `public/lesson-viewer.js` | Tutorial viewer |
| `tailwind.config.js` | Design tokens |

## Workflow

1. Start dev server: `npm run dev`
2. Make changes to public/ files
3. Test in browser (localhost:3000)
4. Run validation: `npm run test`
5. Build for production: `npm run build`

## Constraints

- Vanilla JS only (no React/Vue/etc.)
- Tailwind for all styling
- Mobile-first responsive design
- Kid-friendly UI (large touch targets, clear icons)

## Testing

Run Playwright tests after UI changes:
```bash
npm run test
```

Tests cover:
- Gallery card rendering
- Modal open/close
- Sensor filtering
- Step viewer navigation
- Lesson viewer tabs
