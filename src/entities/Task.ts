import { TaskVariationSelector } from './TaskVariationSelector';
import { TaskSerialized } from '../types';

export class Task {
  title: string;
  lastCompleted: Date;
  weight: number;
  hasVariations: boolean = false;
  private _variationSelector: TaskVariationSelector | null;
  private _currentVariation: string | null = null;

  constructor(title: string);
  constructor(title: string, serializedData?: Omit<TaskSerialized, 'title'>);

  constructor(title: string, serializedData?: Omit<TaskSerialized, 'title'>) {
    if (!serializedData) {
      this.title = title;

      this._variationSelector = this.getVariationsSelector(title);

      this.lastCompleted = new Date();
      this.weight = 0;
      return;
    }

    const { lastCompleted, currentVariation, variationSelector, weight } =
      serializedData;
    this.title = title;
    this.lastCompleted = new Date(lastCompleted);
    this.weight = weight;
    this._currentVariation = currentVariation;
    this._variationSelector =
    variationSelector === null
    ? null
    : new TaskVariationSelector(
      variationSelector.variations,
      variationSelector.remainingVariations
      );
  }

  updateWeight() {
    const now = new Date();
    const daysSinceCompletion = Math.floor(
      (now.getTime() - this.lastCompleted.getTime()) / (1000 * 3600 * 24)
    );
    this.weight = daysSinceCompletion;
  }

  getFullState() {
    return {
      title: this.title,
      lastCompleted: this.lastCompleted,
      weight: this.weight,
      _currentVariation: this._currentVariation,
      _variationSelector: {
        variations: this._variationSelector?.variations,
        remainingVariations: this._variationSelector?.remainingVariations,
      },
    };
  }

  getPreparedForMessageTask(): this {
    if (this._variationSelector) {
      this._currentVariation = this._variationSelector.chooseVariation();
    }

    return this;
  }

  getSerialized(): TaskSerialized {
    return {
      title: this.title,
      lastCompleted: this.lastCompleted.toString(),
      weight: this.weight,
      currentVariation: this._currentVariation,
      variationSelector: this._variationSelector
        ? {
          variations: this._variationSelector.variations,
          remainingVariations: this._variationSelector.remainingVariations,
        }
        : null,
    }
  }

  get finalTitle() {
    return this._currentVariation
      ? `${this.title} ${this._currentVariation}`
      : this.title;
  }

  private getVariationsSelector(title: string) {
    switch (title) {
      case 'Подмести пол':
        return new TaskVariationSelector([
          'в спальне',
          'в ванной',
          'на кухне',
          'в зале',
          'в прихожей',
        ]);
      case 'Помыть пол':
        return new TaskVariationSelector([
          'в спальне',
          'в ванной',
          'на кухне',
          'в зале',
          'в прихожей',
        ]);
      case 'Протереть пыль':
        return new TaskVariationSelector([
          'в спальне',
          'в ванной',
          'на кухне',
          'в зале',
          'в прихожей',
        ]);
      default:
        return null;
    }
  }
}
