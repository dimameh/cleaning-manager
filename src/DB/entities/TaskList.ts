import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskList extends Document {
  title: string;
}

const TaskListSchema = new Schema<ITaskList>({
  title: { type: String, required: true }
});

const TaskList = mongoose.model<ITaskList>(
  'TaskList',
  TaskListSchema,
  'TaskList'
);

export default TaskList;
