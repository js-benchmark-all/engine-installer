export const parse = (id: string): { engine: string; version: string; id: string } => {
  let split = id.indexOf('@');

  let engine: string, version: string;
  if (split === -1) {
    engine = id;
    version = 'latest';
    id += '@latest';
  } else {
    engine = id.slice(0, split);
    version = id.slice(split + 1);
  }

  return { engine, version, id };
};
