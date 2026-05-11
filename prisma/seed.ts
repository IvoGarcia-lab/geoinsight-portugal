import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Indicators
  const popTotal = await prisma.indicator.upsert({
    where: { code: 'pop_total' },
    update: {},
    create: {
      code: 'pop_total',
      namePt: 'População',
      unit: 'inhabitants',
      category: 'Demografia',
    },
  });

  const desemprego = await prisma.indicator.upsert({
    where: { code: 'taxa_desemprego' },
    update: {},
    create: {
      code: 'taxa_desemprego',
      namePt: 'Taxa de Desemprego',
      unit: '%',
      category: 'Economia',
    },
  });

  const pib = await prisma.indicator.upsert({
    where: { code: 'pib_per_capita' },
    update: {},
    create: {
      code: 'pib_per_capita',
      namePt: 'PIB per capita',
      unit: '€',
      category: 'Economia',
    },
  });

  const esperancaVida = await prisma.indicator.upsert({
    where: { code: 'esperanca_vida' },
    update: {},
    create: {
      code: 'esperanca_vida',
      namePt: 'Esperança de Vida',
      unit: 'years',
      category: 'Saúde',
    },
  });

  // 2. Create sample Region (NUTS II - Norte)
  const norte = await prisma.region.upsert({
    where: { nutsCode: 'PT11' },
    update: {},
    create: {
      nutsCode: 'PT11',
      name: 'Norte',
      level: 'NUTS II',
    },
  });

  // 3. Insert some DataPoints
  const years = [2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024];
  
  for (const year of years) {
    await prisma.dataPoint.upsert({
      where: {
        regionId_indicatorId_year: {
          regionId: norte.id,
          indicatorId: popTotal.id,
          year: year,
        }
      },
      update: {},
      create: {
        regionId: norte.id,
        indicatorId: popTotal.id,
        year: year,
        value: 3600000 + Math.random() * 100000,
      }
    });

    await prisma.dataPoint.upsert({
      where: {
        regionId_indicatorId_year: {
          regionId: norte.id,
          indicatorId: desemprego.id,
          year: year,
        }
      },
      update: {},
      create: {
        regionId: norte.id,
        indicatorId: desemprego.id,
        year: year,
        value: 12 - (year - 2010) * 0.5 + Math.random(),
      }
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
