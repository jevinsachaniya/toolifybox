export function runConversionTask(task, { signal, timeout = 30000, message = 'This conversion step took too long. Try a smaller document.' } = {}) {
  return new Promise((resolve, reject) => {
    let finished = false;
    let timer;
    const finish = (handler, value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      handler(value);
    };
    const cancel = () => finish(reject, new DOMException('Conversion cancelled.', 'AbortError'));
    if (signal?.aborted) { cancel(); return; }
    signal?.addEventListener('abort', cancel, { once: true });
    timer = setTimeout(() => finish(reject, new Error(message)), timeout);
    Promise.resolve().then(() => { if (!finished) return task(); }).then(value => finish(resolve, value), error => finish(reject, error));
  });
}
