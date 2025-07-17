// src/app/api/menu-sections/route.ts
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET - Liste de toutes les sections
export async function GET() {
  try {
    const sections = await prisma.menuSection.findMany({
      include: {
        business: true,
        menuItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(sections)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des sections' }, { status: 500 })
  }
}

// POST - Créer une section
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, businessId } = body

    if (!name || !businessId) {
      return NextResponse.json({ error: 'Le nom et l\'ID du commerce sont requis' }, { status: 400 })
    }

    const newSection = await prisma.menuSection.create({
      data: {
        name,
        businessId,
      },
    })

    return NextResponse.json(newSection)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création de la section' }, { status: 500 })
  }
}

// PUT - Modifier une section
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, name, businessId } = body

    if (!id || !name || !businessId) {
      return NextResponse.json({ error: 'ID, nom et businessId requis' }, { status: 400 })
    }

    const updatedSection = await prisma.menuSection.update({
      where: { id },
      data: {
        name,
        businessId,
      },
    })

    return NextResponse.json(updatedSection)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la section' }, { status: 500 })
  }
}

// DELETE - Supprimer une section
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis pour supprimer la section' }, { status: 400 });
    }

    // Supprimer les items associés en cascade
    await prisma.menuItem.deleteMany({
      where: { menuSectionId: id },
    });

    // Supprimer la section
    await prisma.menuSection.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Section supprimée avec succès' });
  } catch (error: unknown) {
    console.error('DELETE Error:', error); // Log détaillé pour débogage
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la section', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
