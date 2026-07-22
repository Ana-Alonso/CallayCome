import { describe, test, expect } from 'vitest';
import { parse_product_info, calculate_ingredient_cost } from '../product_parser';

describe('product_parser utility', () => {
  test('parse_product_info simple cases', () => {
    expect(parse_product_info('Leche entera Hacendado brik 1 L')).toEqual({ quantity: 1000, unit: 'ml' });
    expect(parse_product_info('Arroz extra Hacendado paquete 1 kg')).toEqual({ quantity: 1000, unit: 'g' });
    expect(parse_product_info('Mantequilla pastilla 250 g')).toEqual({ quantity: 250, unit: 'g' });
    expect(parse_product_info('Bebida de avena 500 ml')).toEqual({ quantity: 500, unit: 'ml' });
  });

  test('parse_product_info pack multiplier cases', () => {
    expect(parse_product_info('Leche desnatada pack 6 x 1 l')).toEqual({ quantity: 6000, unit: 'ml' });
    expect(parse_product_info('Tomate frito Hacendado pack de 3 bricks de 390 g')).toEqual({ quantity: 1170, unit: 'g' });
    expect(parse_product_info('Zumo de naranja pack 6x200ml')).toEqual({ quantity: 1200, unit: 'ml' });
  });

  test('parse_product_info word and fallback cases', () => {
    expect(parse_product_info('Huevos camperos medianos Mercadona docena')).toEqual({ quantity: 12, unit: 'unidades' });
    expect(parse_product_info('Plátano de Canarias al peso, kg')).toEqual({ quantity: 1000, unit: 'g' });
    expect(parse_product_info('Cebollas malla 1kg')).toEqual({ quantity: 1000, unit: 'g' });
    expect(parse_product_info('Aguacate unidad')).toEqual({ quantity: 1, unit: 'unidades' });
  });

  test('calculate_ingredient_cost same units', () => {
    // Recipe: 200 ml, Package: 1000 ml (1L), Price: 0.90€
    const cost = calculate_ingredient_cost(200, 'ml', 'Leche entera', 1, 'l', 0.90);
    expect(cost).toBe(0.18);
  });

  test('calculate_ingredient_cost average weight conversions', () => {
    // Recipe: 2 huevos, Package: docena (12 uds), Price: 2.40€
    // (Both are units, so simple division: (2/12)*2.40 = 0.40)
    const cost1 = calculate_ingredient_cost(2, 'unidades', 'Huevo', 12, 'unidades', 2.40);
    expect(cost1).toBe(0.40);

    // Recipe: 2 cebollas (unidades), Package: malla 1 kg (1000 g), Price: 1.50€
    // 2 cebollas = 2 * 150g = 300g. Cost: (300/1000)*1.50 = 0.45
    const cost2 = calculate_ingredient_cost(2, 'unidades', 'Cebolla', 1, 'kg', 1.50);
    expect(cost2).toBe(0.45);

    // Recipe: 1 diente de ajo, Package: cabeza de ajos 100 g, Price: 1.20€
    // 1 diente de ajo = 5g. Cost: (5/100)*1.20 = 0.06
    const cost3 = calculate_ingredient_cost(1, 'unidades', 'Diente de ajo', 100, 'g', 1.20);
    expect(cost3).toBe(0.06);
  });
});
