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
