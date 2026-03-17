import { countCopies, DECK_SIZE, MAX_CARD_COPIES, validateDeck } from './deck-builder-utils';

describe('deck-builder-utils', () => {
  describe('validateDeck', () => {
    it('valida baralho com exatamente 30 cartas', () => {
      const cards = Array.from({ length: DECK_SIZE }, (_, index) => `card-${index}`);

      const result = validateDeck(cards);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.size).toBe(DECK_SIZE);
    });

    it('retorna erro quando o baralho não tem 30 cartas', () => {
      const cards = Array.from({ length: DECK_SIZE - 1 }, (_, index) => `card-${index}`);

      const result = validateDeck(cards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `O baralho precisa ter exatamente ${DECK_SIZE} cartas (atual: ${DECK_SIZE - 1}).`,
      );
    });

    it('retorna erro quando excede limite de 3 cópias', () => {
      const cards = ['alpha', 'alpha', 'alpha', 'alpha', ...Array.from({ length: 26 }, (_, index) => `card-${index}`)];

      const result = validateDeck(cards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Máximo de ${MAX_CARD_COPIES} cópias por carta excedido: alphax4.`,
      );
    });
  });

  describe('countCopies', () => {
    it('conta corretamente cópias de cada carta', () => {
      const copies = countCopies(['alpha', 'beta', 'alpha', 'gamma', 'beta', 'alpha']);

      expect(copies).toEqual({
        alpha: 3,
        beta: 2,
        gamma: 1,
      });
    });
  });
});
