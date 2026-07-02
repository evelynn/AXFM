import type { Metadata } from "next";
import "./axfm-design.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "__AXFM_NAME__",
  description: "__AXFM_DESC__",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
