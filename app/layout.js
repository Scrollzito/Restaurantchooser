export const metadata = {
  title: "Where Should We Eat?",
  description: "Restaurant chooser for Lisboa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0d0d0d" }}>{children}</body>
    </html>
  );
}
