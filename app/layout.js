import { Inter } from 'next/font/google'
import './globals.css'
import { ConfigProvider } from 'antd'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DXF Shape Editor - Professional CAD Tool',
  description: 'A professional DXF shape editor with customization tools',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1890ff',
              borderRadius: 6,
              colorBgContainer: '#ffffff',
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  )
}