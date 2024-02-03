import mongoose, { Schema, Types, Document } from 'mongoose';
const ObjectId = Schema.ObjectId;

export interface ITask extends Document {
  simplifiedMessage: string;
  messageTextVariations: string[];
  taskListId: Types.ObjectId;
  weight: number;
  lastCompleted: Date;
  completeTask: () => Promise<ITask>;
  updateWeight: (updateFunc: (lastCompleted: Date) => number) => void;
  readonly message: string; // Геттер рандомного сообщения из messageTextVariations
}

const TaskSchema = new Schema<ITask>({
  simplifiedMessage: { type: String, required: true },
  messageTextVariations: { type: [String], required: true },
  taskListId: { type: ObjectId, required: true, ref: 'TaskList' },
  weight: { type: Number, required: true },
  lastCompleted: {
    type: Date,
    required: false
  }
});

TaskSchema.methods.completeTask = async function () {
  this.lastCompleted = new Date();
  this.weight = 0;
  return this.save();
};

TaskSchema.methods.updateWeight = function (
  updateFunc: (lastCompleted: Date) => number
) {
  const newWeight = updateFunc(this.lastCompleted);
  this.weight = newWeight;
  return this.save();
};

TaskSchema.virtual('message').get(function (this: ITask) {
  return this.messageTextVariations[
    Math.floor(Math.random() * this.messageTextVariations.length)
  ];
});

const Task = mongoose.model<ITask>('Task', TaskSchema, 'Task');

export default Task;
