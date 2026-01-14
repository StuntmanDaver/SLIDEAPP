# Design System — Slide (Visual Language & Component Specs)

> **This document specifies the visual design language, design tokens, typography, component specifications, and screen layouts for the Slide mobile app and admin dashboard.**

---

## 1) Visual Language

### Core Vibe

**Soft "paper" neutrals + muted lavender tinting**
- Calm, premium aesthetic without heaviness
- Warm cool-gray backgrounds with subtle lavender undertones
- Everything feels tactile, like physical cards and paper

**Very large, confident typography (headline-driven hierarchy)**
- Oversized, bold titles dominate the visual hierarchy
- Supporting text is restrained and minimal
- Creates an editorial, premium feeling

**Everything is rounded: cards, chips, buttons, containers, even lists**
- No sharp corners; all elements use curved corners
- Radius is consistent across the system

**Low-contrast borders + very subtle shadows (almost "calm neumorphism" without heavy inner shadows)**
- Hairline borders in muted tones
- Shadows are soft, diffuse, and extremely light
- Separation happens via tint, spacing, and radius — not line weight

**UI is modular: the screen is a stack of "rounded slabs" (each slab contains its own micro-layout)**
- Each content section is its own self-contained rounded container
- Slabs have breathing room between them
- Creates a sense of depth and layering

**Accent colors appear as gentle, desaturated "category pills" (blush, mint, lavender) rather than bright brand colors**
- All colors are muted and desaturated
- Never jarring or saturated
- Used for categorization and visual grouping, not primary interaction

### Shape Grammar

**Big containers: large radius (feels like 24–32px)**
- Hero cards, major panels, screen-level containers

**Pills/chips: full pill radius (16–18px on ~32–36px height)**
- Filter tags, selectable items
- Visually distinct from regular containers

**Icon buttons: perfect circles (40–44px)**
- Top action buttons, navigation elements
- Always circular for clear affordance

**Lists: each row is its own rounded "pill card" (not separators)**
- No divider lines; each row is its own discrete, rounded container
- Tinted backgrounds distinguish rows visually

---

## 2) Design Tokens

### Approximate Color Palette

Use these as your base tokens. These values are sampled/derived from the design but intended to be as close as possible to the intended aesthetic.

#### Neutrals

| Token | Value | Usage |
|-------|-------|-------|
| App background (warm cool-gray) | `#E1E2DD` | Main canvas/screen background |
| Pure surface (buttons/cards) | `#FFFFFF` | Card fills, button fills, high-contrast surfaces |
| Light surface alt | `#E4E3DF` | Secondary surfaces, bottom nav, alternatives |
| Primary text | `#090908` or `#0E0D0E` | All body text, headlines |
| Secondary text | `#7D737B` / `#958F99` | Muted gray-lilac, supporting text |

#### Lavender System

| Token | Value | Usage |
|-------|-------|-------|
| Primary lavender card tint | `#B2AAC2` | Hero course cards, primary panels |
| Secondary lavender tint | `#C6BFCF` | Secondary backgrounds, surfaces |
| Background lavender (overall canvas) | `#B0A8BF` | Large background areas (desktop layouts) |

#### Borders

| Token | Value | Usage |
|-------|-------|-------|
| Hairline border (chips) | `#C1C2BD` at ~1px | Chip borders, light dividers |
| Alternative border (CSS) | `rgba(0,0,0,0.10)` | General subtle borders when CSS preferred |

#### Category Row Tints

| Token | Value | Usage |
|-------|-------|-------|
| Blush row (gradient) | `#D7C1C3` to `#E1CECF` | Category-specific row tinting |
| Mint row (gradient) | `#BCD0CC` to `#C7DAD7` | Category-specific row tinting |
| Cool lavender row | `#C1C1CB` / `#C3BECB` | Category-specific row tinting |

#### Elevation (Subtle Shadows)

Keep shadows extremely soft and restraint:

| Token | Value | Usage |
|-------|-------|-------|
| Card shadow | `0 10px 30px rgba(0,0,0,0.08)` (or 0.06) | Standard card elevation |
| Small control shadow | `0 6px 18px rgba(0,0,0,0.06)` | Small buttons, chips, minor elevations |
| No shadow | N/A | Many elements rely on tint + border instead |

### Corner Radii

| Context | Value |
|---------|-------|
| Screen-level cards / major panels | 28px |
| Standard cards | 24px |
| Inner cards / row pills | 18–20px |
| Chips | 16px |
| Icon buttons | 999px (circle) |

### Spacing System (8pt Grid)

| Token | Value | Usage |
|-------|-------|-------|
| Outer margins | 24px | Screen edges, major sections |
| Card padding | 16px | Content inside cards |
| Inter-element gaps | 12px | Space between sections |
| Micro gaps (icon-text) | 8px | Small spacing within components |

---

## 3) Typography

### Font Choice

Use a modern grotesk with a slightly editorial feel (clean but not purely geometric). Good matches:

- **SF Pro Display** (iOS native, premium feel)
- **Inter** (neutral, widely available)
- **Manrope** / **Satoshi** (if you want the "soft premium" vibe)

### Type Scale

All measurements are approximate and designed to create clear visual hierarchy:

| Usage | Size | Weight | Line Height | Opacity/Color | Example |
|-------|------|--------|-------------|---------------|---------|
| Overline/greeting | 14px | regular | 1.4 | ~60–70% (secondary text) | "Hello, Anna" |
| Hero title | 40–44px | semibold/bold | 1.05–1.15 | primary text | "Your Custom Syllabus" |
| Section title | 22–24px | semibold | 1.2 | primary text | "Spatial Aptitude" |
| Body | 14–16px | regular | 1.5–1.6 | primary text | Standard paragraph text |
| Meta labels | 12px | medium | 1.4 | secondary text, muted | "Pages", "Videos", "Hours" |
| Big stats | 28–34px | bold | 1.0–1.1 | primary text | "24", "10", percentages |

### Key Principles

- The UI uses big, simple headlines and very restrained supporting text
- Never crowd information; plenty of whitespace around type
- Large typography with breathing room creates the "premium calm" feeling
- Meta information is always small and muted
- Hierarchy is created through size and weight, not color

---

## 4) Component Specs

### A) Top Actions (Icon Buttons)

**Shape & Sizing:**
- Shape: circular, 40–44px diameter
- Fill: `#FFFFFF` (pure white)
- Icon: 18–20px stroke icon, dark `#090908`

**Placement:**
- Top-right cluster, spaced 10–12px apart
- Often paired with avatar on opposite side

**Interaction:**
- Shadow on press (slight lift)
- No color change; shape integrity maintained

---

### B) Filter Chips Row

**Chip Specifications:**
- Height: 32–34px
- Padding: 14px horizontal, 8–10px vertical
- Border: 1px `#C1C2BD` (or `rgba(0,0,0,0.10)`)
- Fill: transparent or slightly lighter than background
- Text: 13–14px, medium weight

**Row Layout:**
- Filter icon button at far left (circular, consistent with top actions)
- Chips follow in a horizontal row, spaced 8–10px
- Dismiss "x" on each chip: small, same muted stroke as border

**Interaction:**
- Active chip: black fill with white text (signature black pill treatment)
- Inactive chip: transparent/subtle tint with dark text
- Never use color alone for state; rely on shape (filled pill vs. outline pill)

---

### C) Primary Course Card (The Lavender "Hero Card")

This is the signature element of the design.

**Container:**
- Fill: `#B2AAC2` (primary lavender)
- Radius: 24–28px
- Padding: 16px
- Shadow: `0 10px 30px rgba(0,0,0,0.08)`

**Top Row:**
- Title on left (large, bold)
- Kebab/ellipsis menu button on right (small circular button, consistent style)

**Body Layout:**
- Description under title (2 lines max, secondary text color)
- Stats row on left (Pages/Videos/Hours)
- Image panel on right or bottom (rounded clip, illustration)

**Stats Treatment:**
- Labels: small (12px), muted secondary text color
- Values: very large and bold (28–34px), primary text color
- Minimal dividers (optional thin vertical split)
- Arranged vertically or in a compact grid

**Image Panel (inside card):**
- Rounded rectangle, clipped within the card bounds
- Often uses a "3D abstract" illustration or geometric pattern
- Has a small floating circular action button bottom-right (arrow/play icon)
- The button sits slightly outside the image for visual prominence

---

### D) List Rows (Pastel Subject Pills)

**Structure:**
- Each row is its own rounded card (no separators between rows)
- Height: 56–64px
- Radius: 18–20px
- Fill: tinted category color (blush/mint/lavender, per category)
- Spacing between rows: 12px

**Layout:**
- **Left:** Circular icon badge (32–36px) with small pictogram or icon
- **Middle:** Title (14–16px, semibold) + 1 line description (12px, secondary text)
- **Right:** Optional subtle action (chevron, menu icon, or empty)

**Interactive States:**
- No heavy hover effects; subtle tint shift
- Press: slight shadow increase
- Selection (if applicable): subtle border or background shift

---

### E) Bottom Navigation (Floating Capsule)

**Container:**
- Height: 56px (including safe area padding)
- Radius: 28px
- Fill: `#E4E3DF` (light neutral)
- Shadow: `0 6px 18px rgba(0,0,0,0.06)` (subtle)
- Sits above safe area with breathing room (~16px from bottom)

**Items:**
- 4–5 icons spaced evenly
- Icon size: 24–28px
- Active item: a solid black pill/capsule behind the icon (background shape)
- Active icon: white on black (reversed)
- Inactive icons: dark `#090908` on transparent background

**Interaction:**
- The "hardware UI" feel comes from the black pill shifting beneath the active icon
- Not a color change; a shape change (pill appears/disappears)
- Smooth animation between states (100–150ms)

---

### F) Segmented Control (Files / Videos / Audio)

**Structure:**
- Background: transparent (segmented buttons float)
- Height: 32–34px
- Radius: 16px per segment (pill-shaped)
- Spacing between segments: 10–12px (not flush)

**States:**
- **Active segment:** solid black pill (`#090908`) with white text
- **Inactive segment:** light tinted pill (`#C6BFCF`) with dark text

**Text:**
- Size: 13–14px, medium weight
- Case: title case or lowercase (consistent throughout)

**Interaction:**
- Smooth transition between states (150–200ms)
- No intermediate states; crisp on/off

---

### G) Lecture List Items (With Durations)

**Container:**
- Rounded row container, light lavender tint (similar to list rows)
- Height: 50–56px
- Radius: 18–20px

**Layout:**
- **Left:** Small circular play icon (24–28px) in a darker shade
- **Center:** Title (14–16px, semibold) + tiny description line (11–12px, secondary text)
- **Right:** Duration in a small capsule area or aligned text (12px, muted)

**Interaction:**
- Press: slight shadow increase, tint shift
- Tap to play/navigate

---

### H) Progress Mini-Card (Percentage Card)

**Structure:**
- Fill: `#FFFFFF` (pure white)
- Radius: 18–20px
- Padding: 12px
- Shadow: `0 6px 18px rgba(0,0,0,0.06)` (subtle)

**Layout:**
- **Left:** Person image (circular or rounded mask, 48–56px)
- **Right:** Big percentage (28–34px, bold) + tiny explanation text (11px, secondary)

**Placement:**
- Feels "floating" on top of content
- Often positioned as an overlay near bottom of screen
- Slight shadow emphasizes elevation

---

## 5) Screen Layouts

### Screen 1: Mobile "Your Custom Syllabus"

**Structure (top to bottom):**
1. **Top bar:** Avatar on left, 2 circular action buttons on right
2. **Greeting:** "Hello, [Name]" (small, ~14px, secondary text)
3. **Giant title:** "Your Custom Syllabus" (40–44px, bold, 2 lines)
4. **Chip row:** Filter button + individual chips for categories
5. **Hero course card:** Lavender card with course title, description, stats, and image
6. **Course modules list:** Stack of tinted pill rows (each row is a module)
7. **Floating bottom nav capsule:** 4–5 navigation icons

**Spacing Rule:**
- Airy layout; each section separated by 12–16px
- No cramped sections; breathing room between all elements
- Screen feels spacious and calm

---

### Screen 2: Mobile "Lecture / Spatial Aptitude"

**Key Differences:**
- **Upper half:** Big title + abstract art background occupying significant vertical space
- **Top-left:** Back arrow in a circular white button
- **Top-right:** Share + overflow buttons (circular, white)
- **Under title:** Segmented control (Files / Videos / Audio)
- **Main content:** Playlist list items (lecture rows with play icon)
- **Near bottom:** Progress mini-card (white, overlays content slightly)

**Depth Layering:**
- Background art → content text → pills → floating progress card
- Creates a sense of depth through layering

---

### Screen 3: Calendar View

**Structure:**
1. **Top month header:** "June, 2026" with dropdown chevron + plus button (circular) on right
2. **Horizontal week/day strip:** 
   - Each day is a small rounded chip (32–36px)
   - Selected day: solid black pill with white day number
   - Unselected: light tint with dark number
3. **Timeline list:**
   - Time labels on left (10 AM, 11 AM, etc.; 12px, secondary text)
   - Event card on right (blush-tinted rectangle, rounded corners)
   - Event card contains: title (14px) + description (12px) + metrics grid (Room / Points)
   - Small avatar bottom-right of event card
4. **Empty time block:** Light outline with playful micro-illustration lines (optional)

---

### Screen 4: Desktop "Classroom" Layout (3-Column Board)

This is a responsive translation of the same components.

**Left Rail:**
- Vertical icon-only navigation with circular buttons
- Active icon sits in a darker pill/circle background
- Avatar at bottom

**Left Column (Syllabus):**
- Same header + chips + hero card + list rows
- Components simply wider to fit desktop

**Center (Main Content):**
- Large video player card (rounded corners)
- Overlay playback controls with translucent dark bar
- Full control affordances (play, pause, seek, volume)

**Bottom Center (Chat):**
- White rounded chat card
- Message bubbles are soft, rounded rectangles
- Composer row uses pill buttons: Files / Images / Audio

**Right Column (Lecture List):**
- Lavender panel matching the left column's hero card tint
- Same segmented control as mobile
- Lecture list items with consistent styling
- Kebab menu top-right

**Composition:**
- Entire desktop UI looks like "three rounded islands" placed on a lavender canvas
- Clear visual separation between content areas
- Consistent spacing and alignment across the layout

---

## 6) The Details That Make It Look Expensive

### Active States Are Shapes, Not Colors

- The selected navigation item or selected tab becomes a **solid black pill**
- That's the signature contrast move
- Not a color shift; a shape shift (pill appears or disappears behind the element)

### Almost No Hard Lines

- Borders are hairline and low-contrast
- Separation happens via **tint**, **spacing**, and **radius**
- Never use heavy dividers or hard lines

### Consistent Corner Rounding Across the Whole System

- Everything feels from the same kit because radii are consistent:
  - Big: 28px
  - Normal: 24px
  - Small: 18px
  - Pills: 16px

### Muted Category Colors

- Nothing is saturated
- Even "accent" rows look like colored paper
- Category tints are desaturated and soft

### Large Typography with Lots of Breathing Room

- Oversized title + minimal clutter makes it feel editorial
- Whitespace is abundant
- Premium feel comes from space, not decoration

---

## 7) Implementation Notes

### CSS / React Native

**Design tokens as CSS variables (recommended):**
```css
:root {
  /* Neutrals */
  --color-bg: #E1E2DD;
  --color-surface: #FFFFFF;
  --color-surface-alt: #E4E3DF;
  --color-text-primary: #090908;
  --color-text-secondary: #7D737B;
  
  /* Lavender */
  --color-lavender-primary: #B2AAC2;
  --color-lavender-secondary: #C6BFCF;
  
  /* Radii */
  --radius-lg: 28px;
  --radius-md: 24px;
  --radius-sm: 18px;
  --radius-xs: 16px;
  --radius-circle: 999px;
  
  /* Spacing */
  --spacing-xl: 24px;
  --spacing-md: 16px;
  --spacing-sm: 12px;
  --spacing-xs: 8px;
  
  /* Shadows */
  --shadow-card: 0 10px 30px rgba(0,0,0,0.08);
  --shadow-control: 0 6px 18px rgba(0,0,0,0.06);
}
```

**React Native (Tailwind config example):**
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: '#E1E2DD',
        surface: '#FFFFFF',
        text: '#090908',
      },
      borderRadius: {
        lg: '28px',
        md: '24px',
        sm: '18px',
        xs: '16px',
      },
    },
  },
};
```

### Platform-Specific Guidance

**iOS:**
- Use `SF Pro Display` natively for premium feel
- Leverage native circular button shapes
- Utilize haptic feedback on button press

**Android:**
- Use `Inter` or `Roboto` as fallback (clean, modern)
- Ensure button shapes match iOS (circular, rounded)
- Test spacing on various screen sizes

---

## 8) Accessibility & Inclusive Design

- **Color contrast:** Ensure minimum 4.5:1 ratio for text (all colors meet WCAG AA)
- **Tap targets:** Icon buttons minimum 40px (already specified)
- **Text sizes:** Never go below 12px for body text
- **Focus indicators:** Subtle but visible (consider a thin border around focused elements)
- **Motion:** Animations 150–300ms (smooth but not slow)

---

## 9) Animation & Micro-interactions

### Transition Speeds

- Button press: 100–150ms
- Tab/nav switch: 150–200ms
- Card expand/collapse: 200–300ms
- Scroll parallax: smooth, 30–60fps

### Spring Easing

- Use iOS-like spring easing for natural motion
- Avoid linear transitions; prefer `cubic-bezier(0.34, 1.56, 0.64, 1)` (bouncy spring)
- Subtle bounces make interactions feel responsive

### No Heavy Animations

- The design is calm; animations should be subtle
- Avoid spinning, pulsing, or attention-grabbing effects
- Animations enhance usability, not distract

---

## 10) Dark Mode (Optional, Post-MVP)

If dark mode is added later:

- **Dark background:** ~`#1A1A1A` (near black)
- **Dark surface:** ~`#2D2D2D` (dark gray)
- **Text on dark:** `#FFFFFF` (inverted)
- **Lavender on dark:** Increase brightness by ~20% (`#D4CCDF` instead of `#B2AAC2`)
- **Shadows:** Increase opacity slightly (darkness helps with layering)

---

## 11) Responsive Breakpoints

| Breakpoint | Context | Behavior |
|------------|---------|----------|
| Mobile | < 768px | Stack vertical, full width, touch targets optimized |
| Tablet | 768–1024px | 2-column layout, larger spacing |
| Desktop | > 1024px | 3-column board layout (as described in §5.4) |

---

## References

- **PRD.md** — Product requirements and functional specifications
- **README.md** — Technical architecture and development guide
- **claude.md** — AI assistant reference guide (references this document)

---

*Last updated: January 2026*
*Design system source: Figma / Design iterations*
