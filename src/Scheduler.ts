import TaskList, { ITaskList } from './DB/entities/TaskList';
import Task, { ITask } from './DB/entities/Task';
import SchedulerHistory from './DB/entities/SchedulerHistory';
import { getRandomElement } from './utils';

export default class TaskScheduler {
  private static _tasks: ITask[];
  private static _currentTask: ITask;
  private static _readyForNextTask = true;
  private static _intervalId;
  private static _onNewTaskHandler: (task: ITask) => void;

  static get currentTask() {
    return this._currentTask;
  }

  static async init(
    taskListId: ITaskList['id'],
    onNewTaskHandler: (task: ITask) => void
  ) {
    if (this._intervalId) {
      console.log('already initialized');
      return;
    }
    try {
      await this._loadTasks(taskListId);

      this._onNewTaskHandler = onNewTaskHandler;

      this._intervalId = setInterval(this._checkTimeAndRunHandler, 60000); // проверяем каждую минуту
    } catch (error) {
      const errorMessage = 'Не удалось загрузить список задач.';
      console.error(errorMessage, error);
    }
  }

  private static async _checkTimeAndRunHandler() {
    // Получаем текущее время в Астане
    const astanaTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Almaty'
    });
    const currentTime = new Date(astanaTime);

    // Проверяем, соответствует ли время 14:00
    if (currentTime.getHours() === 14 && currentTime.getMinutes() === 0) {
      await TaskScheduler._generateAndRunTask();
    }
  }

  private static async _generateAndRunTask(): Promise<void> {
    // предотвратить параллельное сохранение сущностей (weights для tasks)
    if (!this._readyForNextTask) {
      throw new Error('TaskScheduler is not ready for next task.');
    }
    this._readyForNextTask = false;
    const task = await this._getNextTask();
    await task.completeTask();
    await SchedulerHistory.updateLastTasks(task?.id);
    this._currentTask = task;
    this._readyForNextTask = true;
    TaskScheduler._onNewTaskHandler(TaskScheduler._currentTask);
  }

  private static async _getNextTask(): Promise<ITask> {
    await this._updateWeights();
    const lastTasksIds = await SchedulerHistory.getLastTasks();
    // Фильтрация задач, чтобы не повторять задачу подряд
    const filteredTasks = this._tasks.filter(
      (task) => !lastTasksIds.includes(task._id)
    );
    // Проверка на задачи, которые не выполнялись более двух недель
    const overdueTask = filteredTasks.find((task) => task.weight > 14);
    if (overdueTask) {
      return overdueTask;
    }

    // Взвешенный случайный выбор
    const totalWeight = filteredTasks.reduce(
      (sum, task) => sum + task.weight,
      0
    );
    let randomValue = Math.random() * totalWeight;

    for (const task of filteredTasks) {
      randomValue -= task.weight;
      if (randomValue <= 0) {
        return task;
      }
    }

    const maxWeight = filteredTasks.reduce(
      (max, task) => Math.max(max, task.weight),
      -Infinity
    );

    // Фильтруем задачи, у которых вес равен максимальному
    const maxWeightTasks = filteredTasks.filter(
      (task) => task.weight === maxWeight
    );
    return maxWeightTasks[0];
  }

  private static async _updateWeights() {
    const promises = this._tasks.map((task) =>
      task.updateWeight((lastCompleted) => {
        const now = new Date();
        // Количество дней с момента последнего выполнения задачи будет ее новым весом
        const daysSinceCompletion = Math.floor(
          (now.getTime() - lastCompleted.getTime()) / (1000 * 3600 * 24)
        );
        return daysSinceCompletion;
      })
    );

    return Promise.all(promises);
  }

  private static async _loadTasks(taskListId: ITaskList['id']) {
    const taskListResult = await TaskList.findById(taskListId);

    if (!taskListResult) {
      throw new Error('Task list not found');
    }

    this._tasks = await Task.find({ taskListId });

    const currentTaskId = await SchedulerHistory.getCurrentTask();
    const loadedCurrentTask = this._tasks.find(
      (el) => el._id === currentTaskId
    );

    if (!currentTaskId || !loadedCurrentTask) {
      this._currentTask = getRandomElement(this._tasks);
      !loadedCurrentTask && console.log('TaskList changed!');
    } else {
      this._currentTask = loadedCurrentTask;
    }
    await SchedulerHistory.updateCurrentTask(this._currentTask._id);
  }
}
