import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * NULL means the source does not report the nutrient and must stay null.
 * Number(null) would silently turn it into 0, a different fact.
 */
function toNutrient(value: Prisma.Decimal | null): number | null {
  return value === null ? null : value.toNumber();
}

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Foods with their nutritional profile and data source. Queried from the
   * profile side because both of its relations are required, so the result
   * never contains a food without nutrients or a profile without a source.
   */
  async findAll() {
    const profiles = await this.prisma.nutritionalProfile.findMany({
      include: { food: true, dataSource: true },
      orderBy: [{ food: { category: 'asc' } }, { food: { name: 'asc' } }],
    });

    return profiles.map((profile) => ({
      id: profile.food.id,
      name: profile.food.name,
      category: profile.food.category,
      referenceAmount: profile.referenceAmount.toNumber(),
      referenceUnit: profile.referenceUnit,
      nutrients: {
        energyKcal: toNutrient(profile.energyKcal),
        proteinG: toNutrient(profile.proteinG),
        carbohydrateG: toNutrient(profile.carbohydrateG),
        fatG: toNutrient(profile.fatG),
        fiberG: toNutrient(profile.fiberG),
        sodiumMg: toNutrient(profile.sodiumMg),
        calciumMg: toNutrient(profile.calciumMg),
        ironMg: toNutrient(profile.ironMg),
      },
      source: {
        name: profile.dataSource.name,
        version: profile.dataSource.version,
        sourceCode: profile.dataSource.sourceCode,
        sourceName: profile.dataSource.sourceName,
      },
    }));
  }
}
