import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerX | Your Future. Your Path.",
  description: "A clearer way to explore what comes next.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body>{children}</body>
    </html>
  );
}
