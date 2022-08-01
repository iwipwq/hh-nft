const { developmentChains } = require("../helper-hardhat-config");

module.exports = async function (hre) {
  const { deployments, getNamedAccounts, network, ethers } = hre;

  const BASE_FEE = ethers.utils.parseEther("0.25"); // 0.25는 프리미엄, 리퀘스트당 0.25 LINK토큰이 필요
  const GAS_PRICE_LINK = 1e9; // 가스당 LINK, 링크토큰의 가스 가격에 기반해 계산된 값

  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const args = [BASE_FEE, GAS_PRICE_LINK];

  if (developmentChains.includes(network.name)) {
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: args,
    });
    log("---------------모의계약이 배포되었습니다.---------------");
  }
};

module.exports.tags = ["all", "mocks"];
