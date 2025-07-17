import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

// ✅ GET : Récupérer les administrateurs
export async function GET() {
  try {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    })

    return NextResponse.json(admins)
  } catch (error) {
    console.error('Erreur GET /api/admins', error)
    return NextResponse.json({ error: 'Erreur de récupération des admins' }, { status: 500 })
  }
}

// ✅ POST : Créer un nouvel administrateur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, phone } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
    }

    const newAdmin = await prisma.user.create({
      data: {
        email,
        password, // ⚠️ en prod : hasher avec bcrypt
        name,
        phone,
        isAdmin: true,
      },
    })

    return NextResponse.json(newAdmin)
  } catch (error) {
    console.error('Erreur POST /api/admins', error)
    return NextResponse.json({ error: 'Erreur de création de l\'admin' }, { status: 500 })
  }
}

// ✅ PUT : Modifier un administrateur
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, phone } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const updatedAdmin = await prisma.user.update({
      where: { id },
      data: { name, phone },
    })

    return NextResponse.json(updatedAdmin)
  } catch (error) {
    console.error('Erreur PUT /api/admins', error)
    return NextResponse.json({ error: 'Erreur de mise à jour' }, { status: 500 })
  }
}

// ✅ DELETE : Supprimer un administrateur
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ message: 'Admin supprimé avec succès' })
  } catch (error) {
    console.error('Erreur DELETE /api/admins', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
