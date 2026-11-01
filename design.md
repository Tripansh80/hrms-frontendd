# AI-First HRMS --- Front Page Design Specification

**Document:** `design.md`\
**Product type:** Multi-tenant, AI-first Human Resource Management
System\
**Primary goal:** Make the product feel like an AI HRMS first---not a
traditional HR dashboard with an AI feature added later.\
**Audience:** HR teams, managers, employees, and organizations
evaluating the product.

------------------------------------------------------------------------

## 1. Design direction

Build a polished, modern SaaS landing/front page that communicates one
clear idea:

> **Your HR team, powered by AI.** Manage people, attendance, leave,
> hiring, documents, approvals, and HR insights from one
> workspace---with an AI assistant woven throughout the experience.

### Visual principles

-   **AI-first everywhere:** AI should appear in the hero, navigation,
    feature cards, product preview, workflow examples, and calls to
    action. Avoid repeating the same generic "AI-powered" badge without
    explaining what AI actually does.
-   **Premium SaaS aesthetic:** Clean layouts, generous whitespace,
    crisp typography, subtle gradients, refined borders, and restrained
    shadows.
-   **Trustworthy and practical:** HR data is sensitive. The page should
    communicate role-based access, tenant isolation, confirmation before
    sensitive actions, and auditable changes.
-   **Responsive by default:** Design mobile-first behavior as well as
    wide desktop layouts.
-   **Accessible:** Strong contrast in both themes, visible keyboard
    focus, semantic headings, reduced-motion support, and controls with
    accessible labels.

## 2. Technology and implementation expectations

Use the existing application stack where possible:

-   **Next.js + React + TypeScript**
-   **Tailwind CSS**
-   **shadcn/ui** for buttons, cards, badges, tabs, accordions,
    dropdowns, tooltips, and theme controls
-   **Framer Motion** using `motion.div` for restrained entrance
    animations, hover transitions, and scroll reveals
-   **next-themes** (or the application's existing theme provider) for
    persistent light/dark/system theme selection
-   **Lucide icons** for consistent feature iconography

Do not build a separate custom component library if shadcn/ui already
covers the need. Reuse project tokens and components.

## 3. Page structure

### A. Sticky navigation

**Left:** Product mark + name, e.g. `PeoplePilot AI` (placeholder brand;
replace with final product name).

**Middle links:** - Platform - AI HR Assistant - Features - Security -
Pricing (only if pricing is available)

**Right:** - Theme toggle: Light / Dark / System - `Log in` secondary
action - `Get started` primary action

**Behavior** - Sticky with a subtle backdrop blur after scrolling. -
Mobile menu opens in a shadcn `Sheet` or accessible dropdown. - The AI
HR Assistant link should be visually prominent but not overpower the
main CTA. - Do not show a pricing link if no real pricing page exists.

### B. Hero --- AI HRMS is the headline

The hero must establish AI-first positioning within the first screen.

**Eyebrow:** `AI-FIRST HUMAN RESOURCE MANAGEMENT`

**Headline option:** \> Meet your new **AI HRMS**.

**Supporting copy:** \> From hiring and attendance to leave, documents,
and approvals---manage your people operations with an AI assistant that
helps your team get work done, securely.

**Primary CTA:** `Explore AI HRMS`\
**Secondary CTA:** `See how it works`

**Trust line:**
`Built for HR teams, managers, and employees · Role-aware access · Human-confirmed sensitive actions`

**Visual** - Place a large product UI preview to the right on desktop
and beneath the copy on mobile. - The preview should show a believable
HR workspace, not an abstract robot illustration. - Include a clearly
visible AI assistant panel with prompt examples such as: - "Show pending
leave approvals" - "What is my remaining leave balance?" - "Start an
employee onboarding workflow" - "Summarize this month's attendance" -
Include small contextual AI indicators on the dashboard cards, e.g. "AI
summary", "Suggested next step", or "Needs review". - Avoid fake
customer logos, made-up user counts, or unverified performance claims.

### C. AI assistant spotlight

**Section label:** `MEET YOUR AI HR ASSISTANT`

**Headline:** \> Ask. Review. Approve. Done.

**Copy:** \> Use natural language to navigate HR tasks. The assistant
understands the request, checks permissions and policy rules, and asks
for confirmation before sensitive actions.

Show a chat mockup with a short sample exchange:

-   **User:** "Show leave requests waiting for my approval."
-   **AI:** "You have 4 requests awaiting review."
-   **User:** "Approve Priya's request for 12--13 November."
-   **AI:** "I found the request. Confirm approval for 12--13 November?"

Add a clear note:
`Sensitive actions require confirmation. Every permitted action is validated and recorded.`

**Suggested interaction** - Use shadcn `Card`, `Badge`, `Avatar`, and
`Button`. - A demo prompt chip may populate the example input. If no
backend is connected, label it as a demo and do not imply that a real HR
action was executed. - Do not let the marketing demo perform real
employee or leave mutations.

### D. Feature overview

**Section label:** `ONE WORKSPACE. EVERY HR WORKFLOW.`

**Headline:** \> The essentials of HR, with AI built in.

Use a responsive grid of feature cards. Each card needs a short
outcome-focused description, a relevant icon, and an AI-related detail
where genuinely applicable.

1.  **AI HR Assistant**
    -   Natural-language HR requests, employee lookup within
        permissions, leave-balance checks, and pending-approval
        summaries.
    -   AI can initiate supported workflows; sensitive actions require
        confirmation and server-side authorization.
2.  **Employee Management**
    -   Employee profiles, departments, locations, managers, reporting
        hierarchy, employment history, and account invitations.
    -   AI assistance: find authorized employee records and summarize
        permitted information.
3.  **Attendance & Time**
    -   Check-in/check-out, work-hour summaries, attendance corrections,
        and absence tracking based on configured schedules.
    -   AI assistance: summarize attendance patterns and help surface
        records that need review. Avoid making unsupported claims about
        biometric tracking.
4.  **Leave Management**
    -   Leave types, balances, requests, approvals, cancellations, and
        holiday-aware validation.
    -   AI assistance: check balances, explain the next step, and
        surface pending approvals.
5.  **Recruitment & Hiring**
    -   Job openings, candidates, applications, interview stages,
        feedback, offers, and conversion of a hire into an employee.
    -   AI assistance: help organize candidate information and summarize
        feedback. Do not claim autonomous hiring decisions.
6.  **Approvals & Workflows**
    -   Configurable approval steps, conditions, deadlines,
        notifications, escalations, and task tracking.
    -   AI assistance: help users understand pending tasks and trigger
        supported workflow actions with authorization.
7.  **Documents & Policies**
    -   Uploads, verification, policy versions, acknowledgements, and
        expiry reminders.
    -   AI assistance can be described as a future capability only where
        OCR/classification is not yet implemented.
8.  **Reports & Insights**
    -   Headcount, attendance, leave, and attrition reporting with CSV
        export.
    -   AI assistance: plain-language summaries of available metrics,
        clearly grounded in the underlying data.
9.  **Bulk Import & Setup**
    -   CSV/XLSX imports with progress indicators and row-level errors,
        plus departments, locations, schedules, and holidays.
    -   AI may help explain import errors, if implemented; otherwise
        present this as a future enhancement.
10. **Security & Audit**
    -   Role-based access control, tenant isolation, audit trails, and
        controlled access to sensitive employee information.
    -   AI operates within the same authorization boundaries as the
        signed-in user.

Use a consistent icon size, title hierarchy, card padding, and hover
treatment. Keep descriptions concise and avoid overloading cards with
feature checklists.

### E. "AI in every workflow" strip

Create a visually distinct horizontal section that shows how AI
complements the product without replacing policy or human judgment.

Show four steps: 1. **Ask** --- Describe the HR task in natural
language. 2. **Understand** --- The assistant interprets the request and
checks the user's context. 3. **Confirm** --- The user reviews sensitive
changes before they happen. 4. **Track** --- Authorized actions are
processed and recorded.

Use `motion.div` for a gentle staggered reveal. On small screens, stack
steps vertically. Respect reduced-motion settings.

### F. Role-based value section

Use three tabs or cards:

-   **For HR teams:** Manage employee records, recruitment, documents,
    reporting, and workflows in one place.
-   **For managers:** Review leave requests, see pending approvals, and
    understand team attendance within their access.
-   **For employees:** Check leave balances, request leave, check in/out
    where enabled, and find relevant HR information.

Each panel should include a small UI mockup or list of relevant actions.
Make clear that available actions depend on permissions and enabled
modules.

### G. Security and trust section

**Headline:** \> Helpful AI. Clear boundaries.

Show concise trust principles: - **Permission-aware:** The assistant
only accesses information and actions allowed for the signed-in user. -
**Human confirmation:** Confirm sensitive actions such as approving
leave or creating employee records. - **Auditable workflows:** Keep a
trace of permitted actions and approvals. - **Tenant separation:** Keep
each organization's data isolated. - **Policy validation:** Validate
requests on the server; never trust AI output as authorization.

Only display controls and certifications that are actually implemented.
Do not claim certifications such as SOC 2 or ISO 27001 unless verified.

### H. Final CTA

**Headline:** \> Ready to make HR feel effortless?

**Copy:** \> Bring people, processes, and AI assistance into one secure
HR workspace.

**Primary CTA:** `Get started`\
**Secondary CTA:** `Explore the features`

The primary CTA should lead to the real sign-up or onboarding route. If
sign-up is not ready, use a truthful alternative such as
`Request a demo`.

### I. Footer

Include: - Product name and short positioning statement - Platform /
Features - Security - Help / Contact (only if real destinations exist) -
Privacy policy and terms (only if published) - Theme control may remain
available in the header; avoid duplicate controls unless useful -
Current year generated dynamically

------------------------------------------------------------------------

## 4. Theme system: light and dark

Provide three options where supported: **Light**, **Dark**, and
**System**. Persist the user's selection and avoid a flash of the wrong
theme on page load.

### Token guidance

Use CSS variables compatible with shadcn/ui. Keep colors semantic rather
than hardcoding colors across individual components.

**Light theme** - Page background: near-white, slightly warm or
neutral - Surface: white - Main text: deep slate/near-black - Secondary
text: muted slate - Borders: soft neutral gray - Primary accent:
indigo/violet or blue-violet - AI accent: a restrained violet-to-blue
gradient used only for AI-specific highlights

**Dark theme** - Page background: deep navy/charcoal, not pure black -
Surface: slightly lighter charcoal/navy - Main text: off-white -
Secondary text: muted cool gray - Borders: low-contrast slate - Primary
accent: brighter indigo/violet with accessible contrast - AI accent:
subtle violet/blue glow; avoid excessive neon and large glowing surfaces

### Theme behavior

-   Use shadcn's theme-aware classes and CSS variables.
-   Ensure text, borders, icons, charts, popovers, dialogs, and focus
    rings remain legible in both themes.
-   The product preview must also switch themes; do not leave a bright
    mockup inside dark mode unless it is intentionally presented as a
    separate embedded app.
-   Check contrast for small text and interactive states.
-   Avoid using color as the only way to communicate status.

------------------------------------------------------------------------

## 5. Motion and interaction guidelines

Use Framer Motion `motion.div` sparingly to make the page feel
responsive and premium.

**Recommended** - Hero copy: fade + small upward movement on initial
load. - Product preview: subtle fade/scale entrance. - Feature cards:
staggered reveal when entering the viewport. - Buttons: small hover/tap
scale or color transition. - AI workflow steps: gentle sequential
reveal. - Chat demo: optional typing indicator only if the interaction
is clearly a demo.

**Avoid** - Constant floating or pulsing on every AI badge. - Large
parallax effects, distracting animated gradients, and scroll-jacking. -
Animating long text blocks in ways that reduce readability. - Motion
that prevents keyboard users from understanding the page.

Use `useReducedMotion` or an equivalent reduced-motion preference. When
reduced motion is enabled, disable movement-based animation and keep
content immediately visible. Never make content inaccessible while
waiting for an animation.

Example pattern:

``` tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.2 }}
  transition={{ duration: 0.45, ease: "easeOut" }}
>
  {/* Section content */}
</motion.div>
```

Adapt imports and APIs to the installed Framer Motion version. This is a
design example, not a complete page implementation.

------------------------------------------------------------------------

## 6. shadcn/ui component mapping

  -----------------------------------------------------------------------
  UI area                             Suggested components
  ----------------------------------- -----------------------------------
  Navigation / mobile menu            `Button`, `Sheet`,
                                      `NavigationMenu`, `DropdownMenu`

  Theme selector                      `DropdownMenu`, `Button`, `Sun`,
                                      `Moon`, `Monitor` icons

  Hero labels                         `Badge`, `Button`

  Product preview                     `Card`, `Tabs`, `Avatar`,
                                      `Progress`, `Separator`, `Tooltip`

  AI chat demo                        `Card`, `Textarea` or `Input`,
                                      `Button`, `Avatar`, `Badge`

  Feature cards                       `Card`, `CardHeader`, `CardTitle`,
                                      `CardDescription`, `CardContent`

  Role-based content                  `Tabs`, `TabsList`, `TabsTrigger`,
                                      `TabsContent`

  FAQ (if included)                   `Accordion`

  Final CTA                           `Button`, `Card`

  Mobile navigation                   `Sheet`, `SheetContent`,
                                      `SheetTrigger`
  -----------------------------------------------------------------------

Confirm the actual component exports and file paths in the project
before implementation.

------------------------------------------------------------------------

## 7. Content and product accuracy

The landing page should distinguish **available now** from **planned**
functionality.

### Phase 1 / MVP feature areas in the current plan

-   Authentication, invitations, and password reset
-   Employee management
-   Attendance and attendance corrections
-   Leave management and approvals
-   Recruitment pipeline and interview feedback
-   Configurable workflows and notifications
-   Documents and policies
-   AI assistant for supported, permission-checked intents
-   Reports and CSV export
-   Organization settings, bulk imports, audit logs, and tenant
    isolation

### Planned / Phase 2 areas --- do not market as live until built

-   SAML/OIDC SSO, MFA, and SCIM
-   Shift/roster planning, shift swaps, and overtime
-   Advanced ATS automation and careers pages
-   AI resume scoring suggestions
-   Calendar integrations
-   OCR and document classification
-   Visual workflow builder with advanced orchestration
-   Advanced compliance and BI capabilities
-   More advanced multi-turn AI agent and policy Q&A

### Not specified as included in the current plan

Do not advertise payroll, payslips, tax filing, expense claims,
performance appraisals, OKRs, benefits administration, or native mobile
apps unless product scope is updated.

Never present illustrative metrics, customer logos, testimonials,
security certifications, or AI success rates as factual.

------------------------------------------------------------------------

## 8. Responsive layout guidance

-   **Desktop (1280px+):** Wide hero split layout, 3-column feature
    grid, ample whitespace.
-   **Tablet (768--1279px):** Compact hero, 2-column feature grid,
    navigation links may collapse.
-   **Mobile (\<768px):** Stacked hero, full-width CTAs, one-column
    feature cards, horizontally scrollable tabs only if accessible, menu
    in a `Sheet`.
-   Keep content width readable (roughly 1120--1200px maximum) and use
    consistent horizontal padding.
-   Avoid horizontal overflow in the dashboard preview and AI chat
    mockup.

------------------------------------------------------------------------

## 9. Accessibility and quality checklist

-   [ ] All interactive elements work with keyboard and show visible
    focus.
-   [ ] Theme control has an accessible name and exposes the selected
    option.
-   [ ] Heading levels follow a logical hierarchy.
-   [ ] Decorative icons are hidden from screen readers; meaningful
    icons have labels.
-   [ ] Color contrast meets WCAG AA targets where applicable.
-   [ ] Reduced-motion preference is honored.
-   [ ] Feature claims match implemented functionality.
-   [ ] No real employee data appears in screenshots or mockups.
-   [ ] AI demo clearly indicates when responses are illustrative.
-   [ ] Mobile layout has no clipping or horizontal scrolling.
-   [ ] Light and dark themes are tested across every section.
-   [ ] Primary CTAs point to valid routes.
-   [ ] Loading, empty, error, and focus states are considered for
    interactive demos.

------------------------------------------------------------------------

## 10. Definition of done

The front page is ready when: 1. AI-first positioning is unmistakable
from the hero and repeated meaningfully throughout the page. 2. Visitors
can understand the major HRMS modules without reading dense paragraphs.
3. The AI assistant is shown in realistic, permission-aware
workflows---not as an unrestricted chatbot. 4. Light, dark, and system
themes work consistently and persist. 5. `motion.div` animations are
subtle, performant, and reduced-motion friendly. 6. shadcn/ui components
are used consistently with the existing project setup. 7. The page works
on mobile, tablet, and desktop. 8. No planned feature, security
certification, or product metric is falsely represented as already
available.
