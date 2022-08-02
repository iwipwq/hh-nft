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

let tokenUris = [
  'ipfs://QmaMLaa4VwpPtBkmNi76hg6jnJ5vqANn3iaWRCztgS5e91',
  'ipfs://QmfTGQnCb2MkBkRha54nJXFJECeWbN7RHVFXA1Ln1KzEtE',
  'ipfs://Qmds3ajTncEs2RaA5gE8pbPkaQ9G2ehQWwd2bwCH75xXFE'
]

const FUND_AMOUNT = ethers.utils.parseEther("10"); // 10LINK token

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  // let tokenUris
  // get the IPFS hashes of our images
  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris()
  }


  // 1. With our own IPFS node.
  // 2. Pinata
  // 3. nft.storage


  let vrfCoordinatorV2Address, subscriptionId;

  if(developmentChains.includes(network.name)) {
    console.log("개발체인입니다. subscriptionId를 생성합니다.");
    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.events[0].args.subId;
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
    console.log("subscriptionId 생성을 완료했습니다.",subscriptionId.toString());
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
  const args = [
    vrfCoordinatorV2Address,
    subscriptionId,
    networkConfig[chainId].keyHash,
    networkConfig[chainId].callbackGasLimit,
    tokenUris,
    networkConfig[chainId].mintFee,
  ]

  const randomIpfsNft = await deploy("RandomIpfsNft",{
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })
  log("--------------")
  if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("계약을 검증하고 있습니다...")
    await verify(randomIpfsNft.address, args)
  }

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