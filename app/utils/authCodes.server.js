const codes = new Map();

export function saveCode(code, data) {
  codes.set(code, data);

  setTimeout(() => {
    codes.delete(code);
  }, 5 * 60 * 1000);
}

export function getCode(code) {
  const data = codes.get(code);
  codes.delete(code);
  return data;
}