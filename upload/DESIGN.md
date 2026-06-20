---
name: TabunganKu Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#95002b'
  on-tertiary: '#ffffff'
  tertiary-container: '#bf0f3c'
  on-tertiary-container: '#ffd0d2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1200px
---

## Brand & Style
The design system is built upon a philosophy of **Financial Clarity through Minimalism**. The target audience consists of individuals seeking an unburdened, focused environment to manage their personal finances without the cognitive load of traditional banking interfaces. 

The visual style is **Corporate Modern with a Minimalist execution**. It prioritizes high-quality whitespace to reduce financial anxiety, employing a flat design language that utilizes subtle tonal depth rather than aggressive skeuomorphism. The emotional response is one of calm, control, and professional reliability. The interface feels "light" but mathematically precise.

## Colors
The palette is functional and semantic, designed to provide immediate status recognition without overwhelming the user.

- **Primary (Indigo):** Used for primary actions, navigation states, and brand identification. It represents stability and professional intent.
- **Secondary (Emerald Green):** Exclusively reserved for "Income" (Pemasukan) and positive financial trends.
- **Tertiary (Rose Red):** Reserved for "Expenses" (Pengeluaran) and critical alerts or negative balances.
- **Neutral (Slate Grays):** A sophisticated range of grays used for structural borders, secondary text, and background layering to ensure the white surface remains the hero.

The background should primarily use a clean white (#FFFFFF) for cards and a very light gray (#F8FAFC) for the canvas to create subtle separation.

## Typography
This design system utilizes **Inter** for all roles to maintain a systematic, utilitarian aesthetic that excels in data density and legibility. 

- **Numerical Data:** For balance displays (Saldo), use `display-lg` with tight letter spacing to emphasize the importance of the figure.
- **Hierarchies:** Use font weights (Medium 500 and SemiBold 600) to create hierarchy rather than relying on color.
- **Localization:** Ensure line heights are generous enough to accommodate Indonesian word lengths, which can often be longer than English equivalents.

## Layout & Spacing
The layout follows a **fluid grid system** with strict alignment to an 8px square baseline. 

- **Mobile:** A 4-column grid with 16px side margins. Content cards typically span all 4 columns.
- **Desktop:** A 12-column grid with a maximum container width of 1200px. Side margins expand to 48px or auto-center. 
- **Spacing Rhythm:** Use 16px (`md`) for internal card padding and 24px (`lg`) for vertical spacing between distinct content sections. Generous whitespace is a requirement to maintain the "minimalist" feel.

## Elevation & Depth
Depth is conveyed through **Tonal Layering and Soft Ambient Shadows**. 

1. **Canvas (Level 0):** Background color #F8FAFC. 
2. **Cards/Surfaces (Level 1):** White #FFFFFF with a very soft, diffused shadow (0px 2px 4px rgba(0,0,0,0.05)) and a subtle 1px border (#E2E8F0).
3. **Active/Modals (Level 2):** White #FFFFFF with a more pronounced shadow (0px 10px 15px rgba(0,0,0,0.1)) to indicate focus.

Avoid heavy blacks; shadows should always be tinted with a hint of the neutral slate color to maintain a professional, soft appearance.

## Shapes
The shape language is **Refined and Modern**. 

The standard radius is **8px (0.5rem)**, providing a balance between the clinical feel of sharp corners and the overly casual feel of high-radius pills. 
- **Small elements (Checkboxes, mini tags):** 4px.
- **Standard cards and buttons:** 8px.
- **Large containers/Bottom sheets:** 16px or 24px on top corners only.

## Components
- **Buttons:** Primary buttons use a solid Indigo background with white text. Secondary buttons use a ghost style (slate border, slate text). Success/Danger actions (Pemasukan/Pengeluaran) use the Emerald/Rose colors respectively but only for primary call-to-actions.
- **Cards:** Used for transaction groups or account summaries. They must have a 1px #E2E8F0 border. Titles should be `headline-md` and secondary info in `label-sm`.
- **List Items:** Simple, single-line or double-line items with a clean separator. Icons should be encased in a light-tinted circular background (e.g., 10% opacity of the category color).
- **Input Fields:** Flat design with a 1px border that changes to 2px Indigo on focus. Labels should use `label-md` in a medium gray.
- **Chips:** Used for transaction categories (e.g., "Makanan", "Transportasi"). Low-saturation backgrounds with high-saturation text of the same hue for maximum readability.
- **Data Visualization:** Simple bar charts or line graphs using the Primary, Secondary, and Tertiary colors. Avoid complex 3D charts; stick to flat, 2D representations with rounded ends.