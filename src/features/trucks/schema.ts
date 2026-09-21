import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const imageInputSchema = z.object({
  path: z.string().min(3).max(300),
  isPrimary: z.boolean(),
});

export const truckInputSchema = z.object({
  id: z.string().uuid().optional(),
  brandId: z.string().uuid(),
  modelId: z.string().uuid().nullish(),
  truckTypeId: z.string().uuid().nullish(),
  title: z.string().trim().min(6).max(120),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  mileageKm: z.coerce.number().int().min(0).max(5_000_000).nullish(),
  horsepower: z.coerce.number().int().min(0).max(3000).nullish(),
  engine: optionalText(60),
  transmission: z.enum(['manual', 'automatic', 'semi_automatic']).nullish(),
  axleConfiguration: optionalText(10),
  emissionClass: optionalText(20),
  condition: z.enum(['new', 'used']),
  color: optionalText(30),
  price: z.coerce.number().min(0).max(100_000_000),
  currency: z.enum(['USD', 'IQD']),
  negotiable: z.boolean(),
  description: optionalText(4000),
  locationId: z.string().uuid(),
  phone: z.string().trim().min(7).max(25),
  whatsapp: optionalText(25),
  dealerId: z.string().uuid().nullish(),
  images: z.array(imageInputSchema).max(12),
  publish: z.boolean(),
});

export type TruckInput = z.infer<typeof truckInputSchema>;

export const partInputSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  title: z.string().trim().min(4).max(120),
  brand: optionalText(60),
  partNumber: optionalText(60),
  oemNumber: optionalText(60),
  condition: z.enum(['new', 'used', 'rebuilt']),
  partType: z.enum(['original', 'aftermarket']).nullish(),
  compatibleBrandId: z.string().uuid().nullish(),
  compatibleModels: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  price: z.coerce.number().min(0).max(100_000_000),
  currency: z.enum(['USD', 'IQD']),
  negotiable: z.boolean(),
  description: optionalText(4000),
  locationId: z.string().uuid(),
  phone: z.string().trim().min(7).max(25),
  whatsapp: optionalText(25),
  dealerId: z.string().uuid().nullish(),
  images: z.array(imageInputSchema).max(12),
  publish: z.boolean(),
});

export type PartInput = z.infer<typeof partInputSchema>;
