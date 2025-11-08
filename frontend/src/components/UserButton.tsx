import { UserButton as ClerkUserButton } from '@clerk/clerk-react';

export const UserButton = () => {
  return (
    <ClerkUserButton
      afterSignOutUrl="/"
      appearance={{
        elements: {
          avatarBox: 'w-8 h-8',
        },
      }}
    />
  );
};
