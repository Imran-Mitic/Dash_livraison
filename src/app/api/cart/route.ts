// src/app/api/cart/route.ts
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// 🔹 GET Cart (avec items)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 })
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        cartItems: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    return NextResponse.json(cart)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération du panier' }, { status: 500 })
  }
}

// 🔹 POST CartItem (ajouter ou incrémenter un item)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, menuItemId, quantity = 1 } = body

    if (!userId || !menuItemId) {
      return NextResponse.json({ error: 'userId et menuItemId requis' }, { status: 400 })
    }

    // Trouver ou créer le panier de l'utilisateur
    let cart = await prisma.cart.findUnique({ where: { userId } })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      })
    }

    // Vérifier si l'item existe déjà
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        menuItemId,
      },
    })

    let cartItem

    if (existingItem) {
      // Incrémenter la quantité
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      })
    } else {
      // Créer un nouvel item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId,
          quantity,
        },
      })
    }

    return NextResponse.json(cartItem)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de l\'ajout au panier' }, { status: 500 })
  }
}

// 🔹 PUT (mettre à jour la quantité d’un item)
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { cartItemId, quantity } = body

    if (!cartItemId || quantity < 1) {
      return NextResponse.json({ error: 'cartItemId requis et quantité > 0' }, { status: 400 })
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du panier' }, { status: 500 })
  }
}

// 🔹 DELETE (supprimer un item du panier)
export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { cartItemId } = body

    if (!cartItemId) {
      return NextResponse.json({ error: 'cartItemId requis' }, { status: 400 })
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    })

    return NextResponse.json({ message: 'Item supprimé du panier' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
