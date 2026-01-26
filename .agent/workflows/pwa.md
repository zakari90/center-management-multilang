---
description:
---

# Agent Behavior & Development Rules (Web-Only)

## 1. Core Tech Stack (2026 Standards)

- Framework: Next.js 15+ (App Router). Use Server Components for data fetching and Client Components only for interactivity.
- Styling: Tailwind CSS for a mobile-first, responsive design.
- Validation: Zod for strict input sanitization and schema-based data handling.
- Icons: Lucide-React for consistent, accessible visual cues.

## 2. Code Quality & Readability

- Prioritize Clarity: Write clean, readable code. Avoid "clever" shortcuts, one-liners, or obfuscated logic.
- Self-Documenting: Use descriptive variable and function names (e.g., `gravityCalculationResult` instead of `gRes`).
- Modularity: Extract complex business logic into dedicated utility files or custom hooks. Keep `page.tsx` files clean and focused on layout.
- Input Security: Every user input must be sanitized and validated using Zod before it touches the application state or logic.

## 3. Non-Tech User Experience (UX)

- Intuitive Design: Build for non-technical users. Use large buttons, generous spacing, and clear typography.
- Plain Language: Eliminate technical jargon. Use "Gravity Strength" instead of "Gravitational Constant" and "Power" instead of "Newtons."
- Visual Feedback: Every click must result in immediate visual feedback (loading states, success animations, or clear error messages).
- Accessibility (A11y): Follow WCAG 2.1 AA standards. Ensure high contrast, proper aria-labels, and logical tab ordering for keyboard users.

## 4. Operational Guardrails

- Planning Phase: Always present a high-level logic plan before writing code to ensure the proposed solution meets the "clean code" requirement.
- Robust Error Handling: Never show raw code errors to the user. Provide friendly, actionable advice if something goes wrong.
- Performance: Optimize for "Core Web Vitals" by minimizing client-side JavaScript and utilizing Next.js built-in image and font optimizations.
