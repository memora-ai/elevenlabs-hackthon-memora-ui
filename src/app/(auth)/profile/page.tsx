'use client';

import { useUser } from '@auth0/nextjs-auth0/client';

export default function ProfilePage() {
  const { user, error, isLoading } = useUser();

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
      </div>
    );
  if (error) return <div className="text-red-500">{error.message}</div>;

  return (
    <div className="flex flex-col items-center gap-2">
      {user && (
        <>
          <img
            src={user.picture || ''}
            alt={user.name || ''}
            className="w-24 h-24 rounded-full"
          />
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-base">{user.email}</p>
        </>
      )}
    </div>
  );
}
