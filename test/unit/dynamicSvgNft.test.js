const { deployments, ethers } = require("hardhat")
const fs = require("fs");
const { assert } = require("chai");

describe('DynamicSvgNft', () => {
    let dynamicSvgNft, mockV3Aggregator;
    const prefix = "data:image/svg+xml;base64,";
    beforeEach(async function() {
        await deployments.fixture(["dynamicsvg","mocks"]);
        dynamicSvgNft = await ethers.getContract("DynamicSvgNft");
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator");
    })
    describe('constructor', () => {

    })
    describe('svgToImageURI', () => {
        it("svg파일을 주면 컨스트럭터에서 할당된 값과 동일", async function() {
            const lowSVG = await fs.readFileSync("./images/dynamicNft/frown.svg",{ encoding: "utf8" });
            const highSVG = await fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf8"});
            const encodedLowSvg =  await dynamicSvgNft.svgToImageURI(lowSVG);
            const encodedHighSvg =  await dynamicSvgNft.svgToImageURI(highSVG);
            console.log(encodedHighSvg.includes(prefix));
            console.log(encodedHighSvg);
            
            const base64LowSVG = await fs.readFileSync("./images/dynamicNft/frown.svg",{ encoding: "base64" });
            const base64HighSVG = await fs.readFileSync("./images/dynamicNft/happy.svg",{ encoding: "base64" });

            assert.equal(encodedLowSvg, prefix + base64LowSVG);
            assert.equal(encodedHighSvg, prefix + base64HighSVG);
            
            // Buffer.from(str, 'base64') and buf.toString('base64').
        })
    })
    describe('tokenURI', () => {
        it("string memory imageURI = i_lowImageURI;", async function() {
            const startTokenId = 0;
            const txResponse = await dynamicSvgNft.tokenURI(startTokenId);
            const txReceipt = txResponse.wait(1);
        })
    })
})