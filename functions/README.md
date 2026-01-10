# Repair Portal - Firebase Functions

Backend serverless functions for the Repair Portal application.

## Tech Stack

- **Firebase Cloud Functions** - Serverless compute
- **Node.js** - Runtime environment
- **Firebase Admin SDK** - Backend Firebase access
- **TypeScript/JavaScript** - Programming language

## Project Structure

```
functions/
├── src/              # Source code (if using TypeScript)
├── index.js          # Main functions entry point
├── package.json      # Dependencies and scripts
└── .eslintrc.js      # ESLint configuration
```

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Firebase CLI installed globally
- Firebase project initialized

### Installation

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Login to Firebase:
   ```bash
   firebase login
   ```

4. Select your Firebase project:
   ```bash
   firebase use --add
   ```

### Development

1. Run functions locally with Firebase Emulator:
   ```bash
   npm run serve
   ```
   or
   ```bash
   firebase emulators:start --only functions
   ```

2. View logs:
   ```bash
   firebase functions:log
   ```

### Deployment

Deploy all functions:
```bash
npm run deploy
```

Or deploy specific function:
```bash
firebase deploy --only functions:functionName
```

## Available Scripts

- `npm run serve` - Start local emulator for testing
- `npm run deploy` - Deploy functions to Firebase
- `npm run logs` - View function logs
- `npm run shell` - Interactive functions shell

## Function Types

### HTTP Functions
- REST API endpoints
- Webhook handlers
- Scheduled tasks

### Background Functions (Triggers)
- **Firestore Triggers**: React to database changes
- **Auth Triggers**: Handle user creation/deletion
- **Storage Triggers**: Process uploaded files

## Environment Configuration

Set environment variables using Firebase Functions config:

```bash
# Set a config value
firebase functions:config:set someservice.key="THE API KEY"

# Get config values
firebase functions:config:get

# Use in code
const config = functions.config();
const apiKey = config.someservice.key;
```

Or use `.env` files with Firebase Functions (Gen 2):

```env
API_KEY=your_api_key_here
```

## Security

- Functions automatically have admin privileges
- Use Firebase Admin SDK for secure database access
- Validate all input data
- Implement proper error handling
- Use CORS for HTTP functions if needed

## Common Functions

### User Management
- Create user accounts
- Update user profiles
- Handle user authentication events

### Data Processing
- Process repair requests
- Generate reports
- Send notifications

### Scheduled Tasks
- Cleanup old data
- Generate periodic reports
- Send reminders

## Debugging

1. Check function logs in Firebase Console
2. Use `console.log()` for debugging
3. Test locally with emulators before deploying
4. Monitor function performance and errors

## Best Practices

- Keep functions small and focused
- Use async/await for asynchronous operations
- Handle errors gracefully
- Set appropriate timeout and memory limits
- Use Cloud Firestore transactions for data consistency
- Implement retry logic for external API calls

## Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Cloud Functions Samples](https://github.com/firebase/functions-samples)
