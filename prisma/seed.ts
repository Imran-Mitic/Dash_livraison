// prisma/seed.ts
import { OrderStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Liste de noms maliens (prénoms et noms de famille courants)
  const malianFirstNames = [
    'Amadou', 'Mariam', 'Ousmane', 'Fatoumata', 'Modibo', 'Aissata', 'Seydou', 'Kadidia',
    'Ibrahima', 'Djeneba', 'Boubacar', 'Aminata', 'Moussa', 'Zara', 'Abdoulaye', 'Hawa',
    'Sidi', 'Nana', 'Alassane', 'Kadiatou',
  ];
  const malianLastNames = [
    'Diallo', 'Traoré', 'Coulibaly', 'Sow', 'Konaté', 'Diarra', 'Cissé', 'Touré',
    'Camara', 'Doumbia', 'Sidibé', 'Keita', 'Bah', 'Sylla', 'Dembélé', 'Fofana',
    'Sanogo', 'Kanté', 'Diakité', 'Maïga',
  ];

  // Fonction pour générer un nom complet aléatoire malien
  const getRandomMalianName = () => {
    const firstName = malianFirstNames[Math.floor(Math.random() * malianFirstNames.length)];
    const lastName = malianLastNames[Math.floor(Math.random() * malianLastNames.length)];
    return `${firstName} ${lastName}`;
  };

  // Fonction pour générer un slug
  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

  // Créer des catégories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Restaurant', slug: 'restaurant' } }),
    prisma.category.create({ data: { name: 'Pharmacie', slug: 'pharmacie' } }),
    prisma.category.create({ data: { name: 'Boutique', slug: 'boutique' } }),
    prisma.category.create({ data: { name: 'Supérette', slug: 'supérette' } }),
    prisma.category.create({ data: { name: 'Livraison', slug: 'livraison' } }),
    prisma.category.create({ data: { name: 'Taxi', slug: 'taxi' } }),
  ]);

  // Créer des utilisateurs (admins et clients)
  const users = await Promise.all([
    ...Array(10).fill(null).map((_, i) => prisma.user.create({
      data: {
        email: `admin${i + 1}@cityfood.ml`,
        password: 'password123',
        name: getRandomMalianName(),
        isAdmin: i < 3, // Les 3 premiers sont admins
        phone: `+223${Math.floor(10000000 + Math.random() * 90000000)}`,
      },
    })),
    ...Array(20).fill(null).map((_, i) => prisma.user.create({
      data: {
        email: `client${i + 1}@cityfood.ml`,
        password: 'password123',
        name: getRandomMalianName(),
        phone: `+223${Math.floor(10000000 + Math.random() * 90000000)}`,
      },
    })),
  ]);

  // Créer des adresses pour les utilisateurs
  const addresses = await Promise.all(
    users.map((user) =>
      prisma.address.create({
        data: {
          street: `Rue ${Math.floor(Math.random() * 100)} ${getRandomMalianName()}`,
          city: ['Bamako', 'Ségou', 'Kayes', 'Sikasso', 'Mopti'][Math.floor(Math.random() * 5)],
          zipCode: `${Math.floor(1000 + Math.random() * 9000)}`,
          country: 'Mali',
          userId: user.id,
        },
      })
    )
  );

  // Créer des businesses (commerces/services)
  const businesses = await Promise.all([
    ...Array(5).fill(null).map((_, i) => prisma.business.create({
      data: {
        name: `Restaurant ${getRandomMalianName()}`,
        slug: generateSlug(`restaurant-${getRandomMalianName()}-${i + 1}`),
        description: `Spécialités culinaires maliennes et africaines`,
        imageUrl: `https://example.com/restaurant-${i + 1}.jpg`,
        categoryId: categories[0].id, // Restaurant
        admins: { connect: [{ id: users[Math.floor(Math.random() * 3)].id }] },
        isOpen: Math.random() > 0.2, // 80% de chance d'être ouvert
      },
    })),
    ...Array(3).fill(null).map((_, i) => prisma.business.create({
      data: {
        name: `Pharmacie ${getRandomMalianName()}`,
        slug: generateSlug(`pharmacie-${getRandomMalianName()}-${i + 1}`),
        description: `Pharmacie locale avec médicaments essentiels`,
        imageUrl: `https://example.com/pharmacie-${i + 1}.jpg`,
        categoryId: categories[1].id, // Pharmacie
        admins: { connect: [{ id: users[Math.floor(Math.random() * 3)].id }] },
        isOpen: Math.random() > 0.2,
      },
    })),
    ...Array(4).fill(null).map((_, i) => prisma.business.create({
      data: {
        name: `Boutique ${getRandomMalianName()}`,
        slug: generateSlug(`boutique-${getRandomMalianName()}-${i + 1}`),
        description: `Vêtements, artisanat et produits locaux`,
        imageUrl: `https://example.com/boutique-${i + 1}.jpg`,
        categoryId: categories[2].id, // Boutique
        admins: { connect: [{ id: users[Math.floor(Math.random() * 3)].id }] },
        isOpen: Math.random() > 0.2,
      },
    })),
    ...Array(2).fill(null).map((_, i) => prisma.business.create({
      data: {
        name: `Supérette ${getRandomMalianName()}`,
        slug: generateSlug(`supérette-${getRandomMalianName()}-${i + 1}`),
        description: `Épicerie de quartier`,
        imageUrl: `https://example.com/supérette-${i + 1}.jpg`,
        categoryId: categories[3].id, // Supérette
        admins: { connect: [{ id: users[Math.floor(Math.random() * 3)].id }] },
        isOpen: Math.random() > 0.2,
      },
    })),
    ...Array(2).fill(null).map((_, i) => prisma.business.create({
      data: {
        name: `Service ${getRandomMalianName()}`,
        slug: generateSlug(`livraison-${getRandomMalianName()}-${i + 1}`),
        description: `Livraison rapide à domicile`,
        imageUrl: `https://example.com/livraison-${i + 1}.jpg`,
        categoryId: categories[4].id, // Livraison
        admins: { connect: [{ id: users[Math.floor(Math.random() * 3)].id }] },
        isOpen: Math.random() > 0.2,
      },
    })),
    ...Array(2).fill(null).map((_, i) => prisma.business.create({
      data: {
        name: `Taxi ${getRandomMalianName()}`,
        slug: generateSlug(`taxi-${getRandomMalianName()}-${i + 1}`),
        description: `Transport urbain rapide`,
        imageUrl: `https://example.com/taxi-${i + 1}.jpg`,
        categoryId: categories[5].id, // Taxi
        admins: { connect: [{ id: users[Math.floor(Math.random() * 3)].id }] },
        isOpen: Math.random() > 0.2,
      },
    })),
  ]);

  // Créer des sections de menu pour les restaurants
  const menuSections = await Promise.all(
    businesses
      .filter((b) => b.categoryId === categories[0].id) // Seulement les restaurants
      .flatMap((business) =>
        Array(3)
          .fill(null)
          .map((_, i) =>
            prisma.menuSection.create({
              data: {
                name: ['Entrée', 'Plat Principal', 'Dessert'][i],
                businessId: business.id,
              },
            })
          )
      )
  );

  // Créer des items de menu pour les restaurants
  const menuItems = await Promise.all(
    menuSections.flatMap((section) =>
      Array(5)
        .fill(null)
        .map((_, i) =>
          prisma.menuItem.create({
            data: {
              name: [
                'Salade Malienne',
                'Poulet Yassa',
                'Riz au Gras',
                'Tô avec Sauce',
                'Beignets de Banane',
              ][i % 5],
              description: `Délicieux ${[
                'salade fraîche',
                'poulet mariné',
                'riz épicé',
                'tô traditionnel',
                'beignets sucrés',
              ][i % 5]} préparé avec amour`,
              price: [500, 2000, 1500, 1200, 300][i % 5],
              type: 'plat',
              menuSectionId: section.id,
              isAvailable: Math.random() > 0.1, // 90% de chance d'être disponible
            },
          })
        )
    )
  );

  // Créer des carts et cartItems pour quelques utilisateurs
  const carts = await Promise.all(
    users.slice(0, 5).map((user) =>
      prisma.cart.create({
        data: {
          userId: user.id,
          cartItems: {
            create: Array(Math.floor(Math.random() * 3) + 1).fill(null).map((_, i) => ({
              quantity: Math.floor(Math.random() * 3) + 1,
              menuItemId: menuItems[Math.floor(Math.random() * menuItems.length)].id,
            })),
          },
        },
      })
    )
  );

  // Créer des commandes pour quelques utilisateurs
  const orders = await Promise.all(
    users.slice(0, 5).map((user) =>
      prisma.order.create({
       data: {
          userId: user.id,
          phone: user.phone!, // Utiliser ! pour affirmer que phone n'est pas null (car créé avec une valeur)
          addressId: addresses[Math.floor(Math.random() * addresses.length)].id,
          total: Math.floor(Math.random() * 5000) + 1000,
          status: OrderStatus[
            ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'][
              Math.floor(Math.random() * 5)
            ] as keyof typeof OrderStatus
          ], //
          businessId: businesses[Math.floor(Math.random() * businesses.length)].id,
          orderItems: {
            create: Array(Math.floor(Math.random() * 3) + 1).fill(null).map((_, i) => ({
              quantity: Math.floor(Math.random() * 3) + 1,
              price: menuItems[Math.floor(Math.random() * menuItems.length)].price,
              name: menuItems[Math.floor(Math.random() * menuItems.length)].name,
            })),
          },
        },
      })
    )
  );

  console.log('Données de test insérées avec succès :');
  console.log({
    categories: categories.length,
    users: users.length,
    addresses: addresses.length,
    businesses: businesses.length,
    menuSections: menuSections.length,
    menuItems: menuItems.length,
    carts: carts.length,
    orders: orders.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });