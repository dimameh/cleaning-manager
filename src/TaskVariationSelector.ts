export class TaskVariationSelector {
  variations: string[];
  remainingVariations: string[];

  constructor(variations: string[]);
  constructor(variations: string[], remainingVariations: string[]);

  constructor(variations: string[], remainingVariations?: string[]) {
    this.variations = variations;
    this.remainingVariations = [...(remainingVariations || variations)];
  }

  chooseVariation(): string {
    if (this.remainingVariations.length === 0) {
      this.remainingVariations = [...this.variations];
    }
    const randomIndex = Math.floor(
      Math.random() * this.remainingVariations.length
    );
    const chosenVariation = this.remainingVariations[randomIndex];
    this.remainingVariations.splice(randomIndex, 1);
    return chosenVariation;
  }
}
