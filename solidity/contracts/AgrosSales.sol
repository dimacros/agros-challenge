// SPDX-License-Identifier: MIT
pragma solidity  ^0.8.18;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { ERC1155URIStorageUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155URIStorageUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

contract AgrosSales is ERC1155URIStorageUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20Upgradeable for IAgrosToken;
    using StringsUpgradeable for uint256;

    uint public constant ORGANIC_NFT_ID = 1;
    uint public constant ASSOCIATED_NFT_ID = 2;

    IAgrosToken public agrosToken;

    event AssociatedProducer(
        address producer,
        string stamp,
        uint associatedAt
    );

    event OrganicProducer (
        address producer, 
        string stamp,
        string cropType,
        uint verifiedAt
    );

    mapping (address producer => uint fields) public filledFields;

    function initialize(IAgrosToken _agrosToken, string calldata baseUri) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ERC1155_init(string(abi.encodePacked(baseUri, "{id}.json")));
        _setBaseURI(baseUri);
        _setURI(ORGANIC_NFT_ID, string(abi.encodePacked(ORGANIC_NFT_ID.toString(), ".json")));
        _setURI(ASSOCIATED_NFT_ID, string(abi.encodePacked(ASSOCIATED_NFT_ID.toString(), ".json")));

        agrosToken = _agrosToken;
    }

    function _authorizeUpgrade(address) internal override view {
        _checkOwner();
    }

    function mintOne(address to, uint256 tokenId) public onlyOwner {
        _mint(to, tokenId, 1, "");
    }

    modifier oneNftPerAddress(uint tokenId) {
        require(balanceOf(msg.sender, tokenId) == 0, "AgrosSales: already purchased");
        _;
    }

    function verifyProducer(
        address producer, 
        uint fields, 
        bool isOrganic, 
        string calldata cropType
    ) public onlyOwner {
        uint remainingFields = fields - filledFields[producer];
        uint tokensToSend = remainingFields * 10 ** agrosToken.decimals();

        require(tokensToSend > 0, "AgrosSales: no tokens to send");

        agrosToken.mint(producer, tokensToSend);
        filledFields[producer] += remainingFields;

        if (isOrganic && balanceOf(producer, ORGANIC_NFT_ID) == 0) {
            _mint(producer, ORGANIC_NFT_ID, 1, "");

            emit OrganicProducer({
                producer: producer,
                stamp: uri(ORGANIC_NFT_ID),
                cropType: cropType,
                verifiedAt: block.timestamp
            });
        }
    }

    function purchaseAssociatedNFT() public oneNftPerAddress(ASSOCIATED_NFT_ID) {
        uint balance = agrosToken.balanceOf(msg.sender);
        uint agrosTokenCost = 8 * 10 ** agrosToken.decimals();

        require(balance >= agrosTokenCost, "AgrosSales: insufficient balance");

        agrosToken.burn(msg.sender, agrosTokenCost);
        _mint(msg.sender, ASSOCIATED_NFT_ID, 1, "");

        emit AssociatedProducer({
            producer: msg.sender,
            stamp: uri(ASSOCIATED_NFT_ID),
            associatedAt: block.timestamp
        });
    }
}

interface IAgrosToken is IERC20Upgradeable {
    function decimals() external view returns (uint8);
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}