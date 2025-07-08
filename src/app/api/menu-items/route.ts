// src/app/api/menu-items/route.ts
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET - Liste des items (optionnel : filtrer par section)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sectionId = searchParams.get("menuSectionId")

  try {
    const menuItems = await prisma.menuItem.findMany({
      where: sectionId ? { menuSectionId: sectionId } : undefined,
      include: {
        section: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(menuItems)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des items' }, { status: 500 })
  }
}

// POST - Créer un item
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, description, price, imageUrl, menuSectionId, type, isAvailable } = body

    if (!name || !price || !menuSectionId) {
      return NextResponse.json({ error: 'Nom, prix et section requis' }, { status: 400 })
    }

    const newItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price,
        imageUrl,
        menuSectionId,
        type,
        isAvailable: isAvailable ?? true,
      }
    })

    return NextResponse.json(newItem)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}

// PUT - Modifier un item
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, name, description, price, imageUrl, type, isAvailable, menuSectionId } = body

    if (!id || !name || !price || !menuSectionId) {
      return NextResponse.json({ error: 'ID, nom, prix et section requis' }, { status: 400 })
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description,
        price,
        imageUrl,
        type,
        isAvailable,
        menuSectionId,
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}

// DELETE - Supprimer un item
export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis pour suppression' }, { status: 400 })
    }

    await prisma.menuItem.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Item supprimé avec succès' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
