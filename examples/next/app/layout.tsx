import "@hussmartinez/ui/styles.css";
import type { ReactNode } from "react";

export const metadata = { title: "@hussmartinez/ui in Next.js" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
