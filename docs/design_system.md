# AI Calorie Tracker - Design System 🎨✨

An App Store-quality, premium, modern, and minimal design system tailored for a health-focused calorie tracker. Inspired by Apple Health, Cal AI, and modern iOS fitness apps.

---

## 🎨 1. Color Palette

Our color scheme uses organic, vital colors for light and dark modes:

| Token Name | Light HSL | Dark HSL | hex Equivalent | Purpose |
|---|---|---|---|---|
| **Primary (Vital Emerald)** | `142 70% 45%` | `142 76% 40%` | `#10B981` | Positive progress, protein, health active states |
| **Secondary (Vibrant Coral)**| `350 89% 60%` | `350 89% 55%` | `#F43F5E` | Energy, fats, calorie warnings |
| **Accent (Sky Aqua)** | `199 89% 48%` | `199 89% 40%` | `#0EA5E9` | Water tracking, carbs, analytics curves |
| **Background (Slate Light)** | `210 40% 98%` | `224 71% 4%` | `#F8FAFC` / `#020617` | Main canvas background |
| **Surface (Card / Widget)** | `0 0% 100%` | `222 47% 11%` | `#FFFFFF` / `#0F172A` | Widget cards & modal bodies |
| **Border (Thin Glass)** | `220 13% 91%` | `217 33% 17%` | `#E2E8F0` / `#1E293B` | Thin dividers and boundaries |
| **Text Primary** | `222 47% 11%` | `210 40% 98%` | `#0F172A` / `#F8FAFC` | Titles & body copy |
| **Text Secondary** | `215 16% 47%` | `215 20% 65%` | `#64748B` / `#94A3B8` | Labels & metadata description |

---

## ✍️ 2. Typography

We import and use the Google Font **Outfit** for headlines/metrics, and **Inter** for clean readability of table rows and logs.

### Scale:
- **Display Metric (Calories)**: `font-outfit text-5xl font-bold tracking-tight`
- **Headline (H1)**: `font-outfit text-3xl font-bold tracking-tight`
- **Sub-headline (H2)**: `font-outfit text-xl font-semibold tracking-tight`
- **Widget Title**: `font-outfit text-base font-semibold`
- **Body Text**: `font-inter text-sm font-normal`
- **Detail Labels**: `font-inter text-xs font-medium uppercase tracking-wider`

---

## 📏 3. Spacing System

Adhering to the Apple 4px grid system for layout proportions:

- `4px` (`space-1`): Micro gaps (labels to metadata).
- `8px` (`space-2`): Small paddings inside buttons.
- `12px` (`space-3`): Standard form elements spacing.
- `16px` (`space-4`): Default padding inside widget cards.
- `24px` (`space-6`): Layout padding, grid margins.
- `32px` (`space-8`): Large section boundaries.

---

## 🪵 4. Border Radius System

To mimic high-end squircle layouts seen in Apple Health:

- **Large (xl)**: `24px` (`rounded-3xl` / `--radius-xl`) — Used for main widget containers and cards.
- **Medium (lg)**: `16px` (`rounded-2xl` / `--radius-lg`) — Used for modals, sub-widgets, or secondary cards.
- **Small (md)**: `12px` (`rounded-xl` / `--radius-md`) — Used for buttons, text inputs, and photo previews.
- **Tiny (sm)**: `8px` (`rounded-lg` / `--radius-sm`) — Mini tags, progress pill indicators.

---

## 🌫️ 5. Ambient Shadows

Soft ambient drop shadows that elevate cards without making them look dirty:

- **Ambient Card**: `0 10px 40px -10px rgba(0, 0, 0, 0.04)` (Light mode) | `0 10px 40px -10px rgba(0, 0, 0, 0.25)` (Dark mode)
- **Modal Overlay**: `0 20px 80px -20px rgba(0, 0, 0, 0.12)`
- **Button Hover Glow**: `0 4px 20px -4px rgba(16, 185, 129, 0.3)`

---

## 🛠️ 6. Core Component Class Utilities

### Card Styles
```html
<!-- Premium Glass Card (Light Mode) -->
<div class="bg-white/80 backdrop-blur-md border border-slate-100 rounded-3xl p-5 shadow-card transition-all duration-300 hover:translate-y-[-2px]">
  <!-- content -->
</div>

<!-- Premium Glass Card (Dark Mode) -->
<div class="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-card transition-all duration-300 hover:translate-y-[-2px]">
  <!-- content -->
</div>
```

### Button Styles
```html
<!-- Primary Active Button (Emerald Health Glow) -->
<button class="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-medium px-5 py-3 rounded-xl shadow-glow transition-all duration-200">
  Log Meal
</button>

<!-- Secondary Ghost/Neutral Button -->
<button class="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 font-medium px-5 py-3 rounded-xl transition-all duration-200">
  Cancel
</button>
```

### Form Input Styles
```html
<!-- Modern Floating-Effect Input -->
<div class="relative">
  <input type="text" class="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-xl px-4 py-3 outline-none transition-all duration-200 text-sm placeholder:text-slate-400" placeholder="e.g. Avocado Toast" />
</div>
```
