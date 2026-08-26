import "./globals.css";

export const metadata = {
  title: "fwair.me — get in the box",
  description: "turn any twitter pfp into a plush squished into a glass box. inspired by the og fwair collection.",
  metadataBase: new URL(process.env.SITE_URL || "https://fwair.me"),
  openGraph: {
    title: "fwair.me — get in the box",
    description: "turn any twitter pfp into a plush squished into a glass box.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
