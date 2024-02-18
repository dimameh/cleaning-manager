import { TimeString, TimeWithCity } from "./types";

export function isValidOnStartContext(ctx) {
  const { chat, from } = ctx.update.message;
  if (
    !chat ||
    !from ||
    !chat.id ||
    !from.id ||
    !from.username ||
    from.is_bot === undefined
  ) {
    return false;
  }
  return true;
}

export async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getRandomElement<T>(array: Array<T>) {
  return array[Math.floor(Math.random() * array.length)];
}

export function timeToUTC(time: TimeString, city: 'Астана' | 'Москва'): TimeString {
  const offset = {
    'Москва': 3,
    'Астана': 6
  }[city];

  let [hours, minutes] = time.split(':').map(Number);
  let utcHours = (hours - offset + 24) % 24;
  // Дополнение часов и минут нулями, если они состоят из одной цифры
  let formattedHours = utcHours.toString().padStart(2, '0');
  let formattedMinutes = minutes.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}` as TimeString;
}

export function timeWithCityToUTC(timeWithCity: TimeWithCity): TimeString {
  const [time, city] = timeWithCity.split(' ');
  return timeToUTC(time as TimeString, city as 'Астана' | 'Москва');
}