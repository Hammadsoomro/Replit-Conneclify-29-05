# Conneclify - Professional SMS Messaging Platform

## Overview
Conneclify is a professional SMS messaging platform built with React + Express. Features multi-tenant SMS gateway support allowing each admin to connect their own SMS provider (Twilio, SignalWire, or Telnyx).

## Current State
- **MVP Complete**: Full authentication system, admin dashboard, team management, conversations, and messaging
- **Multi-tenant SMS**: Each admin connects their own Twilio/SignalWire/Telnyx gateway
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket support for live messaging updates

## Key Features
1. **Role-based Authentication**
   - Admin accounts created via signup
   - Team member accounts created by admins in Team Management
   - Admins see full dashboard with sidebar
   - Team members see only Conversations page

2. **Multi-tenant SMS Gateway**
   - Admins connect their own SMS provider (Twilio, SignalWire, or Telnyx)
   - Team members automatically inherit admin's active gateway
   - Provider abstraction layer with factory pattern (server/sms-providers/)
   - Credentials stored securely, never exposed in API responses
   - Gateway management in Settings > Integrations

3. **Admin Dashboard**
   - Dashboard with stats overview
   - Conversations management
   - Messaging Insights with charts
   - Bought Numbers list
   - Buy Numbers from connected gateway
   - Team Management
   - Settings page with Integrations tab

4. **Messaging System**
   - Real-time conversation threads
   - WebSocket for live updates
   - Message status tracking
   - SMS sent through admin's active gateway

## Project Architecture

### Frontend (client/)
- React with TypeScript
- Wouter for routing
- Tailwind CSS + Shadcn UI
- TanStack Query for data fetching
- Theme toggle (light/dark mode)

### Backend (server/)
- Express.js
- Passport.js for authentication
- WebSocket for real-time messaging
- PostgreSQL with Drizzle ORM

### Shared (shared/)
- Schema definitions with Drizzle
- Zod validation schemas
- TypeScript types

## Test Credentials
- **Admin**: username=admin, password=admin123
- **Team**: username=sarah.wilson, password=team123
- **Team**: username=mike.chen, password=team123

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `SIGNALWIRE_PROJECT_ID` - SignalWire project ID
- `SIGNALWIRE_SPACE_URL` - SignalWire space URL
- `SIGNALWIRE_TOKEN` - SignalWire API token

## Development Commands
- `npm run dev` - Start development server
- `npm run db:push` - Push schema changes to database

## Recent Changes
- Initial MVP implementation (January 30, 2026)
- Implemented user authentication with role-based access
- Created admin dashboard with collapsible sidebar
- Added team management functionality
- Implemented conversations and messaging
- Added phone number management (bought/buy)
- Created messaging insights with charts
- Added settings page with profile management
- Multi-tenant SMS gateway implementation (February 01, 2026)
  - Added smsGateways table for per-admin gateway storage
  - Created Integrations UI with large provider cards (Twilio, SignalWire, Telnyx)
  - Built provider abstraction layer with factory pattern
  - Updated all phone number routes to use connected gateway
  - Updated message sending to use connected gateway
- Credential validation and region filter (February 01, 2026)
  - Added testConnection() method to validate gateway credentials before saving
  - Better error messages for invalid credentials (shows actual API error)
  - Buy Numbers page now has Region dropdown (like SignalWire website)
  - Country dropdown: US or Canada
  - Region dropdown: US states or Canadian provinces (dynamic based on country)
  - API supports country, region, and areaCode filters
- Conversations page improvements (February 02, 2026)
  - Added phone number dropdown at top to select which number to use for messaging
  - Dropdown shows unread message count badges per phone number
  - Contact list and chats only show after selecting a phone number
  - Contacts filtered by selected phone number (multi-tenant isolation)
  - Simplified "New" contact dialog to only Name (optional) and Phone Number
  - Auto-sync phone numbers on gateway connect
  - Phone numbers deleted when gateway disconnected (cascade delete)
- SMS Webhooks (February 02, 2026)
  - Inbound SMS webhook: `/api/webhooks/sms/inbound`
  - Status callback webhook: `/api/webhooks/sms/status`
  - Auto-creates conversations for new inbound contacts
  - Real-time WebSocket broadcast for incoming messages
  - Status updates (sent, delivered, failed) via WebSocket
  - Supports Twilio, SignalWire, and Telnyx payload formats
- Provider Improvements (February 02, 2026)
  - Enhanced Telnyx provider with 15-second timeout and detailed error handling
  - Improved createSmsProvider factory with robust credential parsing and validation
  - Better error messages for invalid or malformed credentials
  - All three providers (Twilio, SignalWire, Telnyx) now have consistent error handling
- SMS Ringtone Selection (February 02, 2026)
  - Settings > Notifications tab with 18 unique ringtone options
  - Ringtones organized by category (Classic, Modern, Soft, Bright)
  - Hover preview - plays sound when hovering over option
  - Click to select and saves preference to localStorage
  - Conversations page uses selected ringtone for incoming SMS
- Team Management Improvements (February 02, 2026)
  - 3-dot menu now functional with Reset Password and Remove Member options
  - Confirmation dialogs before destructive actions
  - Password reset sets to "password123"
  - API routes: DELETE /api/team/:id and POST /api/team/:id/reset-password
- Bought Numbers Improvements (February 02, 2026)
  - 3-dot menu now functional with Edit Name, View Details, Release Number
  - Edit Name validates input (no empty names)
  - View Details shows provider info in toast
  - Release Number directs to provider dashboard
- Multi-tenant Security Fixes (February 02, 2026)
  - All dashboard stats now scoped to admin's phone numbers (via gateway)
  - Recent Activity API scoped to admin's messages only
  - Message Insights scoped to admin's data
  - Avg Response Time calculation scoped to admin's conversations
  - Team member count scoped to admin's created users
- Phone Number Assignments (February 02, 2026)
  - Added "Assignments" option to team member 3-dot menu
  - Admins can assign phone numbers to team members
  - Each number can only be assigned to one team member
  - Team members only see their assigned numbers in Conversations dropdown
  - Multi-tenant security: Admins can only assign their own phone numbers to their own team members
- Team Member Improvements (February 03, 2026)
  - Fixed conversation visibility: team members now see all conversations for their assigned phone numbers
  - Case-insensitive username login for better UX
  - PostgreSQL session storage (replaces MemoryStore) for production readiness
  - Team member Settings page with Profile, Security, and Notifications tabs
  - Profile update API: PATCH /api/auth/profile
  - Password change API: POST /api/auth/change-password
  - Navigation bar for team members with Conversations and Settings links
  - Same real-time WebSocket support as admins (notifications, message status updates)
  - Zod validation on all new endpoints for security
  - Fixed SMS status tick real-time updates: status now broadcasts to sender's WebSocket connection
  - Fixed team member real-time SMS: inbound messages now broadcast to assigned team members
- Landing Page and Branding (February 03, 2026)
  - Created professional landing page at "/" for unauthenticated users
  - Features section highlighting platform capabilities
  - Supported providers section (Twilio, SignalWire, Telnyx)
  - Privacy Policy page at /privacy-policy
  - Terms of Service page at /terms-of-service
  - Updated branding from "social messaging" to "Professional SMS Messaging Platform"
  - Animated logo component used consistently across all pages
  - Login/signup pages link back to landing page
- Sidebar Unread Counter Fix (February 03, 2026)
  - Admin sidebar now only counts unread for unassigned conversations
  - Conversations assigned to team members excluded from admin unread count
- Team Member Ringtone Fix (February 03, 2026)
  - Added onMouseLeave handler to stop audio when cursor leaves ringtone option
  - Consistent ringtone URLs between settings pages and conversations
- Complete Theme System (February 04, 2026)
  - Added 10 complete color themes that change entire UI (sidebar, fonts, buttons, all colors)
  - Themes: Default, Ocean, Sunset, Forest, Lavender, Midnight, Cherry, Gold, Arctic, Charcoal
  - Each theme has both light and dark mode variants (20 total variations)
  - Theme automatically adapts when user toggles light/dark mode
  - Themes include custom fonts: Inter, Plus Jakarta Sans, Poppins, DM Sans, Outfit, Space Grotesk, Montserrat, Libre Baskerville, Geist, Roboto
  - lib/themes.ts contains lightVariables and darkVariables for each theme
  - applyTheme() detects current mode and applies appropriate variables
  - Appearance tab added to Settings page (both admin and team member)
  - Theme stored per-user in database (users.theme column) - persists across devices
  - Save button required to save theme changes (preview before save)
  - Theme automatically applied on login from user's database preference
  - API endpoint: PATCH /api/auth/theme to save theme preference
- SMS Ringtone Fix (February 04, 2026)
  - Updated all ringtone URLs to use working freesound.org CDN sources
  - Fixed ringtones in settings.tsx, team-settings.tsx, and conversations.tsx
  - All 18 ringtones now play correctly on hover and selection
- Landing Page Branding Update (February 04, 2026)
  - Large "Conneclify" gradient text on landing, login, and signup pages
  - "Professional SMS Messaging Platform" subtitle displayed below branding
  - Consistent gradient styling using bg-gradient-to-r from primary colors
- Team Management Enhancements (February 04, 2026)
  - Assigned phone numbers now displayed under each team member's role
  - Phone numbers shown as outline badges with phone icon
  - API /api/team returns assignedNumbers array for each member

## Webhook URLs (for SMS Provider Configuration)
Configure these URLs in your SMS provider dashboard:

**Inbound SMS (Incoming Messages):**
```
https://your-app-domain.replit.app/api/webhooks/sms/inbound
```

**Status Callbacks (Delivery Reports):**
```
https://your-app-domain.replit.app/api/webhooks/sms/status
```

Replace `your-app-domain.replit.app` with your actual deployed URL.
