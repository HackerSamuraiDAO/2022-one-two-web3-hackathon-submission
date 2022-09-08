# 2022-one-two-web3-hackathon-submission

## Why we build this project
Our goal is the users can manage their NFT data in a decentralized way

Currently, a plenty of NFT tool or market places are flooded and many of them provided the NFT minting function. Some managed the users NFT metadata in a decentralized way but some are not. Since the decentralized nature of NFT data management is also a hot topic these days, some protocols have a function to immigrate the NFT data from a centralized management to decentralized but each protocols have own procees so that it is still difficult for the users to do it.

We would like to solve these problem and realize what we aim by providing the interface to immigrate their NFT metadata to a decentralized management according to each protocol's NFT contract, and make it commonplace for creators to be able to manage NFT data themselves.



## What we build
We provide an interface to immigrate their NFT metadata to a decentralized management. Our application can classify the types of NFT contract by the inputed NFT contract address and chains and get the NFT metadata from the current database, and adjust the data for IPFS and upload the data to IPFS and set the URI according to the NFT contract type


<img width="1085" alt="Screen Shot 2022-09-08 at 15 32 23" src="https://user-images.githubusercontent.com/64068653/189062403-2c3dfac5-e870-4124-9cb6-0ccdb618d493.png">

We have a plan to integrate a lot of NFT protocols, but this time we integrated Chocomint (a multi-chain NFT minting tool) and Opensea into our dapps. Opensea provides the function of freezing the data [https://support.opensea.io/hc/en-us/articles/1500012270982-What-is-freezing-metadata-], so we integrated this function into our dapps.


