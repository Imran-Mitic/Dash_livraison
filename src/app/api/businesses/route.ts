// src/app/api/businesses/route.ts
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

// Helper pour uploader les images
const uploadImage = async (file: File) => {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filename = Date.now() + '_' + file.name.replace(/\s+/g, '_')
  const uploadDir = path.join(process.cwd(), 'public/uploads/businesses')
  
  try {
    await writeFile(path.join(uploadDir, filename), buffer)
    return `/uploads/businesses/${filename}`
  } catch (error: unknown) { // Correction ici
    console.error('Error uploading image:', error)
    if (error instanceof Error) { // Type guard
      throw new Error('Failed to upload image: ' + error.message)
    }
    throw new Error('Failed to upload image: An unknown error occurred.')
  }
}

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
  } catch (error: unknown) { // Correction ici
    console.error('GET Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération', details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue' }, // Type guard
      { status: 500 }
    )
  }
}

// POST - Créer un commerce/service
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const categoryId = formData.get('categoryId') as string
    const isOpen = formData.get('isOpen') === 'true'
    const file = formData.get('file') as File | null
    const adminIds = formData.getAll('adminIds') as string[]

    // Validation
    if (!name || !categoryId) {
      return NextResponse.json(
        { error: 'Nom et categoryId requis' }, 
        { status: 400 }
      )
    }

    // Upload image si elle existe
    let imageUrl = null
    if (file && file.size > 0) {
      imageUrl = await uploadImage(file)
    }

    // Création du slug
    const slug = name.toLowerCase().replace(/\s+/g, '-')

    // Vérification existence
    const exists = await prisma.business.findUnique({ where: { slug } })
    if (exists) {
      return NextResponse.json(
        { error: 'Ce commerce existe déjà' }, 
        { status: 409 }
      )
    }

    // Création du business
    const business = await prisma.business.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        categoryId,
        isOpen,
        admins: adminIds.length > 0
          ? { connect: adminIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        category: true,
        admins: true,
      }
    })

    return NextResponse.json(business, { status: 201 })

  } catch (error: unknown) { // Correction ici
    console.error('POST Error:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création',
        details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue' 
      },
      { status: 500 }
    )
  }
}

// PUT - Modifier un commerce/service
export async function PUT(req: Request) {
  try {
    const formData = await req.formData()
    
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const categoryId = formData.get('categoryId') as string
    const isOpen = formData.get('isOpen') === 'true'
    const file = formData.get('file') as File | null
    const adminIds = formData.getAll('adminIds') as string[]

    // Validation
    if (!id || !name || !categoryId) {
      return NextResponse.json(
        { error: 'ID, nom et catégorie requis' }, 
        { status: 400 }
      )
    }

    // Upload nouvelle image si elle existe
    let imageUrl = undefined
    if (file && file.size > 0) {
      imageUrl = await uploadImage(file)
    }

    // Mise à jour du business
    const updated = await prisma.business.update({
      where: { id },
      data: {
        name,
        description,
        categoryId,
        isOpen,
        ...(imageUrl && { imageUrl }),
        admins: adminIds.length > 0
          ? { 
              set: [],
              connect: adminIds.map(id => ({ id })) 
            }
          : undefined,
      },
      include: {
        category: true,
        admins: true,
      }
    })

    return NextResponse.json(updated)

  } catch (error: unknown) { // Correction ici
    console.error('PUT Error:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour',
        details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un commerce/service
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' }, 
        { status: 400 }
      )
    }

    await prisma.business.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Commerce supprimé avec succès' },
      { status: 200 }
    )

  } catch (error: unknown) { // Correction ici
    console.error('DELETE Error:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression',
        details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue' 
      },
      { status: 500 }
    )
  }
}