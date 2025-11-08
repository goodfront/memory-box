
## App Deployment
- This app will be deployed using **Static Export**
- This app will be a **Progressive Web App** (**PWA**) with **offline capability**

### Static Export
- Only static files—`HTML`, `CSS`, `JS`, and assets—are generated.
- No Node.js server is required; it doesn't support dynamic server-side features like API routes or Server-Side Rendering (SSR).
- From the [Next.js documentation](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports):

### **Progressive Web App** (**PWA**) with **offline capability**
- **Service Workers:** Allow web apps to intercept network requests and serve cached content when offline.
- **Web App Manifest:** Helps the app "feel" more like a native app and supports installability.
- **Caching mechanisms:** Such as the Cache API, IndexedDB, or (historically) AppCache (now deprecated).

## Task Completion Workflow

After completing a task, run the following checks and make any needed changes:
1. Run linting (ESLint)
2. Run TypeScript type checks
3. Run tests

**Important**: If an existing test is failing, do not change the test without asking first.

## Commit Messages

After finishing with the checks above, provide a commit message in the conventional commit format. **Do not try to create a commit** - just provide the commit message for the user to review.

## Running the environment

Use the docker compose setup to run the site locally
