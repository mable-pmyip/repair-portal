# Repair Portal - Frontend

React-based frontend application for the Repair Portal system.

## Tech Stack

- **React 18** - UI library
- **React Router** - Client-side routing
- **Firebase SDK** - Authentication and data access
- **Vite** - Build tool and dev server
- **CSS** - Styling

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/           # Page-level components
│   ├── utils/           # Helper functions and utilities
│   ├── firebase.ts      # Firebase configuration
│   ├── App.jsx          # Main application component
│   └── main.jsx         # Application entry point
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
└── vite.config.js       # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Firebase project configured

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Firebase:
   - Update `src/firebase.ts` with your Firebase project credentials
   - Ensure Authentication, Firestore, and Storage are enabled

3. Start development server:
   ```bash
   npm run dev
   ```
   The app will run at `http://localhost:5173`

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview production build:
   ```bash
   npm run preview
   ```

## Available Scripts

- `npm run dev` - Start Vite development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)

## Environment Variables

Create a `.env` file for environment-specific configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

## Key Features

### Authentication
- Email/password login
- Password reset flow
- Force password change on first login
- Session management

### User Interface
- Repair request submission form
- Image upload functionality
- Request tracking
- Language switcher (EN/繁體中文)

### Admin Panel
- User management dashboard
- Repair requests overview
- CSV data export
- User history tracking

## Development Notes

- Uses Firebase SDK v9+ modular syntax
- Responsive design for mobile and desktop
- Client-side routing with React Router
- State managed locally with React hooks

## Deployment

Deploy to Firebase Hosting:

```bash
npm run build
firebase deploy --only hosting
```

Or deploy to other static hosting providers (Vercel, Netlify, etc.) by pointing to the `dist` folder after build.
