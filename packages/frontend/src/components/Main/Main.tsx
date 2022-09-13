import { ArrowRightIcon, CheckCircleIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Heading, Input, Link, Select, Stack, Text, useToast } from "@chakra-ui/react";
import axios from "axios";
import { ethers } from "ethers";
import { File, NFTStorage } from "nft.storage";
import React, { useState } from "react";
import { useAccount, useNetwork, useSigner } from "wagmi";

import config from "../../../config.json";
import networks from "../../../networks.json";
import { chocomoldABI } from "../../lib/web3/ChocomoldABI";
import { openseaABI } from "../../lib/web3/OpenseaABI";
import { Chain } from "../../type/chain";
import { NFTPlatform } from "../../type/platform";
import { ConnectWalletWrapper } from "../ConnectWalletWrapper";
import { useConsole } from "../Console";
import { truncate } from "../utils/truncate";

export const Main: React.FC = () => {
  const IPFSURI = "https://ipfs.io/ipfs/";
  const { console } = useConsole();
  const toast = useToast();
  const [nftContractAddress, setNFTContractAddress] = useState("");
  const [network, setNetwork] = useState<Chain>("rinkeby");
  const [nftPlatform, setNFTPlatform] = useState<NFTPlatform>("");
  const [tokenId, setTokenId] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const [ongoing, setOngoing] = useState(false);
  const { data: signer } = useSigner();
  const { chain, chains } = useNetwork();
  const { address } = useAccount();
  const NFT_STORAGE_TOKEN = process.env.NFT_STORAGE_TOKEN || "";
  // const NFT_STORAGE_TOKEN =""
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
    if (inputValue == "opensea") {
      setNFTContractAddress("-----");
      setName("Opensea Shared Storefront");
      setSymbol("OPENSTORE");
    }
  };
  const handleChangeTokenId = (e: any) => {
    const inputValue = e.target.value;
    setTokenId(inputValue);
  };

  const search = async (nftContractAddress: string, network: Chain) => {
    const isSupported = checkIsSupported();
    if (!isSupported) {
      console.error("This network isn't been supported");
      return;
    }
    const { ethereum } = window;
    if (ethereum && chain && Number(chain.network) != networks[network].chainId) {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ethers.utils.hexValue(networks[network].chainId) }],
      });
    }
    if (nftPlatform != "opensea") {
      setNameAndSymbol(nftContractAddress, network);
    }
    setIsSearched(true);
  };

  const checkIsSupported = () => {
    if (!nftPlatform) {
      return false;
    }
    return networks[network].support[nftPlatform];
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

  const decentralizeMetadata = async () => {
    console.log(address)
    setOngoing(true);
    let transaction;
    if (nftPlatform == "chocomint") {
      transaction = await chocomintImplementation(nftContractAddress, network);
    }
    if (nftPlatform == "opensea") {
      transaction = await openseaImplementation(network, tokenId);
    }
    setOngoing(false);
    return transaction;
  };

  const chocomintImplementation = async (nftContractAddress: string, network: Chain) => {
    if (!signer || !network) {
      setOngoing(false);
      return;
    }
    
    const nftContract = new ethers.Contract(nftContractAddress, chocomoldABI, signer);
const owner = await nftContract.owner()
    if (owner != address) {
      console.log("Error : You are not an owner of this contract")
      setOngoing(false);
      return
    }
    const metadata = await nftContract.defaultBaseURI();
    const chainId = networks[network].chainId;
    const baseTokenURI = metadata + chainId + "/" + nftContractAddress;
    await axios
      .get(baseTokenURI)
      .then((res) => {
        let json = JSON.stringify(res.data.metadata, undefined, 1);
        localStorage.setItem(nftContractAddress, json);
      })
      .catch(() => {
        setOngoing(false);
      });
    console.log("Current URI : " + baseTokenURI);
    const cid = await uploadFolderToIPFS(nftContractAddress);
    console.log("New URI is been setting");
    const uri = IPFSURI + cid;
    const transaction = await nftContract
      .setCustomBaseURI(uri)
      .catch(() => {
        setOngoing(false);
        return
      });
    if (!transaction) return;
    toast({
      render: () => (
        <Box color="white" p={3} bg={"gray"} rounded={"md"}>
          <CheckCircleIcon mr="2" />
          Please wait for confirmation:{" "}
          <Link
            textDecoration={"underline"}
            fontSize="sm"
            isExternal
            href={`${networks[network].explorer}tx/${transaction.hash}`}
            maxWidth={80}
            noOfLines={1}
          >
            {transaction.hash}
          </Link>
        </Box>
      ),
      isClosable: true,
      duration: 10000,
    });
    return transaction;
  };

  const openseaImplementation = async (network: Chain, tokenId: string) => {
    if (!signer || !network) {
      setOngoing(false);
      return;
    }
    const openseaContractAddress = networks[network].opensea;
    const openseaContract = new ethers.Contract(openseaContractAddress, openseaABI, signer);
    const maxSupply = await openseaContract.maxSupply(tokenId);
    const balance = await openseaContract.balanceOf(address, tokenId);
    if (maxSupply != balance) {
      console.log("Error : You have to have all tokens");
      setOngoing(false);
      return;
    } const metadata = await openseaContract.uri(tokenId);
    console.log(metadata.slice(0, -6));
    let tokenUri = metadata.slice(0, -6) + "/" + tokenId;
    try {
      await axios.get(tokenUri).then((res) => {
        let json = JSON.stringify(res.data, undefined, 1);
        localStorage.setItem(tokenId, json);
      });
    } catch {
      tokenUri = metadata + "/" + tokenId;
      await axios
        .get(tokenUri)
        .then((res) => {
          let json = JSON.stringify(res.data, undefined, 1);
          localStorage.setItem(tokenId, json);
        })
        .catch(() => {
          setOngoing(false);
        });
    }
    console.log("Current URI:" + tokenUri);
    const cid = await uploadFileToIPFS(tokenId);
    console.log("New URI is been setting");
    const uri = IPFSURI + cid;
    const transaction = await openseaContract.setURI(tokenId, uri).catch(() => {
      setOngoing(false);
      return;
    });
    if(!transaction)return
    toast({
      render: () => (
        <Box color="white" p={3} bg={"gray"} rounded={"md"}>
          <CheckCircleIcon mr="2" />
          Please wait for confirmation:{" "}
          <Link
            textDecoration={"underline"}
            fontSize="sm"
            isExternal
            href={`${networks[network].explorer}tx/${transaction.hash}`}
            maxWidth={80}
            noOfLines={1}
          >
            {transaction.hash}
          </Link>
        </Box>
      ),
      isClosable: true,
      duration: 10000,
    });
    return transaction;
  };

  // TODO : Upload the Folder
  const uploadFolderToIPFS = async (localStorageKey: string) => {
    console.log("Metadata is been uploading now");
    const fixedDatas: any[] = [];
    const json = localStorage.getItem(localStorageKey);
    if (!json) {
      setOngoing(false);
      console.log("No data in Localstorage");
      return;
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
    console.log("Metadata is stored to" + cid);
    return cid;
  };

  const uploadFileToIPFS = async (localStorageKey: string) => {
    console.log("Metadata is been uploading now");
    const json = localStorage.getItem(localStorageKey);
    if (!json) {
      console.log("No data in Localstorage");
      setOngoing(false);
      return;
    }
    const file = new File([json], localStorageKey, { type: "application/json" });
    const cid = await client.storeDirectory([file]);
    console.log("Metadata is stored to" + cid);
    return cid;
  };

  return (
    <Box boxShadow={"base"} borderRadius="2xl" p="4" backgroundColor={config.styles.background.color.main}>
      <Heading textAlign={"center"}>Metadata Decentralizer</Heading>
      <Text mt={"5"} size={"lg"}>
        Network:
      </Text>
      <Select onChange={handleChangeNetwork} disabled={isSearched} mt={"2"}>
        <option value="rinkeby">Rinkeby</option>
        <option value="polygon">Polygon</option>
        <option value="ethereum">Ethereum</option>
      </Select>
      <Text mt={"5"} size={"lg"}>
        NFT Platform:
      </Text>
      <Select placeholder="Select platforms" onChange={handleChangeNFTPlatform} mt={"2"} disabled={isSearched}>
        <option value="opensea">Opensea</option>
        <option value="chocomint">Chocomint</option>
      </Select>
      {nftPlatform && nftPlatform != "opensea" && (
        <Input
          placeholder="Input NFT Contract Address"
          onChange={handleChangeNFTContractAddress}
          mt={"5"}
          disabled={isSearched}
        ></Input>
      )}
      {nftPlatform == "opensea" && (
        <Input placeholder="Input NFT Token ID" onChange={handleChangeTokenId} mt={"5"} disabled={isSearched}></Input>
      )}

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
              disabled={network && nftPlatform && (nftContractAddress || tokenId) ? false : true}
            >
              Select NFT
            </Button>
          ) : (
            <>
              <Flex>
                <Button
                  width={"100%"}
                  onClick={() => {
                    setIsSearched(false);
                  }}
                  fontSize={"sm"}
                  colorScheme={"gray"}
                  rounded={"2xl"}
                  mt={"5"}
                  mr={"2"}
                  disabled={ongoing}
                >
                  Back
                </Button>
                <Button
                  width={"100%"}
                  onClick={decentralizeMetadata}
                  fontSize={"sm"}
                  colorScheme={"blue"}
                  rounded={"2xl"}
                  mt={"5"}
                  disabled={ongoing}
                >
                  Decentralize NFT{" "}
                </Button>
              </Flex>
            </>
          )}
        </ConnectWalletWrapper>
      </Stack>
    </Box>
  );
};
