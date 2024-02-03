export function shuffle<T>(array: Array<T>) {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex]
    ];
  }

  return array;
}

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
