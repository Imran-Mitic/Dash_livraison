'use client'

import Sidebar from './Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Sidebar>{children}</Sidebar>
}
