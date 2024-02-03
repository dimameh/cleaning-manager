import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskList extends Document {
  title: string;
}

export const TaskListSchema = new Schema<ITaskList>({
  title: { type: String, required: true }
});

const TaskList = mongoose.model<ITaskList>('TaskList', TaskListSchema);

export default TaskList;