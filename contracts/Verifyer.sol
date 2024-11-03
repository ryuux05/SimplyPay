// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

contract Verifyer is EIP712 {

    mapping(address => uint256) private _nonces;

    struct Message {
        address signer;
        string action;
        uint256 amount;
        address recipient;
        uint256 nonce;
        bytes signature;
    }

    //Events
    event Verified(uint256 nonce);

    bytes32 private constant _MESSAGE_TYPEHASH = keccak256("Withdrawal(string action,uint256 amount,address recipient,uint256 nonce)");
    
 constructor() EIP712("Verifyer","1") { }

 function verify(Message calldata message) public {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(message.signature);
        bytes32 structHash = keccak256(abi.encode(_MESSAGE_TYPEHASH,message.action,message.amount,message.recipient,message.nonce));
        address signer = ECDSA.recover(_hashTypedDataV4(structHash), v, r, s);
        require(signer == message.signer, "invalid signature");

        _nonces[msg.sender] += 1;

        emit Verified(message.nonce);
 }
 
    function getNonce() public view returns (uint256) {
        return _nonces[msg.sender];
    }

    function splitSignature(bytes memory signature) internal virtual returns (bytes32 r, bytes32 s, uint8 v) {
        require(signature.length == 65, "invalid signature length");

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(signature, 32))
            // second 32 bytes
            s := mload(add(signature, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(signature, 96)))
        }
    }
}