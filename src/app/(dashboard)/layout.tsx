import React from 'react';

export const metadata = {
  title: "Memora",
  description: "Memora web interface",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
