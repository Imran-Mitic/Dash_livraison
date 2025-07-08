// src/app/api/businesses/route.ts
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET - Liste des commerces/services
export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        category: true,
        admins: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(businesses)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 })
  }
}

// POST - Créer un commerce/service
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, description, imageUrl, categoryId, adminIds } = body

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Nom et categoryId requis' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-')

    const exists = await prisma.business.findUnique({ where: { slug } })
    if (exists) {
      return NextResponse.json({ error: 'Ce commerce existe déjà' }, { status: 409 })
    }

    const business = await prisma.business.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        categoryId,
        admins: adminIds && adminIds.length > 0
          ? {
              connect: adminIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
    })

    return NextResponse.json(business)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}

// PUT - Modifier un commerce/service
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, name, description, imageUrl, categoryId, isOpen, adminIds } = body

    if (!id || !name || !categoryId) {
      return NextResponse.json({ error: 'ID, nom et catégorie requis' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-')

    const updated = await prisma.business.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        imageUrl,
        categoryId,
        isOpen,
        admins: adminIds
          ? {
              set: [],
              connect: adminIds.map((adminId: string) => ({ id: adminId })),
            }
          : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}

// DELETE - Supprimer un commerce/service
export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    await prisma.business.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Commerce supprimé avec succès' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
