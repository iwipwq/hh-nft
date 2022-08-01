const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const pinataApiKey = process.env.PINATA_API_KEY
const pinataApiSecret = process.env.PINATA_API_SECRET
const pinata = pinataSDK(pinataApiKey, pinataApiSecret);

async function storeImages(imagesFilePath) {
  const fullImagesPath = path.resolve(imagesFilePath);
  // readdirSync 해당 폴더의 모든 내용을 읽기
  const files = fs.readdirSync(fullImagesPath);
  console.log(files);
  let responses = []
  console.log("파일을 Pinata 에 업로드하고 있습니다...")
  for (fileIndex in files) {
    console.log(`${fileIndex} 번째 파일을 작업중입니다.`)
    const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
    try {
        const response = await pinata.pinFileToIPFS(readableStreamForFile);
        responses.push(response);
    } catch (error) {
        console.log(error);
    }
  }
  return { responses, files }
}

async function storeTokenUriMetadata(metadata) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata);
        return response;
    } catch (error) {
        console.log(error);
    }
    return null;
}

module.exports = { storeImages, storeTokenUriMetadata };
