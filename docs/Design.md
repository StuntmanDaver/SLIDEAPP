Below is a direct adaptation of those design elements to **Slide** (consumer app + staff scanner app + admin dashboard), staying MVP-only and mapping each “paper calm / lavender slabs” component to Slide’s actual screens and states.

---

## 1) Visual language adapted to Slide

### Core vibe (keep exactly)

* **Soft paper neutrals + lavender canvas** → makes Slide feel premium, calm, trustworthy at the door.
* **Headline-driven hierarchy** → your main “Passes” number and “My Pass” QR are the hero.
* **Everything rounded** → consistent radius system across consumer + scanner + admin.
* **Low-contrast borders, subtle shadows** → avoids “club flyer” energy; feels like a premium membership.
* **UI as stacked rounded slabs** → each slab maps to one functional unit: membership, pass balance, send pass, my pass, scan result, logs.
* **Accent colors as desaturated pills** → use them to represent **pass states** and **scan results** (not categories).

### Shape grammar (Slide mapping)

* Big containers (24–32px radius): “Membership”, “Pass Balance”, “My Pass QR”, “Tonight’s Scan Stats”.
* Pills/chips: pass state tags (`ACTIVE`, `CLAIMED`, `REDEEMED`) and filters in admin.
* Icon buttons: camera/torch/help/overflow on scanner; settings/profile on consumer.
* Lists: each row is a rounded pill card: “Pass sent”, “Pass claimed”, “Scan log row”, “Staff account row”.

---

## 2) Design tokens for Slide (theme system)

### Base neutrals (shared across all apps)

* **App background**: `#E1E2DD`
* **Pure surface** (cards/buttons): `#FFFFFF`
* **Alt surface**: `#E4E3DF`
* **Primary text**: `#090908`
* **Secondary text**: `#7D737B` (or `#958F99` for lighter)

### Lavender system (primary brand feel)

* **Hero lavender** (main slabs): `#B2AAC2`
* **Secondary lavender** (rows/panels): `#C6BFCF`
* **Canvas lavender alt** (optional for some screens): `#B0A8BF`

### Borders + separators (soft)

* **Hairline border**: `#C1C2BD` at 1px
* For code: `rgba(0,0,0,0.10)` is acceptable equivalent.

### “State tints” (replace “category tints” with pass/scan semantics)

Use the same muted-paper logic, but assign to meaning:

**Pass status tints**

* `CREATED` (sent, unclaimed): cool lavender row `#C1C1CB`
* `CLAIMED` (owned by friend): mint row `#BCD0CC` → `#C7DAD7`
* `REDEEMED` (used): neutral-alt `#E4E3DF` (quiet, “done”)
* `REVOKED` (admin/staff action): blush `#D7C1C3` → `#E1CECF`
* `EXPIRED` (time-based): use `#C6BFCF` (muted lavender) + secondary text

**Scan result pills**

* `VALID`: mint
* `USED`: neutral-alt
* `INVALID`: blush
* `EXPIRED`: lavender-alt
* `REVOKED`: blush (stronger emphasis via bold label, not saturation)

### Elevation (extremely soft)

* Card shadow: `0 10px 30px rgba(0,0,0,0.06–0.08)`
* Small control shadow: `0 6px 18px rgba(0,0,0,0.06)`
* Many elements: no shadow; rely on tint + spacing.

### Corner radii (keep consistent everywhere)

* Major panels: **28**
* Standard cards: **24**
* Row pills: **18–20**
* Chips: **16**
* Icon buttons: **999**

### Spacing (8pt grid)

* Outer margins: **24**
* Card padding: **16**
* Gaps: **12**
* Micro gaps: **8**

---

## 3) Typography adapted to Slide (what becomes “big”)

### Fonts

* iOS: **SF Pro Display**
* Cross-platform: **Inter** or **Manrope** (Manrope feels “soft premium”)

### Slide type scale (mapped)

* Overline (“Membership status”): **14**, regular, 60–70% opacity
* Hero title on Home (“Your passes”): **40–44**, semibold/bold, tight LH
* Section title (“My Pass”, “Sent Passes”, “Scanner”): **22–24**, semibold
* Body: **14–16**, regular
* Meta labels (“Renews”, “Expires”, “Scans tonight”): **12**, medium, muted
* Big stat (passes remaining): **32–40**, bold

**Key rule:** only one “hero” element per screen (Pass count OR QR OR Scan Result).

---

## 4) Component specs — Slide equivalents

### A) Top actions (icon buttons)

**Consumer**

* Left: avatar circle (or “S” monogram)
* Right: settings + help (circular white buttons)
* 44×44, icon 18–20 stroke, `#090908`

**Scanner**

* Top row: back (left), torch + overflow (right), all circular white

**Admin (web)**

* Top bar actions as circular buttons; keep same radius and shadow softness.

---

### B) Filter chips row

Use chips for:

* Admin: `All`, `Tonight`, `Invalid`, `Used`, `Revoked`, `By Staff`
* Consumer: optional mini-chips on “Sent Passes” list: `Sent`, `Claimed`, `Redeemed`

Spec matches:

* Height 32–34
* Border 1px hairline
* Fill transparent or slightly lighter than background
* Text 13–14 medium
* Active chip becomes **black pill** with white text (signature move)

---

### C) Primary “hero card” (lavender signature) → make it “Pass Balance”

This becomes Slide’s iconic element.

**Home hero card: “Membership & Pass Balance”**

* Fill: `#B2AAC2`
* Radius: 24–28
* Padding: 16

Layout:

* Top row: “Membership” + kebab menu (small circular)
* Description: “X passes per period • Renews DATE”
* Stats row:

  * Label: “Remaining”
  * Value: huge number (32–40 bold)
  * Small divider optional
  * “Used” and “Total”
* Bottom-right: small floating circular action button: **Send Pass** (arrow/share icon)

Keep it airy; no dense text.

---

### D) List rows (pastel pill cards) → “Sent Passes” + “Scan Logs”

Each row is a rounded pill card (no separators).

**Consumer “Sent Passes” row**

* Height: 56–64
* Radius: 18–20
* Fill based on pass status tint
* Left: circular badge (32–36) with icon:

  * paper plane = sent
  * check = redeemed
  * lock/slash = revoked
* Middle: “Pass to {Name or ‘Friend’}” + 1-line meta (“Claimed 9:42 PM”)
* Right: subtle status pill

**Admin “Scan log row”**

* Left: time
* Middle: result + pass id short
* Right: staff initials badge (circle)

---

### E) Bottom navigation (floating capsule) → Consumer only

Keep 4 items, no extras:

* Home
* My Pass
* Sent
* Account

Spec:

* Height 56, radius 28
* Fill: `#E4E3DF`
* Active: **black pill behind icon** (white icon)
* Floats above safe area; 12–16 breathing room.

---

### F) Segmented control (black active pill) → Admin + Consumer lists

Use segmented control where you need quick filtering without extra screens:

**Consumer “Sent Passes”**

* Segments: `Sent / Claimed / Redeemed`
* Active: black pill, white text
* Inactive: `#C6BFCF` pill, dark text
* Height: 32–34, spacing 10–12 between segments

**Admin “Logs”**

* Segments: `Scans / Passes / Staff`
  (Only if you keep admin minimal; otherwise use left nav.)

---

### G) Lecture list items → Scanner results history items

For scanner:

* Rounded row container `#C6BFCF` or `#E4E3DF`
* Left: small circular icon for result
* Center: “VALID” + “Pass ****-1234”
* Right: time

Keep it subordinate; the scan result banner is the hero.

---

### H) Progress mini-card overlay → “Tonight’s Stats” overlay (Admin) or “QR status” (Consumer)

**Consumer “My Pass”**

* Overlay mini-card (white, 18–20 radius) that shows:

  * “Status: CLAIMED”
  * “Token refresh in 12s” (small muted)

**Admin “Scanner health”**

* Overlay card on logs view:

  * “Invalid rate”
  * “p95 latency”
  * “Scans tonight”

This matches the “floating expensive” feel.

---

## 5) Screen layouts adapted to Slide (exactly how to compose)

### Screen 1 (Consumer Home) → “Your Passes”

Stack:

1. Top bar: avatar left, settings/help right (circular)
2. Small greeting: “Welcome back,”
3. Giant title: “Your passes”
4. Chip row (optional): `Membership Active` pill + `Renews DATE` pill
5. Hero lavender card: Membership + Pass Balance + Send Pass action
6. List: “Recent passes” pill rows (3–5 items)
7. Floating bottom nav capsule

Spacing: 12–16 between slabs, never tight.

---

### Screen 2 (Consumer My Pass) → QR as hero

Structure:

* Upper half: soft lavender canvas with subtle abstract background (very low contrast)
* Top-left back arrow (circle white)
* Top-right help/overflow (circle white)
* Big title: “My Pass”
* QR container: white rounded slab (24–28 radius), with QR inside
* Under QR: status pills (`CLAIMED`, `EXPIRES 2:00 AM`)
* Overlay mini-card: “Refreshes in 12s” + tiny explanation

No extra content on this screen.

---

### Screen 3 (Staff Scanner) → fast and readable

Structure:

* Top bar: back, torch, overflow (all circular white)
* Center: camera view with a rounded mask frame (subtle)
* Bottom slab: large result banner (changes tint by result)

  * “VALID” huge
  * “Admit” microcopy
  * optional pass short id
* Optional: last 3 scans list below banner

Important: “Active states are shapes.” The result should appear in a **big rounded slab**, not a tiny toast.

---

### Screen 4 (Admin Web) → “three rounded islands”

Canvas: lavender background.

* Left rail: icon-only nav in circular buttons
* Center: primary panel “Scans” with chip filters + list rows
* Right: “Stats” panel (white) + “Staff” panel (lavender)

Everything is rounded islands, no hard lines.

---

## 6) The “expensive” details applied to Slide

1. **Active states are shapes**

   * Active bottom-nav icon sits in black pill
   * Active segment is black pill
   * Active chip becomes black pill

2. **Almost no lines**

   * Avoid dividers; use spacing + tint
   * Borders only for chips at hairline

3. **Consistent radii system**

   * Enforce the 28/24/20/16 system everywhere

4. **Muted state colors**

   * Use blush/mint/lavender only as “paper tints” for state feedback

5. **Big typography, tiny supporting text**

   * “Remaining passes” huge
   * Everything else quiet and minimal

---

## 7) Quick build checklist for Slide UI kit

* Set app background to `#E1E2DD`
* Define hero lavender slab `#B2AAC2` and alt tint `#C6BFCF`
* Chips: 32–34 height, 1px `#C1C2BD` border
* Actions: circular white 44×44
* Segmented control: black active pill
* Rows: pill-cards only, no separators
* Bottom nav: floating capsule, black active pill
* Shadows: extremely soft or none

---

## 8) Deliverables to hand to engineering (so it’s implementable)

If you want this to be plug-and-play, build a tiny “design system” package with:

### Tokens

* `colors.*`
* `radii.*`
* `spacing.*`
* `typography.*`
* `shadows.*`

### Components

* `SlabCard`
* `PillRow`
* `Chip`
* `SegmentedPills`
* `IconCircleButton`
* `FloatingBottomNav`
* `ResultBanner` (scanner)
* `QrCard`

### Screen templates

* `HomeStackTemplate`
* `QrHeroTemplate`
* `ScannerTemplate`
* `AdminIslandLayout`

If you tell me whether you’re using **React Native (Expo)** or **Flutter**, I’ll output the exact token objects + component props API (copy-paste) in that framework’s style, while keeping the same visual language.
