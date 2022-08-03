const { expect, assert } = require("chai");
const { deployments, getNamedAccounts, ethers } = require("hardhat");

//fulfillRandomWords
describe("randomIpfsNft", () => {
    console.log("randomIfpsNft 테스트 시작 ... ")
  let randomIpfsNft, vrfCoordinatorV2Mock, deployer, subscriptionId, mintFee, accounts
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
    //   console.log("events[0]----------",txReceipt.events[0]);
    //   console.log("events[1]----------",txReceipt.events[1]);
    //   console.log("events[1].topic---------",txReceipt.events[1].topics)
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
  describe('fulfillRandomWords', () => {
    it("requestRandomWords가 NFTRequested 이벤트를 발생시키면 동작", async () => {
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId,randomIpfsNft.address);
        const requestNftTx = await randomIpfsNft.requestNft({value: mintFee});
        const requestNftTxReceipt = await requestNftTx.wait(1);
        const { requestId, requester } = requestNftTxReceipt.events[1].args;
        console.log(requestId);
        console.log(requester);
        console.log("----------------txreceipt",requestNftTxReceipt.events[0]);
        console.log("----------------txreceipt",requestNftTxReceipt.events[1]);
        console.log("----------------txreceipt",requestNftTxReceipt.events[2]);
        await new Promise(async (resolve,rejcet) => {
            vrfCoordinatorV2Mock.once("RandomWordsFulfilled", async () => {
                try {
                    console.log("!!!!!!!!!!!!!!!!wow!!!!!!!!!!");
                    //이tx 어케잡음?
                } catch (error) {
                    console.log(error);
                    rejcet();
                }
                resolve();
            })
        })

        // const tx = await vrfCoordinatorV2Mock.fulfillRandomWords(requestId,requester);
        // await expect(tx).to.emit(vrfCoordinatorV2Mock,"NftMinted");
        // const txReceipt = await tx.wait(1);
        // console.log(txReceipt.events[0].args);
        // const { outputSeed, payment, success } = txReceipt.events[0].args;
        // console.log(`outputSeed: ${outputSeed.toString()}, payment: ${payment.toString()}, success: ${success}`)
        // const randomWords = await randomIpfsNft.s_randomWords;
        // console.log("------난수------",(await randomWords()).toString());
        // const fulfill = await randomIpfsNft.fulfillRandomWords;
        // console.log("--------함수존재여부-------", fulfill);

        // const requestNftTxHash = requestNftTxReceipt.hash;
        // await new Promise(async (resolve,reject) => {
        //     randomIpfsNft.once("NftRequested", async () => {
        //         console.log("NftRequested 이벤트를 감지했습니다.");
        //         randomIpfsNft.fulfillRandomWords()
        //     })
        // })
    })
  })

});
