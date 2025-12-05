# Portfolio Website - Farley

## Overview

A professional portfolio website for Farley, a Full-Stack Developer and Software Engineer. The site features a minimalist, dark theme inspired by SpaceX/tech aesthetics, showcasing projects, experience, tech stack, and providing a contact interface.

## Recent Changes (December 2025)

- Complete redesign with SpaceX-inspired dark theme
- New minimalist UI with terminal-style hero section
- Professional color scheme with cyan accents (#00d4ff)
- JetBrains Mono for code/headings, Inter for body text
- Simplified JavaScript for navigation and contact form
- Removed old carousel system in favor of card-based project grid

## User Preferences

- Preferred communication style: Simple, everyday language
- Design preference: Minimalist, professional, dark theme
- Style inspiration: SpaceX programmer aesthetic

## System Architecture

### Frontend Architecture

**Technology Stack**: Vanilla HTML, CSS, and JavaScript with no frontend frameworks.

**Design Theme**: Dark mode with professional SpaceX-inspired aesthetics
- Primary background: #0a0a0a (near black)
- Accent color: #00d4ff (cyan)
- Typography: JetBrains Mono (monospace) and Inter (sans-serif)
- Subtle grid background and noise texture overlay

**Key Components**:
- **Navigation** (`assets/main.js`): Fixed navbar with smooth scrolling and mobile hamburger menu
- **Hero Section**: Terminal-style code display with animated cursor
- **Project Cards**: Grid layout with status indicators (Production/Development)
- **Timeline**: Experience section with vertical timeline
- **Contact Form**: Async submission with visual feedback

**Styling Approach** (`assets/style.css`):
- CSS custom properties for consistent theming
- Responsive grid layouts
- Smooth transitions and animations
- Mobile-first responsive design

### Backend Architecture

**Technology**: Python 3 with built-in `http.server` module (`server.py`)

**Contact API** (`/api/contact`):
- Accepts POST requests with JSON payload (name, email, message)
- Server-side validation (required fields, email format)
- Dual persistence: saves to JSON file + attempts email via Resend API
- Graceful degradation if email service fails

**Security Features**:
- No-cache headers on all responses
- Input sanitization with HTML escaping
- Email format validation

### Data Storage

**Contact Submissions**: File-based JSON storage (`contacts.json`)

### Email Integration

**Service**: Resend API via Replit integration
- Best-effort email delivery
- Errors logged but don't block form submission

## External Dependencies

### Python Packages
- `requests`: HTTP library for Resend API
- `resend`: Resend SDK

### Fonts
- **Google Fonts**: JetBrains Mono, Inter
  - Preconnected for performance

### Meta Integration
- Twitter/X cards (`@gomezfy_`)
- Open Graph protocol for link previews

## File Structure

```
/
├── index.html          # Main HTML page
├── assets/
│   ├── style.css       # Main stylesheet (dark theme)
│   ├── main.js         # Navigation and contact form JS
│   ├── farley-profile.jpeg
│   ├── sheriff-rex.png
│   ├── emoji-size-logo.png
│   └── orbital-bot-logo.png
├── server.py           # Python HTTP server with contact API
├── pyproject.toml      # Python dependencies
└── replit.md           # This documentation
```
