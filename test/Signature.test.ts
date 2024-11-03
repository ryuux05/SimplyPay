import hre from "hardhat"
import { expect } from "chai";
import {  Signature, Signer } from 'ethers'
import { Verifier2, Verifier2__factory } from "../typechain-types";

describe("Signature", function () {
    let signer: Signer;
    let recipient: Signer;
    let verifierContractFactory: Verifier2__factory;
    let verifier2: Verifier2;
    let signature: string;

    before(async function() {
        const signers = await hre.ethers.getSigners();
        signer = signers[0];
        recipient = signers[1];
        verifierContractFactory = await hre.ethers.getContractFactory("Verifier2");
        verifier2 = await verifierContractFactory.deploy();
        verifier2.waitForDeployment();
    })

    describe("Create signature", function () {
        it("Should create signature hex", async function() {

            // Define the domain and types
            const domain = {
            name: 'MyDApp',
            version: '1.0',
            chainId: 1, // Mainnet chain ID
            verifyingContract: await verifier2.getAddress(),
        };
        
        const types = {
            Withdrawal: [
                { name: 'action', type: 'string' },
                { name: 'amount', type: 'uint256' },
                { name: 'recipient', type: 'address' },
                { name: 'nonce', type: 'uint256' },
            ],
        };
        const currentNonce = await verifier2.nonces(signer);
        const nonce = hre.ethers.toNumber(currentNonce) + 1;
        
        // The message that was signed
        const message = {
            action: 'Withdraw',
            amount: hre.ethers.parseEther('10').toString(),
            recipient: await recipient.getAddress(),
            nonce: nonce,
        };
        
        signature = await signer.signTypedData(domain, types, message);
        
        expect(signature).not.null;
        //console.log(signature);
    })
   })

   describe("verify signature", function() {
       it("Should verify", async function() {
            const amount = hre.ethers.parseEther('10').toString();
            const _recipient = await recipient.getAddress();
            const currentNonce = await verifier2.nonces(signer);
            const nonce = hre.ethers.toNumber(currentNonce) + 1; // Add 1 to match the contract's expectation
            await expect(
                await verifier2.executeWithdrawal(
                    "Withdraw",
                    amount,
                    _recipient,
                    nonce,
                    signature
                )
            )
            .to.emit(verifier2, "Verified")
            .withArgs(1)
        })
   })
});