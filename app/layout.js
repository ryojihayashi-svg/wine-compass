export const metadata = {
  title: 'Beverage',
  description: 'Wine & Beverage Inventory Management',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Beverage',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#D4AF37',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;600&family=Shippori+Mincho:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: '#F6F4F0' }}>{children}</body>
    </html>
  )
}
