// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NeedMoreETHsent();
error RandomIpfsNft__TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // when we mint and NFT, we will trigger a CHainlink VRF call to get us a random number
    // using that number, we will get a random NFT
    // 308frame, 317frame, 335frame
    // 308 : super rare
    // 317 : rare
    // 335 : common

    // Type Declaration
    enum Rarity {
        frame308,
        frame317,
        frame335
    }

    VRFCoordinatorV2Interface public immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // VRF Helper
    mapping(uint256 => address) public s_requestIdToSender;

    // Test Variables
    uint256 public s_randomWords;
    uint256 public s_moddedRng;

    // NFT Variables
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 60;
    string[] internal s_frameTokenUris;
    uint256 internal i_mintFee;
    
    // Events
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Rarity frameRarity, address minter);

    constructor(
        address vrfCoordinatorV2,
        uint64 subcriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[3] memory frameTokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subcriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        s_frameTokenUris = frameTokenUris;
        i_mintFee = mintFee;
    }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft__NeedMoreETHsent();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender); 
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        console.log("fulfillRandomWords in RandomIpfsNft.sol");
        address frameOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        // What does this token look like?
        s_randomWords = randomWords[0];
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        s_moddedRng = moddedRng;
        Rarity frameRarity = getRarityFromModdedRng(moddedRng);
        s_tokenCounter++;
        _safeMint(frameOwner, newTokenId);
        _setTokenURI(newTokenId, s_frameTokenUris[uint256(frameRarity)]);
        emit NftMinted(frameRarity, frameOwner);
    }

    function withdraw() public payable onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__TransferFailed();
        }
    }

    function getRarityFromModdedRng(uint256 moddedRng)
        public
        pure
        returns (Rarity)
    {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (
                moddedRng >= cumulativeSum &&
                moddedRng < cumulativeSum + chanceArray[i]
            ) {
                return Rarity(i);
            }
            cumulativeSum += chanceArray[i];
        }
        revert RandomIpfsNft__RangeOutOfBounds();
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    // function tokenURI(uint256) public view override returns(string memory){}

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getFrameTokenUris(uint256 index)
        public
        view
        returns (string memory s_frameTokenUri)
    {
        if(index < s_frameTokenUris.length && index >= 0) {
            return s_frameTokenUris[index];
        } else {
            revert RandomIpfsNft__RangeOutOfBounds();
        }
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getFrameTokenUrisLength() public view returns (uint256) {
        return s_frameTokenUris.length;
    }

    function getSubscriptionId() public view returns (uint256) {
        return i_subscriptionId;
    }

    function getContractBalance() public view returns (uint256, address) {
        return (
            address(this).balance,
            address(this)
        );
    }
}
