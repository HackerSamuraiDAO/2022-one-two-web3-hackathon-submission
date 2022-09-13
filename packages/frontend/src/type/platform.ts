export type NFTPlatform = "opensea" | "chocomint" | "";

export const isNFTPlatform = (nftPlatform: string): nftPlatform is NFTPlatform => {
  return nftPlatform === "opensea" || nftPlatform === "chocomint";
};
