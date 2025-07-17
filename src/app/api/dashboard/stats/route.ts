import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const [userCount, businessCount, categoryCount, orderCount] = await Promise.all([
    prisma.user.count(),
    prisma.business.count(),
    prisma.category.count(),
    prisma.order.count(),
  ])

  const ordersLast7Days = await prisma.order.groupBy({
    by: ['createdAt'],
    _count: { _all: true },
    orderBy: { createdAt: 'asc' },
  })

  const categories = await prisma.category.findMany({
    include: {
      businesses: {
        include: {
          orders: true,
        },
      },
    },
  })

  const ordersByCategory = categories.map((cat) => ({
    name: cat.name,
    total: cat.businesses.reduce((sum, b) => sum + b.orders.length, 0),
  }))

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      business: {
        select: {
          name: true
        }
      }
    }
  })

  const revenueResult = await prisma.order.aggregate({
    _sum: {
      total: true
    },
    _avg: {
      total: true
    }
  })

  return NextResponse.json({
    userCount,
    businessCount,
    categoryCount,
    orderCount,
    ordersLast7Days: ordersLast7Days || [],
    ordersByCategory,
    recentOrders,
    revenueStats: {
      totalRevenue: revenueResult._sum.total || 0,
      averageOrderValue: revenueResult._avg.total || 0
    }
  })
}