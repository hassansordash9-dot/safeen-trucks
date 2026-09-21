/** Rule-based listing score (no AI). Returns 0-100 plus i18n keys for improvement tips. */
export type QualityResult = { score: number; suggestions: string[] };

type TruckInput = {
  price?: number | null;
  mileage_km?: number | null;
  horsepower?: number | null;
  engine?: string | null;
  transmission?: string | null;
  axle_configuration?: string | null;
  description?: string | null;
  whatsapp?: string | null;
  location_id?: string | null;
  imageCount: number;
};

type PartInput = {
  price?: number | null;
  part_number?: string | null;
  oem_number?: string | null;
  part_type?: string | null;
  compatible_brand_id?: string | null;
  compatible_models?: string[] | null;
  description?: string | null;
  whatsapp?: string | null;
  location_id?: string | null;
  imageCount: number;
};

function imageScore(count: number): number {
  if (count >= 5) return 25;
  if (count >= 3) return 18;
  if (count >= 1) return 10;
  return 0;
}

function descriptionScore(text: string | null | undefined): number {
  const length = text?.trim().length ?? 0;
  if (length >= 120) return 15;
  if (length >= 40) return 8;
  return 0;
}

export function scoreTruck(input: TruckInput): QualityResult {
  const suggestions: string[] = [];
  let score = 0;

  if (input.price && input.price > 0) score += 15;
  else suggestions.push('quality.addPrice');

  score += imageScore(input.imageCount);
  if (input.imageCount < 5) suggestions.push('quality.addPhotos');

  if (input.mileage_km !== null && input.mileage_km !== undefined) score += 10;
  else suggestions.push('quality.addMileage');

  if (input.location_id) score += 5;

  const specs = [input.horsepower, input.engine, input.transmission, input.axle_configuration];
  const filled = specs.filter((v) => v !== null && v !== undefined && v !== '').length;
  score += filled * 5;
  if (filled < specs.length) suggestions.push('quality.addSpecs');

  const desc = descriptionScore(input.description);
  score += desc;
  if (desc < 15) suggestions.push('quality.addDescription');

  if (input.whatsapp) score += 10;
  else suggestions.push('quality.addWhatsapp');

  return { score: Math.min(100, score), suggestions };
}

export function scorePart(input: PartInput): QualityResult {
  const suggestions: string[] = [];
  let score = 0;

  if (input.price && input.price > 0) score += 15;
  else suggestions.push('quality.addPrice');

  score += imageScore(input.imageCount);
  if (input.imageCount < 5) suggestions.push('quality.addPhotos');

  if (input.part_number || input.oem_number) score += 15;
  else suggestions.push('quality.addSpecs');

  if (input.part_type) score += 10;
  if (input.compatible_brand_id || input.compatible_models?.length) score += 10;
  if (input.location_id) score += 5;

  const desc = descriptionScore(input.description);
  score += desc;
  if (desc < 15) suggestions.push('quality.addDescription');

  if (input.whatsapp) score += 10;
  else suggestions.push('quality.addWhatsapp');

  return { score: Math.min(100, score), suggestions };
}
