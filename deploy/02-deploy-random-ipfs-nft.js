const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const { storeImages, storeTokenUriMetadata } = require("../utils/UploadToPinata");

const imagesLocation = "./images/randomNft"

const metadataTemplate = {
  name: "",
  description:"",
  image:"",
  attributes: [
    {
      trait_type:"frame",
      value: 308,
    }
  ]
}

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let tokenUris
  // get the IPFS hashes of our images
  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris()
  }


  // 1. With our own IPFS node.
  // 2. Pinata
  // 3. nft.storage


  let vrfCoordinatorV2Address, subscriptionId;

  if(developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.events[0].args.subId;

  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
    subscriptionId = networkConfig[chainId].subscriptionId

  }
  log("----------------------------------------")
  // address vrfCoordinatorV2,
  // uint64 subcriptionId,
  // bytes32 gasLane,
  // uint32 callbackGasLimit,
  // string[3] memory frameTokenUris,
  // uint256 mintFee

  // await storeImages(imagesLocation)
  // const args = [
  //   vrfCoordinatorV2Address,
  //   subscriptionId,
  //   networkConfig[chainId].gasLane,
  //   networkConfig[chainId].callbackGasLimit,
  //   // networkConfig[chainId].frameTokenUris,
  //   networkConfig[chainId].mintFee,
  // ]
}

async function handleTokenUris() {
  //토큰uri들을 반환해주는 함수
  tokenUris = []
  // ipfs에 이미지 저장
  // ipfs에 metadata 저장
  const {responses: imageUploadResponses, files } = await storeImages(imagesLocation)
  for (const [imageUploadResponsesIndex, imageUploadResponse] of imageUploadResponses.entries()) {  
    // metadata 생성
    // metadata 업로드
    let tokenUriMetadata = { ...metadataTemplate};
    tokenUriMetadata.name = files[imageUploadResponsesIndex].replace(".png","");
    tokenUriMetadata.description = `video frame ${tokenUriMetadata.name}`
    tokenUriMetadata.image = `ipfs://${imageUploadResponse.IpfsHash}`
    console.log(`${tokenUriMetadata.name} 업로드 중 ...`);
    // JSON 파일을 pinata 혹은 ipfs 에 저장해야함
    const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata);
    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }
  console.log("TokenURI가 업로드 되었습니다.");
  console.log(tokenUris);
  return tokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]