declare module "@noble/curves/p256" {
  export const p256: {
    verify(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean;
  };
}
