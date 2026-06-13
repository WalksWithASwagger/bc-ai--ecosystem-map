import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ecosystem Intelligence - BC AI Atlas',
  description: 'Advanced analytics and insights from British Columbia\'s AI ecosystem',
};

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}