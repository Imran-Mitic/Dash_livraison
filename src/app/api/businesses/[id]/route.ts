import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  // Attendre la résolution des params
  const params = await context.params;
  const { id } = params;
  const url = new URL(req.url);
  const includeSections = url.searchParams.get('includeSections') === 'true';

  console.log('Request for ID/slug:', id);
  console.log('Include sections:', includeSections);

  try {
    let business;
    // Recherche par ID ou slug
    business = await prisma.business.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
        ],
      },
      include: {
        category: true,
        admins: true,
        ...(includeSections && { menuSections: { include: { menuItems: true } } }),
      },
    });

    console.log('Business found:', business);

    if (!business) {
      return NextResponse.json(
        { error: 'Commerce non trouvé', details: `Aucun commerce trouvé pour id ou slug: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error: unknown) {
    console.error('GET by ID Error:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération',
        details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue',
      },
      { status: 500 }
    );
  }
}