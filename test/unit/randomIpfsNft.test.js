const { expect, assert } = require("chai");
const { deployments, getNamedAccounts, ethers } = require("hardhat");

//fulfillRandomWords
describe("randomIpfsNft", () => {
  console.log("randomIfpsNft 테스트 시작 ... ");
  let randomIpfsNft,
    vrfCoordinatorV2Mock,
    deployer,
    subscriptionId,
    mintFee,
    accounts;
  const FUND_AMOUNT = ethers.utils.parseEther("10")
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
      // @chainlink/contract@0.4.2 일 경우
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
      console.log(
        randomIpfsNft.interface.events["NftRequested(uint256,address)"]
      );
    });
    it("s_requestIdToSender[requestId] === msg.sender", async () => {
      await vrfCoordinatorV2Mock.addConsumer(
        subscriptionId,
        randomIpfsNft.address
      );
      const tx = await randomIpfsNft.requestNft({ value: mintFee });
      const txReceipt = await tx.wait(1);
      const requestId = txReceipt.events[1].args.requestId;
      const msgSender = txReceipt.events[1].args.requester;
      const endingRequestIdToSender = await randomIpfsNft.s_requestIdToSender(
        requestId
      );
      assert.equal(endingRequestIdToSender, msgSender);
    });
  });
  describe("fulfillRandomWords", () => {
    it("requestRandomWords가 NFTRequested 이벤트를 발생시키면 동작", async () => {
      await new Promise(async (resolve, reject) => {
        console.log("vrfCoord fulfillRanwords Promise");
        vrfCoordinatorV2Mock.once("RandomWordsFulfilled", async (txReceipt) => {
          try {
            console.log("txReceipt?", txReceipt.toString());
            console.log("!!!!!!!!!!!!!!!!wow!!!!!!!!!!");
            //이tx 어케잡음?
            // const randomWord = await vrfCoordinatorV2Mock.randomWords();
            // const callReq = await vrfCoordinatorV2Mock.callRequests();
            // console.log("!!!!!!!!!!!!!!!",randomWord.toString());
            // console.log("!!!!!!!!!!!!!!!",randomWord);
            // console.log("!!!!!!!!!!!!!!!",callReq);
          } catch (error) {
            console.log(error);
            reject();
          }
          resolve();
        });
        console.log("randomIpfsNft Promise");
        randomIpfsNft.once("NftMinted", async (tx) => {
          try {
            console.log("tx", tx);
            console.log("NftMinted Event emitted");
          } catch (error) {
            console.log(error);
            reject(error);
          }
          resolve();
        });
        await vrfCoordinatorV2Mock.addConsumer(
          subscriptionId,
          randomIpfsNft.address
        );
        const requestNftTx = await randomIpfsNft.requestNft({ value: mintFee });
        const requestNftTxReceipt = await requestNftTx.wait(1);
        const { requestId, requester } = requestNftTxReceipt.events[1].args;
        // console.log(requestId);
        // console.log(requester);
        // console.log("----------------txreceipt",requestNftTxReceipt.events[0]);
        // console.log("----------------txreceipt",requestNftTxReceipt.events[1]);

        const fulfillRandomWordsTx =
          await vrfCoordinatorV2Mock.fulfillRandomWords(
            requestId,
            randomIpfsNft.address
          );
        const fulfillRandomWordsTxReceipt = await fulfillRandomWordsTx.wait(1);
        // console.log("---------fulfillTX---------",fulfillRandomWordsTxReceipt);

        await expect(fulfillRandomWordsTx).to.emit(
          vrfCoordinatorV2Mock,
          "RandomWordsFulfilled"
        );
        await expect(fulfillRandomWordsTx).to.emit(randomIpfsNft, "NftMinted");
        const blockNum = await vrfCoordinatorV2Mock.provider.getBlockNumber();
        // console.log("블럭넘버",blockNum);
        const getBlock7 = await vrfCoordinatorV2Mock.provider.getBlock(7);
        const getBlock8 = await vrfCoordinatorV2Mock.provider.getBlock(8);
        // console.log("---블럭7---",getBlock7);
        // console.log("---블럭8---",getBlock8);
        // console.log("moddedRng", await requestNftTx)

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
      });
    });
    it("chanceArray 계산중 배열범위 초과시 RandomIpfsNft__RangeOutOfBounds()와 함께 revert", async () => {
      const outOfRangeIndex = -1;
      const tx = randomIpfsNft.getRarityFromModdedRng;
      await expect(tx(outOfRangeIndex)).to.be.reverted;
    });
    it("getTokenCounter 가 nftMinted emit마다 +1씩 증가", async () => {
      await new Promise(async (resolve, reject) => {
        const startingTokenCounter = await randomIpfsNft.getTokenCounter();
        randomIpfsNft.once("NftMinted", async (tx) => {
          console.log("Minted----", tx);
          console.log(startingTokenCounter);
          try {
            const endingTokenCounter = await randomIpfsNft.getTokenCounter();
            assert.equal(
              endingTokenCounter.toString(),
              startingTokenCounter.add("1").toString()
            );
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        try {
          await vrfCoordinatorV2Mock.addConsumer(
            subscriptionId,
            randomIpfsNft.address
          );
          const requestNftTx = await randomIpfsNft.requestNft({ value: mintFee });
          console.log("requestNftTx---------", requestNftTx);
          const requestNftTxReceipt = await requestNftTx.wait(1);
          const { requestId } = requestNftTxReceipt.events[1].args;
          const tx = await vrfCoordinatorV2Mock.fulfillRandomWords(
            requestId,
            randomIpfsNft.address
          );
          console.log("fulfillRandomWordsTx----------", tx);
          const txReceipt = await tx.wait(1);
          console.log("fulfillTxReciept-----", txReceipt);
        } catch (error) {
          reject(error);
        }
      });
    });
  });
  describe("getFrameTokenUris", () => {
    it("getFrameTokenUris 가 올바른 범위안에서 frameTokenUri반환", async () => {
      const tokenUrlsLength = await randomIpfsNft.getFrameTokenUrisLength();
      console.log(tokenUrlsLength);
      const tx = randomIpfsNft.getFrameTokenUris;
      await expect(tx(tokenUrlsLength)).to.be.revertedWith(
        "RandomIpfsNft__RangeOutOfBounds"
      );
      const txReceipt = await tx(0);
    });
  })
  describe("withdraw", () => {
    it("requestNft를 요청하면 mintFee만큼 계약에 돈이 들어오고 withdraw를 요청하면 계약에 들어있는 balance를 정상적으로 인출", async () => {
      // Ownable.sol
      const owner = await randomIpfsNft.owner();
      console.log(owner);
      const initialBalance = (await randomIpfsNft.getContractBalance())[0]
      await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomIpfsNft.address);
      const sendEthTx = await randomIpfsNft.requestNft({value: mintFee});
      await sendEthTx.wait(1);
      console.log("before",(await randomIpfsNft.getContractBalance()).toString());
      const afterRequestNftBalance = (await randomIpfsNft.getContractBalance())[0];
      assert.equal(initialBalance.add(mintFee).toString(),afterRequestNftBalance.toString());
      await randomIpfsNft.withdraw();
      console.log("after",(await randomIpfsNft.getContractBalance()).toString());
      const afterWithdrawBalance = (await randomIpfsNft.getContractBalance())[0]; 
      assert.equal(afterRequestNftBalance.sub(mintFee).toString(),afterWithdrawBalance.toString());
      // await expect(randomIpfsNft.withdraw()).to.be.revertedWith("RandomIpfsNft__TransferFailed");
    });
  });
});
