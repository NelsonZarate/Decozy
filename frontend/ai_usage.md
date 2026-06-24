# AI Usage in the Decozy Project (Frontend)

This document transparently describes where and how Artificial Intelligence
tools **helped** during the development of the **Decozy** frontend — a Next.js
interior-design application powered by AI.

Across the project, AI was used as an **assistant**: it helped shape ideas,
proposed approaches, sketched structures, and contributed to the interface,
component logic, backend integration, and styling. The work was then reviewed,
adjusted, and completed manually — AI supported the process but did not carry
out the tasks entirely on its own.

---

## 1. Quick summary

| Area | AI tool(s) | How AI helped |
|------|------------|---------------|
| Design / UI / UX | **Stitch AI**, **Google AI Studio** | Helped with visual concepts, layouts, and prototypes |
| Code (components, logic, integration) | **Gemini**| Contributed to most of the source code |
| Folder structure | **Gemini** | Suggested a scheme for organizing the folders |

- **Design:** the visual direction, color palette, mobile/desktop layouts, and
  the overall screen structure were shaped with help from **Stitch AI** and
  **Google AI Studio**.
- **Code:** most of the TypeScript/React code was written with assistance from
  **Gemini**.
- **Folder structure:** **Gemini** helped by proposing a folder-organization
  scheme to keep the project tidy and easy to understand.

---

## 2. Design (Stitch AI + Google AI Studio)

The following visual decisions and elements were created with help from
AI design tools:

- **Color system and theme** — AI design tools helped shape the palette defined
  in `src/app/globals.css` (the "navy", "sage", and "warm" tones, surfaces,
  error states, outlines).
- **Typography** — the pairing of *Manrope* (body) and *EB Garamond* (serif),
  configured in `src/app/layout.tsx`, was chosen with AI input.
- **Screen layouts** — AI helped sketch the mobile-first structure with desktop
  adaptation (`lg:`), including:
  - Landing / Hero screen (`src/components/landing/HeroSection.tsx`)
  - Design / upload screen (`src/app/(tabs)/design/page.tsx`)
  - Gallery (`src/components/GalleryPage.tsx`)
  - Favorites (`src/components/MyItemsPage.tsx`)
  - Authentication screens (`SignInPage.tsx`, `SignUpPage.tsx`)
  - Modals and bottom-sheets (credits, checkout)
- **Iconography** — the inline SVG icons used throughout the app follow the
  direction suggested by the design tools.
- **Visual components** — bottom/top navigation, badges, cards, and the
  "before/after" slider were shaped with AI design help.

> Tools: **Stitch AI** and **Google AI Studio**.

---

## 3. Code (Gemini)

AI assisted with most of the frontend code — proposing implementations,
helping debug, and contributing patterns that were then reviewed and finished
by hand. Below is the breakdown by area, file by file.

### 3.1. Configuration and app root

- `src/app/layout.tsx` — AI helped with the root layout, font loading,
  metadata, and wrapping the app with `AuthProvider`.
- `src/app/page.tsx` — AI contributed to the landing page with the login button
  and `HeroSection`.
- `src/app/globals.css` — AI helped with the Tailwind v4 theme variables,
  cursor adjustments, and utilities (`scrollbar-hide`).
- `src/app/not-found.tsx` and `src/app/error.tsx` — AI helped with the 404 and
  generic error pages.
- `next.config.ts` — AI helped configure remote images and turbopack.

### 3.2. API layer and libraries (`src/lib/`)

- `src/lib/api.ts` — AI contributed to the **central API client** for the
  FastAPI backend: JWT token handling (localStorage), the `request<T>()`
  helper, error handling (`ApiError`), and all endpoints (authentication,
  user, projects, uploads/generation, payments, and tokens/credits), as well as
  the TypeScript response interfaces.
- `src/lib/credits.ts` — AI helped define the credit packages
  (`CREDIT_PACKAGES`) and related utilities.
- `src/lib/mockBackend.ts` — AI helped build the simulated backend for the
  design-generation flow.

### 3.3. Authentication (`src/components/auth/`)

- `AuthProvider.tsx` — AI helped with the auth context, localStorage
  hydration, and `signIn`/`signOut`.
- `SignInPage.tsx` — AI contributed to the login form, its validation (email
  and password regex), error handling, and Google sign-in.
- `SignUpPage.tsx` — AI contributed to the registration form with name, email,
  password, and confirmation validation.
- `GoogleSignInButton.tsx` and `GoogleIcon.tsx` — AI helped with the Google
  button and icon.

### 3.4. Layout and navigation (`src/components/layout/`)

- `Header.tsx` — AI helped with the header (logo, desktop nav, credits badge).
- `BottomNav.tsx` — AI helped with the mobile bottom navigation.
- `DesktopNav.tsx` — AI helped with the inline desktop navigation.
- `navItems.tsx` — AI helped define the single source of truth for the nav tabs.
- `HamburgerMenu.tsx` — AI helped with the side drawer (account, credits,
  logout).
- `CreditsBadge.tsx` — AI helped with the credits-balance pill.

### 3.5. Design and upload flow (`src/components/ui/`)

- `UploadContext.tsx` — AI contributed significantly to the **core generation
  flow**: image/style/instructions state, generation "jobs", backend polling
  (`pollUntilDone`), object-URL management, and registering generated projects.
- `UploadArea.tsx` — AI helped with the upload area, camera/gallery choice, and
  photo capture via `getUserMedia` and canvas.
- `StyleSelector.tsx` — AI helped with the decoration-styles carousel (scroll
  and arrows).
- `CustomInstructions.tsx` — AI helped with the custom-instructions field.
- `GenerateButton.tsx` — AI helped with the generate-design button.
- `ProcessingTray.tsx` — AI helped with the processing/completed jobs tray.
- `BeforeAfterSlider.tsx` — AI helped with the interactive "before/after"
  slider using pointer events.

### 3.6. Projects and gallery

- `src/components/projects/ProjectsContext.tsx` — AI helped with the user
  projects context, backend loading, and image/furniture mapping.
- `src/components/GalleryPage.tsx` — AI contributed to the gallery page
  (search, inline title editing, furniture expansion, query-param highlight).
- `src/app/(tabs)/gallery/page.tsx` — AI helped with the gallery route.

### 3.7. Favorites

- `src/components/favorites/FavoritesContext.tsx` — AI helped with the favorites
  context, backend sync, local details cache, and the static fallback catalog.
- `src/components/MyItemsPage.tsx` — AI contributed to the favorites page (item
  grid and add-to-cart).
- `src/app/(tabs)/my-items/page.tsx` — AI helped with the favorites route.

### 3.8. Cart and checkout

- `src/components/cart/CartContext.tsx` — AI helped with the cart context, price
  parsing/formatting, and totals.
- `src/components/cart/CartCheckoutModal.tsx` — AI contributed to the
  checkout bottom-sheet/dialog (name, address, Stripe integration).
- `src/components/cart/FloatingCart.tsx` — AI helped with the floating cart
  button.
- `src/app/(tabs)/checkout/page.tsx` — AI helped with the cart payment
  verification page after the Stripe redirect.

### 3.9. Credits / tokens

- `src/components/credits/CreditsContext.tsx` — AI helped with the credits
  context, balance, and backend refresh.
- `src/components/credits/CreditsModal.tsx` — AI contributed to the credit
  package purchase menu (Stripe integration).
- `src/app/(tabs)/tokens/page.tsx` — AI helped with the token purchase
  verification page.

### 3.10. Tabs layout

- `src/app/(tabs)/layout.tsx` — AI helped compose the providers (Projects,
  Cart, Favorites, Credits) and the global elements (header, navs, modals).

### 3.11. Folder structure (Gemini)

- **Gemini** helped by suggesting a scheme for how the project folders should be
  organized — proposing the separation into `src/app` (routes), `src/lib`
  (API and utilities), and `src/components` grouped by domain (`auth`, `cart`,
  `credits`, `favorites`, `layout`, `landing`, `projects`, `ui`). This kept the
  project tidy and easy to understand. The final organization was reviewed and
  adopted manually.

### 3.12. Github Commit Messages (Gemini)

- **Gemini** helped write clear and precise commit messages, improving project readability and understanding.
---

## 4. Closing notes

- **Human review:** even though AI helped across all of the project, everything was
  reviewed, integrated, and adjusted manually to ensure consistency, correct
  behavior, and proper connection to the backend.
- **Backend integration:** the API contracts (endpoints, types) were aligned
  with Decozy's FastAPI backend.
- **AI-generated content:** the application itself uses AI at runtime to
  generate the interior redesigns, as noted in the interface ("We are not
  responsible for content generated by the AI.").

---

*Document created by AI for transparency about how AI helped during the development
of this project.*
