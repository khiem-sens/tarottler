type Card = { name: string; group: string; rank: number };

const zodiacElements: Record<string, string> = {
  Aries: "Fire", Taurus: "Earth", Gemini: "Air", Cancer: "Water",
  Leo: "Fire", Virgo: "Earth", Libra: "Air", Scorpio: "Water",
  Sagittarius: "Fire", Capricorn: "Earth", Aquarius: "Air", Pisces: "Water",
};

// Golden Dawn zodiac associations for the twelve sign-linked trumps.
const majorZodiac: Record<number, string> = {
  4: "Aries", 5: "Taurus", 6: "Gemini", 7: "Cancer",
  8: "Leo", 9: "Virgo", 11: "Libra", 13: "Scorpio",
  14: "Sagittarius", 15: "Capricorn", 17: "Aquarius", 18: "Pisces",
};
const suitElements: Record<string, string> = { Wands: "Fire", Cups: "Water", Swords: "Air", Pentacles: "Earth" };
const minorZodiac: Record<string, string[]> = {
  Wands: ["Aries", "Leo", "Sagittarius"],
  Cups: ["Cancer", "Scorpio", "Pisces"],
  Swords: ["Libra", "Aquarius", "Gemini"],
  Pentacles: ["Capricorn", "Taurus", "Virgo"],
};
const majorYes = new Set([0, 1, 3, 4, 6, 7, 8, 10, 14, 17, 19, 20, 21]);
const majorNo = new Set([12, 13, 15, 16, 18]);
const minorNo = new Set([
  "Five of Wands", "Nine of Wands", "Ten of Wands",
  "Four of Cups", "Five of Cups", "Seven of Cups", "Eight of Cups",
  "Three of Swords", "Five of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords",
  "Five of Pentacles", "Seven of Pentacles",
]);
const minorMaybe = new Set([
  "Two of Wands", "Seven of Wands", "Page of Wands",
  "Page of Cups", "Knight of Cups",
  "Two of Swords", "Four of Swords", "Six of Swords", "Page of Swords", "Queen of Swords",
  "Two of Pentacles", "Four of Pentacles", "Page of Pentacles", "Knight of Pentacles",
]);

export function metadataFor(card: Card) {
  const major = card.group === "Major Arcana";
  const zodiac = major ? majorZodiac[card.rank] : card.rank >= 2 && card.rank <= 10
    ? minorZodiac[card.group]?.[Math.floor((card.rank - 2) / 3)] : undefined;
  const element = major ? (zodiac ? zodiacElements[zodiac] : ({ 0: "Air", 12: "Water", 20: "Fire" } as Record<number, string>)[card.rank]) : suitElements[card.group];
  const yesNo = major ? majorYes.has(card.rank) ? "Yes" : majorNo.has(card.rank) ? "No" : "Maybe"
    : minorNo.has(card.name) ? "No" : minorMaybe.has(card.name) ? "Maybe" : "Yes";
  return {
    number: major ? String(card.rank).padStart(2, "0") : `${String(card.rank).padStart(2, "0")} / ${card.group}`,
    arcana: major ? "Major Arcana" : "Minor Arcana",
    element, zodiac, yesNo,
  };
}
