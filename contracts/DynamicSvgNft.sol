// DynamicSvgNft.sol
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "base64-sol/base64.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract DynamicSvgNft is ERC721 {
    // mint
    // sotre our SVG information somewhere
    // some logic to say "Show X image" or "Show Y image"

    uint256 private s_tokenCounter;
    string private i_lowImageURI;
    string private i_highImageURI;
    string private constant base64encodedSvgPrefix = "data:image/svg+xml;base64,"; 
    AggregatorV3Interface internal immutable i_priceFeed;
    mapping (uint256 => int256) public s_tokenIdToHighValue;

    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    constructor(address priceFeedAddress, string memory lowSvg, string memory highSvg) ERC721("DynamicSvgNft","DSN") {
        s_tokenCounter = 0;
        i_lowImageURI = svgToImageURI(lowSvg) ;
        i_highImageURI = svgToImageURI(highSvg);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function svgToImageURI(string memory svg) public pure returns (string memory) {
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(base64encodedSvgPrefix, svgBase64Encoded));
    }
    
    function mintNft(int256 highValue) public {
        s_tokenIdToHighValue[s_tokenCounter] = highValue;
        _safeMint(msg.sender, s_tokenCounter);
        emit CreatedNFT(s_tokenCounter, highValue);
        s_tokenCounter++;
    }

    function _baseURI() internal pure override returns(string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI Query for nonexistent token");
        // string memory imageURI = "hi";

        ( , int256 price, , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = i_lowImageURI;
        if(price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = i_highImageURI;
        }

        return
            string(
                abi.encodePacked( // 두가지를 합쳐서 인코딩
                    _baseURI(), //<-  여기까지가 data:application/json;base64,(프리팩스) |  여기서부터 base64인코딩된 이미지 ->
                        Base64.encode(
                            bytes(
                                abi.encodePacked(
                                    '{"name":"',name(),'", "description":"An NFT thaht changes based on chainlink Feed!",',
                                    '"attribute":[{"trait_type": "coolness", "value":100}], "image":"',
                                    imageURI,
                                    '"}'
                                )
                            )
                        )
                )
            );

    }

}