import { createClerkClient } from '@clerk/backend';

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required');
}

if (!process.env.CLERK_PUBLISHABLE_KEY) {
  throw new Error('CLERK_PUBLISHABLE_KEY is required');
}

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});
