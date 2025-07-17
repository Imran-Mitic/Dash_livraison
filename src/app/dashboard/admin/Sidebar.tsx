"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FiGrid, FiBriefcase, FiShoppingCart, FiLogOut, FiUser, FiHome, FiMenu } from "react-icons/fi"

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true) // État pour ouvrir/fermer la sidebar

  // Redirection si pas connecté ou pas admin
  useEffect(() => {
    if (status === "loading") return // on attend la session

    if (!session?.user || !(session.user as any).isAdmin) {
      router.push("/login")
    }
  }, [session, status, router])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-lg flex flex-col transition-all duration-300 ${
          isOpen ? "w-72" : "w-16"
        }`}
      >
        {/* En-tête avec bouton hamburger */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h1
            className={`text-2xl font-bold text-indigo-600 transition-opacity duration-300 ${
              isOpen ? "opacity-100" : "opacity-0 overflow-hidden"
            }`}
          >
            Flash <span className="text-gray-800">Express</span>
          </h1>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-gray-600 hover:text-indigo-600 focus:outline-none"
          >
            <FiMenu size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink href="/dashboard/admin" icon={<FiHome />} isOpen={isOpen}>
            Dashboard
          </NavLink>
          <NavLink href="/dashboard/admin/categories" icon={<FiGrid />} isOpen={isOpen}>
            Catégories
          </NavLink>
          <NavLink href="/dashboard/admin/businesses" icon={<FiBriefcase />} isOpen={isOpen}>
            Businesses
          </NavLink>
          <NavLink href="/dashboard/admin/orders" icon={<FiShoppingCart />} isOpen={isOpen}>
            Commandes
          </NavLink>
        </nav>

        {session?.user && (
          <div className="p-4 border-t border-gray-100">
            <div
              className={`flex items-center space-x-3 mb-4 p-3 rounded-lg bg-gray-50 transition-all duration-300 ${
                isOpen ? "opacity-100" : "opacity-0 overflow-hidden"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <FiUser size={18} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{session.user.name || session.user.email}</p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FiLogOut size={16} />
              <span
                className={`transition-opacity duration-300 ${
                  isOpen ? "opacity-100" : "opacity-0 overflow-hidden"
                }`}
              >
                Déconnexion
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto p-6 transition-all duration-300"
        style={{
          marginLeft: 0, // Supprime la marge fixe
          width: `calc(100% - ${isOpen ? "18rem" : "4rem"})`, // Ajuste la largeur dynamiquement
        }}
      >
        {children}
        
      </main>
    </div>
  )
}

function NavLink({
  href,
  icon,
  children,
  isOpen,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group"
    >
      <span
        className={`text-gray-400 group-hover:text-indigo-600 transition-colors ${
          isOpen ? "" : "mr-0"
        }`}
      >
        {icon}
      </span>
      <span
        className={`transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 overflow-hidden"
        }`}
      >
        {children}
      </span>
    </Link>
  )
}