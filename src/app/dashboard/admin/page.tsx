'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  ResponsiveContainer, LineChart, Line, CartesianGrid, RadialBarChart, RadialBar
} from 'recharts'
import { FiUsers, FiShoppingBag, FiPackage, FiList, FiClock } from 'react-icons/fi'

type DashboardData = {
  userCount: number
  businessCount: number
  categoryCount: number
  orderCount: number
  ordersLast7Days: { createdAt: string; _count: { _all: number } }[] | undefined
  ordersByCategory: { name: string; total: number }[]
  recentOrders: any[]
  revenueStats: {
    totalRevenue: number
    averageOrderValue: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AdminHome() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"7" | "30">("7")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch('/api/dashboard/stats') // Supprime ?period=${period}
        if (!res.ok) throw new Error('Failed to fetch data')
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, []) // Supprime period du tableau de dépendances

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  )
  
  if (!data) return <p className="text-red-500">Erreur de chargement des données.</p>

  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  // Filtrer dailyOrders localement selon period
  const dailyOrders = (data.ordersLast7Days || []).filter(order => {
    const date = new Date(order.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < parseInt(period);
  }).map((d) => {
    const date = new Date(d.createdAt)
    const day = date.getDay()
    console.log('Daily order data:', { createdAt: d.createdAt, count: d._count._all }) // Débogage
    return {
      date: daysOfWeek[day],
      count: d._count._all || 0, // Valeur par défaut si undefined
    }
  })

  const userGrowthData = [
    { name: 'Utilisateurs', value: data.userCount || 0, fill: '#6366F1' }
  ]
  
  const orderGrowthData = [
    { name: 'Commandes', value: data.orderCount || 0, fill: '#10B981' }
  ]

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord Admin</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Utilisateurs" value={data.userCount} icon={<FiUsers className="text-indigo-500" size={24} />} trend="up" />
        <StatCard label="Commerces" value={data.businessCount} icon={<FiShoppingBag className="text-green-500" size={24} />} trend="up" />
        <StatCard label="Catégories" value={data.categoryCount} icon={<FiList className="text-blue-500" size={24} />} trend="neutral" />
        <StatCard label="Commandes" value={data.orderCount} icon={<FiPackage className="text-purple-500" size={24} />} trend="up" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Croissance Utilisateurs</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart 
              innerRadius="70%" 
              outerRadius="90%" 
              data={userGrowthData}
              startAngle={180} 
              endAngle={0}
            >
              <RadialBar background={{ fill: '#eee' }} dataKey="value" />
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-2xl font-bold fill-indigo-600"
              >
                {data.userCount}
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Commandes Récentes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart 
              innerRadius="70%" 
              outerRadius="90%" 
              data={orderGrowthData}
              startAngle={180} 
              endAngle={0}
            >
              <RadialBar background={{ fill: '#eee' }} dataKey="value" />
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-2xl font-bold fill-green-600"
              >
                {data.orderCount}
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Revenu Total</p>
                <p className="text-2xl font-bold text-gray-800">
                  {(data.revenueStats?.totalRevenue || 0).toFixed(2)} FCFA
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Valeur Moyenne</p>
                <p className="text-2xl font-bold text-gray-800">
                  {(data.revenueStats?.averageOrderValue || 0).toFixed(2)} FCFA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart : commandes par jour avec filtre spécifique */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Commandes (derniers {period} jours)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis allowDecimals={false} stroke="#888" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: 'none'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#6366f1" 
                strokeWidth={2} 
                dot={{ r: 4 }}
                activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {dailyOrders.length === 0 && (
            <p className="text-center text-red-500 mt-2">Aucune donnée disponible pour cette période.</p>
          )}
        </div>

        {/* Chart : commandes par catégorie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Répartition par Catégorie</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.ordersByCategory}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="total"
                label={({ name, percent }) => percent ? `${name}: ${(percent * 100).toFixed(0)}%` : `${name}: 0%`}
              >
                {data.ordersByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: 'none'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {data.ordersByCategory.length === 0 && (
            <p className="text-center text-red-500 mt-2">Aucune donnée de catégorie disponible.</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Dernières Commandes</h2>
          <div className="flex items-center text-sm text-gray-500">
            <FiClock className="mr-1" size={16} />
            <span>Récentes</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commerce</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentOrders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id.substring(0, 8)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.business?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(order.total || 0).toFixed(2)} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, trend }: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColor = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`mt-2 flex items-center text-sm ${trendColor[trend]}`}>
          {trend === 'up' ? (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>5.2% vs hier</span>
            </>
          ) : trend === 'down' ? (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span>2.1% vs hier</span>
            </>
          ) : (
            <span>Stable</span>
          )}
        </div>
      )}
    </div>
  )
}