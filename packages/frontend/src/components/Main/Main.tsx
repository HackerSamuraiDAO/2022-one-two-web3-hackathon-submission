import { Box, Button, Flex, Input, Select, Stack, Text } from "@chakra-ui/react";
import React, { useState } from "react";

import config from "../../../config.json";
import { ConnectWalletWrapper } from "../ConnectWalletWrapper";
import { useConsole } from "../Console";
import { truncate } from "../utils/truncate";

export const Main: React.FC = () => {
  const ethereumOpenseaContract = "0x495f947276749ce646f68ac8c248420045cb7b5e";
  const { console } = useConsole();
  const [nftContractAddress, setNFTContractAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [contractType, setContractType] = useState("");
  const [isSearched, setIsSearched] = useState(false);

  const handleChangeNFTContractAddress = (e: any) => {
    const inputValue = e.target.value;
    setNFTContractAddress(inputValue);
  };
  const handleChangeNetwork = (e: any) => {
    const inputValue = e.target.value;
    setNetwork(inputValue);
  };

  const checkIsOpenseaContract = (nftContractAddress: string, network: string) => {
    if (nftContractAddress == ethereumOpenseaContract && network == "ethereum") {
      setContractType("opensea");
      setName("Opensea Shared Storefront");
      setSymbol("OPENSTORE");
    } else {
      setNameAndSymbol(nftContractAddress, network);
    }
  };

  const search = async (nftContractAddress: string, network: string) => {
    checkIsOpenseaContract(nftContractAddress, network);

    setIsSearched(true);
  };

  const setNameAndSymbol = async (nftContractAddress: string, network: string) => {
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

  return (
    <Box boxShadow={"base"} borderRadius="2xl" p="4" backgroundColor={config.styles.background.color.main}>
      <Select placeholder="Select chains" onChange={handleChangeNetwork}>
        <option value="polygon">Polygon</option>
        <option value="ethereum">Ethereum</option>
        <option value="rinkeby">Rinkeby</option>
      </Select>
      <Input placeholder="Input NFT Contract Address" onChange={handleChangeNFTContractAddress}></Input>

      {isSearched && (
        <>
          <Box>
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
              <Text>Contract Type : </Text>
              <Text>{contractType}</Text>
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
            >
              Select NFT
            </Button>
          ) : (
            <>
              <Button
                width={"100%"}
                onClick={() => search(nftContractAddress, network)}
                fontSize={"sm"}
                colorScheme={"blue"}
                rounded={"2xl"}
              >
                Research
              </Button>
              <Button
                width={"100%"}
                onClick={() => search(nftContractAddress, network)}
                fontSize={"sm"}
                colorScheme={"blue"}
                rounded={"2xl"}
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
