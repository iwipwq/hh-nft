const { expect, assert } = require("chai");
const { deployments, getNamedAccounts, ethers } = require("hardhat");

//fulfillRandomWords
describe("randomIpfsNft", () => {
  let randomIpfsNft, vrfCoordinatorV2Mock, deployer, subscriptionId, mintFee;
  beforeEach(async () => {
    //테스트 전 VRFCoordinatorV2Mock과 RandomIpfsNft 계약 배포
    // deployer = (await getNamedAccounts()).deployer;
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    console.log("account0", accounts[0].address);
    console.log("account1", accounts[1].address);
    console.log("account2", accounts[2].address);
    console.log("account3", accounts[3].address);
    await deployments.fixture(["mocks", "randomipfs"]);
    vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    randomIpfsNft = await ethers.getContract("RandomIpfsNft");
    mintFee = await randomIpfsNft.getMintFee();
    subscriptionId = await randomIpfsNft.getSubscriptionId();
    console.log("구독아이디", subscriptionId.toString());
    console.log(
      `vrf주소${vrfCoordinatorV2Mock.address}, randomIpfsNft주소${randomIpfsNft.address}`
    );
  });
  describe("requestNft", () => {
    it("사용자가 보낸 돈(msg.value)이 없거나 발행금액(i_mintFee)보다 작을 때 거절", async () => {
      await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
        "RandomIpfsNft__NeedMoreETHsent"
      );
    });
    it("NftRequested 이벤트를 emit 하고 requestId와 msg.sender를 인수로 가짐", async () => {
      const getSub = await vrfCoordinatorV2Mock.getSubscription(1);
      console.log(getSub.toString());
      // requestRandomWords가 s_consumers 배열에서 consumer를 찾지 못해서 consumer를 추가 (randomIpfsNft계약의 주소)
      // subId의 owner는 account[0], subscription의 consumer는 vrfCoordinator를 호출한 randomIpfsNft계약(msg.sender)
      await vrfCoordinatorV2Mock.addConsumer(
        subscriptionId,
        randomIpfsNft.address
      );
      const tx = await randomIpfsNft.requestNft({
        value: ethers.utils.parseEther("0.02").toString(),
      });
      await expect(tx).to.emit(randomIpfsNft, "NftRequested");

      const txReceipt = await tx.wait(1);
      console.log("events[0]----------",txReceipt.events[0]);
      console.log("events[1]----------",txReceipt.events[1]);
      console.log("events[1].topic---------",txReceipt.events[1].topics)
      assert.equal(txReceipt.events[1].args.requester, deployer.address);
      console.log(randomIpfsNft.interface.events['NftRequested(uint256,address)']);
    });
    it("s_requestIdToSender[requestId] === msg.sender", async () => {
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId,randomIpfsNft.address);
        const tx = await randomIpfsNft.requestNft({value: mintFee});
        const txReceipt = await tx.wait(1);
        const requestId = txReceipt.events[1].args.requestId;
        const msgSender = txReceipt.events[1].args.requester;
        const endingRequestIdToSender = await randomIpfsNft.s_requestIdToSender(requestId)
        assert.equal(endingRequestIdToSender, msgSender);
    })
  });

});
