import { Types } from 'mongoose';

export type LastTasksIds = [
  Types.ObjectId?,
  Types.ObjectId?,
  Types.ObjectId?,
  Types.ObjectId?,
  Types.ObjectId?
];

export type AllowedCity = 'Москва' | 'Астана';
export type Hour = `${'0' | '1'}${'0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'}` | `2${'0' | '1' | '2' | '3'}`;
export type Minute = `${'0' | '1' | '2' | '3' | '4' | '5'}${'0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'}`;
export type TimeString = `${Hour}:${Minute}`;
export type TimeWithCity = `${TimeString} ${AllowedCity}`;
