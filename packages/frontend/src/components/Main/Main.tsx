import { Box, Button, Flex, Heading, Input, Select, Stack, Text } from "@chakra-ui/react";
import axios from "axios";
import { ethers } from "ethers";
import { File, NFTStorage } from "nft.storage";
import React, { useState } from "react";
import { useNetwork, useSigner } from "wagmi";

import config from "../../../config.json";
import networks from "../../../networks.json";
import { chocomoldABI } from "../../lib/web3/ChocomoldABI";
import { Chain } from "../../type/chain";
import { ConnectWalletWrapper } from "../ConnectWalletWrapper";
import { useConsole } from "../Console";
import { truncate } from "../utils/truncate";

export const Main: React.FC = () => {
  const ethereumOpenseaContract = "0x495f947276749ce646f68ac8c248420045cb7b5e";
  const { console } = useConsole();
  const [nftContractAddress, setNFTContractAddress] = useState("");
  const [network, setNetwork] = useState<Chain>("rinkeby");
  const [nftPlatform, setNFTPlatform] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const { data: signer, isError, isLoading } = useSigner();
  const { chain, chains } = useNetwork();
  const NFT_STORAGE_TOKEN = process.env.NFT_STORAGE_TOKEN || "";
  const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

  const handleChangeNFTContractAddress = (e: any) => {
    const inputValue = e.target.value;
    setNFTContractAddress(inputValue);
  };
  const handleChangeNetwork = (e: any) => {
    const inputValue = e.target.value;
    setNetwork(inputValue);
  };
  const handleChangeNFTPlatform = (e: any) => {
    const inputValue = e.target.value;
    setNFTPlatform(inputValue);
  };

  const checkIsOpenseaContract = (nftContractAddress: string, network: Chain) => {
    if (nftContractAddress == ethereumOpenseaContract && network == "ethereum") {
      setName("Opensea Shared Storefront");
      setSymbol("OPENSTORE");
    } else {
      setNameAndSymbol(nftContractAddress, network);
    }
  };

  const search = async (nftContractAddress: string, network: Chain) => {
    checkIsOpenseaContract(nftContractAddress, network);
    setIsSearched(true);
  };

  const setNameAndSymbol = async (nftContractAddress: string, network: Chain) => {
    const fetch = require("node-fetch");

    const url = "https://deep-index.moralis.io/api/v2/nft/" + nftContractAddress + "/metadata?chain=" + network;
    const options = { method: "GET", headers: { Accept: "application/json", "X-API-Key": "test" } };
    let a;

    await fetch(url, options)
      .then(async (res: any) => {
        a = await res.json();
        setName(a.name);
        setSymbol(a.symbol);
      })
      .catch((err: any) => console.error("error:" + err));
  };

  const decentralizeMetadata = async (nftContractAddress: string, network: Chain, nftPlatform: string) => {
    if (nftPlatform == "chocomint") {
      await GetChocoMetadata(nftContractAddress, network);
    }
    const cid = await uploadFolderToIPFS();
    const uri = "https://ipfs.io/ipfs/" + cid;
    console.log("New BaseURI is " + uri);
    await setNewURI(nftContractAddress, uri);
    return;
  };

  // TODO : get current metadata bu reading chococontract (customBaseURI)
  const GetChocoMetadata = async (nftContractAddress: string, network: Chain) => {
    if (!signer || !network) {
      return;
    }

    console.log(nftContractAddress);
    const nftContract = new ethers.Contract(nftContractAddress, chocomoldABI, signer);
    const metadata = await nftContract.defaultBaseURI();
    console.log("hello");
    const chainId = networks[network].chainId;
    const baseTokenURI = metadata + chainId + "/" + nftContractAddress;
    await axios.get(baseTokenURI).then((res) => {
      let json = JSON.stringify(res.data.metadata, undefined, 1);
      localStorage.setItem(nftContractAddress, json);
    });
    console.log(baseTokenURI);
  };

  // TODO : Upload the Folder
  const uploadFolderToIPFS = async () => {
    console.log("Metadata is been uploading now");
    const fixedDatas: any[] = [];
    const json = localStorage.getItem(nftContractAddress);
    if (!json) {
      console.log("No data in Localstorage")
      return
    }
    let array = JSON.parse(json);
    array.forEach((data: any) => {
      const newMetadata: any = {
        attributes: data.attributes,
        animation_url: data.animation_url,
        description: data.description,
        image: data.image,
        name: data.name,
        tokenId: data.tokenId,
      };
      const file = new File([JSON.stringify(newMetadata)], data.tokenId, { type: "application/json" });
      fixedDatas.push(file);
    });
    const cid = await client.storeDirectory(fixedDatas);
    console.log(cid);
    return cid;
  };

  // TODO : set CID
  const setNewURI = async (nftContractAddress: string, uid: string) => {
    console.log("New URI is been setting");
    if (!signer) {
      console.log("Error: No signer");
      return;
    }
    const nftContract = new ethers.Contract(nftContractAddress, chocomoldABI, signer);
    const transaction = await nftContract.setCustomBaseURI(uid);
    console.log("Tx hash : " + transaction.hash);
    return transaction;
  };

  return (
    <Box boxShadow={"base"} borderRadius="2xl" p="4" backgroundColor={config.styles.background.color.main}>
      <Heading textAlign={"center"}>NFT Decentralizer</Heading>
      <Select placeholder="Select chains" onChange={handleChangeNetwork} mt={"5"} disabled={isSearched}>
        <option value="polygon">Polygon</option>
        <option value="ethereum">Ethereum</option>
        <option value="rinkeby">Rinkeby</option>
      </Select>
      <Input
        placeholder="Input NFT Contract Address"
        onChange={handleChangeNFTContractAddress}
        mt={"5"}
        disabled={isSearched}
      ></Input>
      <Select placeholder="Select platforms" onChange={handleChangeNFTPlatform} mt={"5"} disabled={isSearched}>
        <option value="opensea">Opensea</option>
        <option value="chocomint">Chocomint</option>
      </Select>

      {isSearched && (
        <>
          <Box mt={"5"}>
            <Flex>
              <Text>Contract Address: </Text>
              <Text>{truncate(nftContractAddress, 5, 5)}</Text>
            </Flex>
            <Flex>
              <Text>Network : </Text>
              <Text>{network}</Text>
            </Flex>
            <Flex>
              <Text>Contract Name : </Text>
              <Text>{name}</Text>
            </Flex>
            <Flex>
              <Text>Symbol : </Text>
              <Text>{symbol}</Text>
            </Flex>
            <Flex>
              <Text>Platform : </Text>
              <Text>{nftPlatform}</Text>
            </Flex>
          </Box>
        </>
      )}

      <Stack spacing="4">
        <ConnectWalletWrapper>
          {!isSearched ? (
            <Button
              width={"100%"}
              onClick={() => search(nftContractAddress, network)}
              fontSize={"sm"}
              colorScheme={"blue"}
              rounded={"2xl"}
              mt={"5"}
            >
              Select NFT
            </Button>
          ) : (
            <>
              <Button
                width={"100%"}
                onClick={() => setIsSearched(false)}
                fontSize={"sm"}
                colorScheme={"blue"}
                rounded={"2xl"}
                mt={"5"}
              >
                Back
              </Button>
              <Button
                width={"100%"}
                onClick={() => decentralizeMetadata(nftContractAddress, network, nftPlatform)}
                fontSize={"sm"}
                colorScheme={"blue"}
                rounded={"2xl"}
                mt={"5"}
              >
                Decentralize NFT{" "}
              </Button>
            </>
          )}
        </ConnectWalletWrapper>
      </Stack>
    </Box>
  );
};
