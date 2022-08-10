const { deployments, ethers } = require("hardhat")
const fs = require("fs");
const { assert, expect } = require("chai");

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
            console.log("high------",encodedHighSvg);
            console.log("high------",highSVG);
            console.log("low------",encodedLowSvg);
            console.log("low------",lowSVG);
            
            const base64LowSVG = await fs.readFileSync("./images/dynamicNft/frown.svg",{ encoding: "base64" });
            const base64HighSVG = await fs.readFileSync("./images/dynamicNft/happy.svg",{ encoding: "base64" });

            assert.equal(encodedLowSvg, prefix + base64LowSVG);
            assert.equal(encodedHighSvg, prefix + base64HighSVG);
            
            // Buffer.from(str, 'base64') and buf.toString('base64').
        })
    })
    describe('mintNFT', () => {
        it("mintNFT성공시 CreatedNFT 이벤트 발생", async function() {
            await new Promise(async (resolve,reject) => {                
                dynamicSvgNft.once("CreatedNFT", async(n) => {
                    try {
                        console.log("------CreatedNFT Emit-----",n);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                })
                try {
                    const highValue = 1000;
                    const txResponse = await dynamicSvgNft.mintNft(highValue);
                    const txReceipt = await txResponse.wait(1);
                    // console.log("txReceipt-------events",txReceipt.events);
                    // console.log(txReceipt.events[0].args);
                    // console.log(txReceipt.events[1].args);
                    const { tokenId, highValue:HighvalueInEvents } = txReceipt.events[1].args;
                    assert.equal(tokenId,0);
                    assert.equal(highValue,HighvalueInEvents);
                } catch (error) {
                    reject(error);
                }
            })
            console.log("end");
        })
    })
    describe('tokenURI', () => {
        it("토큰아이디가 없을경우(즉, mint중이 아닐경우) revert", async function() {
            const startTokenId = 0;
            const txResponse = dynamicSvgNft.tokenURI(startTokenId);
            await expect(txResponse).to.be.revertedWith("URI Query for nonexistent token")
        })
        it("mint가 완료되어 tokenID에 address(0)이 할당되고 string memory imageURI = i_lowImageURI;", async function() {
            const highValue = 1000;
            const mintTx =  await dynamicSvgNft.mintNft(highValue);
            const mintTxReceipt = await mintTx.wait(1);
            console.log("mintTX--------",mintTxReceipt);
            const startTokenId = 0;
            const txResponse = await dynamicSvgNft.tokenURI(startTokenId);
            console.log("tokenURI Res---------",txResponse);
            console.log("toString---------",txResponse.toString("utf8"));
            const sliced = txResponse.split(",");
            console.log("sliced----",sliced);
            // The base64 encoded input string
            // let base64string = "R2Vla3Nmb3JHZWVrcw==";
            
            // Create a buffer from the string
            // let bufferObj = Buffer.from(base64string, "base64");
            
            // Encode the Buffer as a utf8 string
            // let decodedString = bufferObj.toString("utf8");
            const bufferObj = Buffer.from(sliced[1], "base64");
            console.log("bufferObj------",bufferObj);
            const decodedString = bufferObj.toString("utf8");
            console.log("decodedString------",decodedString);
            const toJson = JSON.parse(decodedString);
            console.log(toJson);
            const imageProp = toJson.image;
            const split = imageProp.split(",")[1]
            const buffered = Buffer.from(split,"base64");
            const decoded = buffered.toString("utf-8");
            console.log("--------decoded",decoded);
            const highSVG = await fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf8"});
            console.log("--------highSVG",highSVG);
            assert.equal(decoded,highSVG);
        })
    })
})