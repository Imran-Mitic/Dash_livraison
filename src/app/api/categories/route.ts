// src/app/api/categories/route.ts
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET - Liste des catégories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 })
  }
}

// POST - Créer une nouvelle catégorie
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, imageUrl } = body

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-')

    const exists = await prisma.category.findUnique({ where: { slug } })
    if (exists) {
      return NextResponse.json({ error: 'Cette catégorie existe déjà' }, { status: 409 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        ...(imageUrl && { imageUrl }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}

// PUT - Mettre à jour une catégorie
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, name, imageUrl } = body

    if (!id || !name) {
      return NextResponse.json({ error: 'ID et nom requis' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-')

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, ...(imageUrl && { imageUrl }), },
    })

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}

// DELETE - Supprimer une catégorie
export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Catégorie supprimée avec succès' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
