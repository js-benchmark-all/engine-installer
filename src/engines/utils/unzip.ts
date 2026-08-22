import { type Unzipped, unzip } from 'fflate/node';

const cb = function (this: PromiseWithResolvers<any>, err: any, data: any) {
  err === null ? this.resolve(data) : this.reject(err);
};
export const unzipAsync = (data: Parameters<typeof unzip>[0]): Promise<Unzipped> => {
  const resolver = Promise.withResolvers<Unzipped>();
  unzip(data, cb.bind(resolver));
  return resolver.promise;
};
