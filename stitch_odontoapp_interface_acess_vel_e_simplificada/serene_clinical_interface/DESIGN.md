---
name: Serene Clinical Interface
colors:
  surface: '#fff7fc'
  surface-dim: '#e3d6e5'
  surface-bright: '#fff7fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fdefff'
  surface-container: '#f8e9fa'
  surface-container-high: '#f2e4f4'
  surface-container-highest: '#ecdeee'
  on-surface: '#201924'
  on-surface-variant: '#504251'
  inverse-surface: '#362e39'
  inverse-on-surface: '#faecfc'
  outline: '#827282'
  outline-variant: '#d3c1d2'
  surface-tint: '#942cb0'
  primary: '#70008b'
  on-primary: '#ffffff'
  primary-container: '#8e24aa'
  on-primary-container: '#f7bcff'
  inverse-primary: '#f3aeff'
  secondary: '#7e4a8a'
  on-secondary: '#ffffff'
  secondary-container: '#f5b7fe'
  on-secondary-container: '#754281'
  tertiary: '#523859'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b4f72'
  on-tertiary-container: '#e8c4ee'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#fdd6ff'
  primary-fixed-dim: '#f3aeff'
  on-primary-fixed: '#340042'
  on-primary-fixed-variant: '#790096'
  secondary-fixed: '#fdd6ff'
  secondary-fixed-dim: '#efb1f9'
  on-secondary-fixed: '#340141'
  on-secondary-fixed-variant: '#643370'
  tertiary-fixed: '#fad7ff'
  tertiary-fixed-dim: '#debbe4'
  on-tertiary-fixed: '#291231'
  on-tertiary-fixed-variant: '#583d5f'
  background: '#fff7fc'
  on-background: '#201924'
  surface-variant: '#ecdeee'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  label-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.2'
  button-text:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  stack-xs: 0.5rem
  stack-sm: 1rem
  stack-md: 2rem
  stack-lg: 4rem
  gutter: 24px
  margin-safe: 32px
  max-width: 1280px
---

## Brand & Style
The brand personality focuses on reliability, clinical hygiene, and extreme ease of use for practitioners who prioritize patient care over complex software navigation. The target audience is medical professionals who value clarity and reduced cognitive load.

The design system employs a **Minimalist** style with high-legibility cues. It leverages a calming lilac palette to move away from the sterile, cold blues typical of medical software, replacing them with a warmer, more inviting tone. The visual response should be one of "effortless control"—where every action is predictable and every piece of information is immediately readable without strain.

## Colors
The palette is built on soft shades of lilac to provide a soothing clinical environment. 
- **Primary (#8E24AA):** Used exclusively for primary actions, active states, and critical navigation markers.
- **Secondary/Tertiary (#CE93D8, #E1BEE7):** Used for subtle categorization, progress indicators, and decorative accents that don't require immediate attention.
- **Neutral (#F3E5F5):** Used for large surface areas and background groupings to reduce eye strain.
- **Contrast:** Text must maintain a high-contrast ratio against backgrounds, primarily using a near-black dark gray for maximum legibility.

## Typography
This design system prioritizes readability for users who may have declining eyesight. We utilize **Inter** for its tall x-height and clear letter forms.

- **Scale:** The base body size starts at 18px, with 20px preferred for clinical notes.
- **Weight:** Avoid light weights (300 or less). Use Medium (500) and Bold (700) to create hierarchy.
- **Spacing:** Increased line-height (1.6) ensures lines of text don't "blur" together when reading patient histories or schedules.

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop to keep information centered and contained, preventing the eye from having to travel across ultra-wide monitors.

- **Whitespace:** Use generous margins (`stack-lg`) between major sections to prevent the UI from feeling cluttered or "busy."
- **Grid:** A standard 12-column grid is used, but content should ideally be grouped into 2 or 3 wide columns to keep the interface simple.
- **Reflow:** On tablets, the grid collapses to 1 column for forms and 2 columns for dashboards, ensuring buttons remain large and tap targets are accessible.
- **No Hidden Menus:** Sidebars should remain expanded whenever possible. Avoid "hamburger" menus; use visible labels for all navigation items.

## Elevation & Depth
To maintain a clean, clinical aesthetic, this design system avoids heavy shadows or complex skeuomorphism. Depth is achieved through:

- **Tonal Layers:** Using the neutral lilac (#F3E5F5) as a background "well" and white (#FFFFFF) for the foreground "cards" or "paper."
- **Low-Contrast Outlines:** Instead of shadows, use 1px borders in `#E1BEE7` to define boundaries of input fields and containers.
- **Interaction Depth:** Only the primary buttons may use a very soft, diffused ambient shadow (10% opacity) to suggest clickability.

## Shapes
Shapes are intentionally friendly and safe. 
- **Standard Radius:** 0.5rem (8px) for cards and smaller elements.
- **Large Radius:** 1rem (16px) for main action buttons and primary containers.
- This "rounded" approach removes the harshness of sharp clinical software while maintaining a modern, professional structure.

## Components
Consistent styling across the application ensures the user never has to "guess" how to interact with an element.

- **Buttons:** Large height (minimum 56px). Primary buttons use the Primary Color with white text. Padding is generous (min 32px horizontal). Labels must be descriptive (e.g., "Confirmar Agendamento" instead of just "Ok").
- **Input Fields:** High-contrast borders (1.5px). Focused states should use a thick 3px lilac outline. Labels are always positioned *above* the field, never as placeholder text, for permanent visibility.
- **Cards:** Used to group patient data. They feature a white background and a 1px soft purple border.
- **Lists:** High row height (min 64px) with clear horizontal dividers to ensure the user doesn't misread line items in a schedule.
- **Visual Confirmations:** After any action (like saving), a large, clear "Sucesso" banner appears at the top of the screen in a soft green or lilac tone to provide immediate feedback.
- **Checkboxes/Radios:** Scaled up to 1.5x the standard size to ensure they are easy to see and click.