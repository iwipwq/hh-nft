const {ethers, network} = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
module.exports = async function({deployments, getNamedAccounts}) {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    
    // Basic NFT
    const basicNft = await ethers.getContract("BasicNft",deployer);
    const basicMintTx = await basicNft.mintNft();
    await basicMintTx.wait(1);
    console.log(`Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)}`);

    // Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer);
    const mintFee = await randomIpfsNft.getMintFee();

    await new Promise(async (resolve,reject) => {
        setTimeout(resolve, 300000) // 타임아웃 5 분
        randomIpfsNft.once("NftMinted", async() => {
            resolve();
        })
        let vrfCoordinatorV2Mock;
        if (developmentChains.includes(network.name)) {
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            const subscriptionId = await randomIpfsNft.getSubscriptionId();
            await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomIpfsNft.address);
        }

        const randomIpfsNftMintTx = await randomIpfsNft.requestNft({value: mintFee.toString()});
        const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1);

        if (developmentChains.includes(network.name)) {
            const requestId = randomIpfsNftMintTxReceipt.events[1].args.requestId.toString();
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address);
        }
    })
    console.log(`Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`)

    //Dynamic SVG NFT
    const highValue = ethers.utils.parseEther("4000"); // $4000
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer);
    const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue.toString());
    await dynamicSvgNftMintTx.wait(1);
    console.log(`Daynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`)
}