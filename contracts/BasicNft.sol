// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNft is ERC721 {
    string public constant TOKEN_URI = "ipfs://QmXH46oJifnKUDDemeixJZF9afH2yBPjCW5g8bqVqX6m9w";
    uint256 private s_tokenCounter;
    constructor() ERC721("flying01","FLY") {
        s_tokenCounter = 0;
    }

    function mintNft() public returns(uint256) {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
        return s_tokenCounter;
    }

    function tokenURI(uint256 /* tokenId */) public view override returns(string memory) {
        // require(_exists(tokenId))
        return TOKEN_URI;
    }

    function getTokenCounter() public view returns(uint256) {
        return s_tokenCounter;
    }
}