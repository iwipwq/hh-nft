const { run } = require("hardhat");

async function verify(contractAddress,args) {
    console.log("계약 검증을 시도하는중입니다...")
  try {
    await run("verify:verify", {
        address: contractAddress,
        constructorArguments: args,
    });
    console.log("계약이 검증되었습니다.");
  } catch (error) {
    if (error.message.includes("already verified")) {
      console.log("이미 검증된 계약입니다.");
      return;
    }
    console.log(error);
  }
}

module.exports = { verify }
