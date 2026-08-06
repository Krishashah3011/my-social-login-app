const codesML = new Map();

export function saveCode(codeML, dataML) {
  codesML.set(codeML, dataML);

  setTimeout(() => {
    codesML.delete(codeML);
  }, 5 * 60 * 1000);
}

export function getCode(codeML) {
  const dataML = codesML.get(codeML);
  codesML.delete(codeML);
  return dataML;
}