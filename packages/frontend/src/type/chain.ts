export type Chain = "rinkeby" | "polygon" | "ethereum";

export const isChain = (chain: string): chain is Chain => {
  return chain === "rinkeby" || chain === "polygon" || chain === "ethereum";
};
