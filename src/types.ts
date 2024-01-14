export type TaskMessage = {
  title: string;
  description: string;
}

export type TaskVariationSelectorSerialized = {
  variations: string[];
  remainingVariations: string[];
} | null;

export type TaskSerialized = {
  title: string;
  lastCompleted: string;
  weight: number;
  currentVariation: string | null;
  variationSelector: TaskVariationSelectorSerialized;
}

export type SchedulerSerialized = {
  tasks: TaskSerialized[];
  lastTasksTitles: [string?, string?, string?, string?, string?];
}
