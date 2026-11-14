import { md5 } from "js-md5";

/** Browser stand-in for `node:crypto`'s `createHash`; factur-x only needs MD5 hex digests for the PDF file ID. */
export function createHash(algorithm: string) {
  if (algorithm !== "md5") throw new Error(`Unsupported hash algorithm in browser: ${algorithm}`);
  const hash = md5.create();
  const hasher = {
    update(data: Uint8Array | string) {
      hash.update(data);
      return hasher;
    },
    digest: () => hash.hex(),
  };
  return hasher;
}
