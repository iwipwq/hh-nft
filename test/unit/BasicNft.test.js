const { assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, deployments, getNamedAccounts, network } = require("hardhat");

describe("BasicNft", function () {
  console.log("테스트 코드 시작");
  let basicNft;
  beforeEach(async function () {
    await deployments.fixture("all");
    const { deployer } = await getNamedAccounts();
    basicNft = await ethers.getContract("BasicNft", deployer);
    console.log(basicNft.address)
  });
  describe("constructor", () => {
    it("토큰카운터가 0으로 초기화", async () => {
      const tokenCounter = (await basicNft.getTokenCounter()).toString();
      assert.equal(tokenCounter, "0");
    });
  });
  describe("mintNft", () => {
    it("토큰 카운터가 1 증가", async () => {
      const tokenCounterBeforeMinting = await basicNft.getTokenCounter();
      const tx = await basicNft.mintNft();
      const txReceipt = await tx.wait(network.config.blockConfirmations || 1);
      console.log("**mintNft호출**",txReceipt);
      console.log("**mintNft호출**",tx)
      const tokenCounterAfterMinting = await basicNft.getTokenCounter();
      assert.equal(
        (tokenCounterBeforeMinting.add(1)).toString(),
        tokenCounterAfterMinting.toString()
      );
    });
  });
  describe("tokenURI",() => {
    it("반환된 토큰 URI가 가지고있는 URI와 일치하는지", async () => {
      const tx = await basicNft.tokenURI([0])
      // const txReceipt = await tx.wait(network.config.blockConfirmations || 1);
      // console.log("**tokenURI호출**",txReceipt);
      console.log("**tokenURI호출**",tx);
      assert.equal(tx, await basicNft.TOKEN_URI());
    })
  });
});
