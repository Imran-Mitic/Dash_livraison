import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

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
    const formData = await req.formData()
    const name = formData.get('name') as string
    const file = formData.get('file') as File | null

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    if (name.length < 3) {
      return NextResponse.json(
        { error: 'Le nom doit contenir au moins 3 caractères' },
        { status: 400 }
      )
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-')

    const exists = await prisma.category.findUnique({ where: { slug } })
    if (exists) {
      return NextResponse.json(
        { error: 'Cette catégorie existe déjà' },
        { status: 409 }
      )
    }

    let imageUrl = null
    if (file && file.size > 0) {
      // Chemin pour sauvegarder l'image (par exemple, dans un dossier public/uploads)
      const uploadsDir = path.join(process.cwd(), 'public/uploads')
      await fs.mkdir(uploadsDir, { recursive: true }) // Crée le dossier s'il n'existe pas

      // Générer un nom unique pour l'image
      const fileExtension = file.name.split('.').pop()
      const fileName = `${slug}-${Date.now()}.${fileExtension}`
      const filePath = path.join(uploadsDir, fileName)

      // Convertir le File en Buffer et sauvegarder
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      await fs.writeFile(filePath, buffer)

      // Générer l'URL relative
      imageUrl = `/uploads/${fileName}`
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        ...(imageUrl && { imageUrl }),
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création:', error)
    let errorMessage = 'Erreur serveur'
    if (error instanceof Error) {
      errorMessage = error.message
    }
}
}
// PUT - Mettre à jour une catégorie
export async function PUT(req: Request) {
  try {
    const formData = await req.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const file = formData.get('file') as File | null
    const currentImageUrl = formData.get('currentImageUrl') as string | null

    if (!id || !name) {
      return NextResponse.json({ error: 'ID et nom requis' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-')

    let imageUrl = currentImageUrl || undefined
    
    // Gestion de la nouvelle image
    if (file && file.size > 0) {
      const uploadsDir = path.join(process.cwd(), 'public/uploads')
      await fs.mkdir(uploadsDir, { recursive: true })

      const fileExtension = file.name.split('.').pop()
      const fileName = `${slug}-${Date.now()}.${fileExtension}`
      const filePath = path.join(uploadsDir, fileName)

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      await fs.writeFile(filePath, buffer)

      imageUrl = `/uploads/${fileName}`
    }

    const category = await prisma.category.update({
      where: { id },
      data: { 
        name, 
        slug, 
        ...(imageUrl && { imageUrl }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    )
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