import React from 'react';
import ResearchNavigation from '@/components/ResearchNavigation';

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <ResearchNavigation />
      <main>{children}</main>
    </div>
  );
}