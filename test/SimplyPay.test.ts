import hre from "hardhat"
import { expect } from "chai";
import {  Contract, Signature, Signer } from 'ethers'
import { SimplyPay, SimplyPay__factory } from "../typechain-types";
import { ABI } from "./ERC_ABI.json"

describe("SimplyPay", function() {
    //Whale address
    const USDTWHALE_Address = "0xf977814e90da44bfa03b6295a0616a897441acec";

    const usdtAbi = [
        'function approve(address _spender, uint256 _value) public',
        'function allowance(address _owner, address _spender) public view returns (uint256)',
        'function balanceOf(address _owner) public view returns (uint256)',
        'function transfer(address _to, uint256 _value) public',
        'function transferFrom(address _from, address _to, uint256 _value) public',
    ];

    let signer: Signer;
    let deployer: Signer;
    let whale_addr: Signer;
    let addr1: Signer;
    let addr2: Signer;
    let addr3: Signer;
    let addr4: Signer;
    let addrs: Signer[];
    let usdt: Contract;
    let simplyPayContractFactory: SimplyPay__factory;
    let simplyPay: SimplyPay;
    let signature: string;
    let expireTime: number;

    async function getImpersonatedSigner(address: string): Promise<Signer> {
        await hre.ethers.provider.send('hardhat_impersonateAccount',[address]);
        
        await signer.sendTransaction({
            to: address,
            value: hre.ethers.parseEther("1") 
        });
        
        return await hre.ethers.getSigner(address);
    }

    async function createSignature(_signer: Signer, _amount: bigint): Promise<{signature: string, message: any}> {
         // Define the domain and types
         const domain = {
            name: 'SimplyPay',
            version: '1.0',
            chainId: 1, // Mainnet chain ID
            verifyingContract: await simplyPay.getAddress(),
        }

        const types = {
            PaymentRequest: [
                {name: "sender", type:"address"},
                {name: "amount", type:"uint256"},
                {name: "nonce", type:"uint256"},
                {name: "expire", type:"uint256"},
            ],
        }

        const currentNonce = await simplyPay.nonces(_signer);
        const nonce = hre.ethers.toNumber(currentNonce) + 1;

        // Get the current time in seconds since Unix epoch
        const currentTime = Math.floor(Date.now() / 1000);

        const expireTime = currentTime + 5 * 60; 

        const message = {
            sender: await _signer.getAddress(),
            amount: _amount,
            nonce: nonce,
            expire: expireTime
        }

        signature = await _signer.signTypedData(domain, types, message);

        return {
            signature: signature,
            message: message
        };
    }

    before(async function() {
        [signer, deployer, addr1, addr2, addr3, addr4, ...addrs] = await hre.ethers.getSigners();

        whale_addr = await getImpersonatedSigner(USDTWHALE_Address);

        simplyPayContractFactory = await hre.ethers.getContractFactory("SimplyPay", deployer);

        simplyPay = await simplyPayContractFactory.deploy();

        simplyPay.waitForDeployment();
    })

    before(async function() {
        const ERC_ABI = ABI;

        const USDT_addr = "0xdac17f958d2ee523a2206206994597c13d831ec7"

        const depositAmount = hre.ethers.parseUnits("10000", 6);

        usdt = new hre.ethers.Contract(USDT_addr, usdtAbi, deployer);

        const tx = await usdt.connect(whale_addr).approve(await simplyPay.getAddress(), depositAmount, {gasLimit:1000000});
        await tx.wait();

        const txx = await usdt.connect(whale_addr).transfer(await addr1.getAddress(), depositAmount);
        await txx.wait();

        const num_usdt = hre.ethers.formatUnits((await usdt.balanceOf(whale_addr)), 6);
        const num_usdt2 = hre.ethers.formatUnits((await usdt.balanceOf(await addr1.getAddress())), 6);

        //console.log("Whale USDT: ",num_usdt);
        //console.log("Addr1 USDT: ",num_usdt2);
    })

    describe("Create and verify signature", function () {
        it("Should create signature", async function() {
            // Define the domain and types
            const domain = {
                name: 'SimplyPay',
                version: '1.0',
                chainId: 1, // Mainnet chain ID
                verifyingContract: await simplyPay.getAddress(),
            }

            const types = {
                PaymentRequest: [
                    {name: "sender", type:"address"},
                    {name: "amount", type:"uint256"},
                    {name: "nonce", type:"uint256"},
                    {name: "expire", type:"uint256"},
                ],
            }

            const currentNonce = await simplyPay.nonces(signer);
            const nonce = hre.ethers.toNumber(currentNonce) + 1;

            // Get the current time in seconds since Unix epoch
            const currentTime = Math.floor(Date.now() / 1000);

            expireTime = currentTime + 5 * 60; 
            
            const message = {
                sender: await signer.getAddress(),
                amount: hre.ethers.parseEther("10").toString(),
                nonce: nonce,
                expire: expireTime
            }

            signature = await signer.signTypedData(domain, types, message);

            expect(signature).not.null
        })

        it("Should verify signature", async function() {
            const amount = hre.ethers.parseEther("10").toString();
            const currentNonce = await simplyPay.nonces(signer);
            const nonce = hre.ethers.toNumber(currentNonce) + 1;

            const request = {
                sender: await signer.getAddress(),
                amount: amount,
                nonce: nonce,
                expire: expireTime
            }

            expect(
                await simplyPay.verifySignature(
                    request,
                    signature
                )
            )
            .to.be.true;
            //.to.emit(simplyPay, "SignatureVerified");
        })
    })

    describe("Deposit and withdraw funds", function() {
        it("Should be able to deposit", async function() {
            const depositAmount = hre.ethers.parseUnits("100000", 6);

            //Reset spending to 0
            const resetTx = await usdt.connect(whale_addr).approve(await simplyPay.getAddress(), 0);
            await resetTx.wait();   

            // Approve the vault to spend user's USDT
            const tx = await usdt.connect(whale_addr).approve(await simplyPay.getAddress(), depositAmount);
        
            await tx.wait();

            // User deposits USDT into the vault
            const txx = await simplyPay.connect(whale_addr).deposit(depositAmount, {gasLimit:1000000})

            await txx.wait();
       
            expect(txx).to.emit(simplyPay, "Deposit")
            .withArgs(whale_addr.getAddress(), depositAmount);

            //Check balances;
            expect(await simplyPay.getUSDTBalance())
            .to.equal(depositAmount);
        })

        it("Should keep track on user balance", async function() {
            const depositAmount = hre.ethers.parseUnits("10000", 6);

            const totalAmunt = hre.ethers.parseUnits("110000", 6);

            const tx = await usdt.connect(addr1).approve(await simplyPay.getAddress(), depositAmount);

            await tx.wait();

            // User deposits USDT into the vault
            const txx = await simplyPay.connect(addr1).deposit(depositAmount, {gasLimit:1000000})

            await txx.wait();
       
            expect(txx).to.emit(simplyPay, "Deposit")
            .withArgs(addr1.getAddress(), depositAmount);

            //Check balances;
            expect(await simplyPay.getUSDTBalance())
            .to.equal(totalAmunt);

            //Check user balance;
            expect(
                await simplyPay.balances(addr1.getAddress())
            ).to.equal(depositAmount);

        })
        it("Should be able to withdraw", async function() {
            const withdrawAmount = hre.ethers.parseUnits("10000", 6);

            const num_usdt = hre.ethers.formatUnits((await usdt.balanceOf(await addr1.getAddress())), 6);

            //console.log("Addr1 USDT: ",num_usdt);
            expect(num_usdt).to.equal("0.0");

            // User deposits USDT into the vault
            const tx = await simplyPay.connect(addr1).withdraw(withdrawAmount, {gasLimit:1000000})

            await tx.wait();

            expect(tx).to.emit(simplyPay, "Withdraw")
            .withArgs(addr1.getAddress(), withdrawAmount);

            const num_usdt2 = hre.ethers.formatUnits((await usdt.balanceOf(await addr1.getAddress())), 6);

            //console.log("Addr1 USDT: ",num_usdt2);
            expect(num_usdt2).to.be.equal("10000.0");
            
        })
        it("Should be reverted", async function () {
            const withdrawAmount = hre.ethers.parseUnits("10000", 6);
            await expect(
                simplyPay.connect(addr1).withdraw(withdrawAmount, {gasLimit:1000000})
            ).to.be.revertedWith("Insufficient balance");
        })

    })

    describe("Generate signature and do transaction", function() {
        it("Should move the funds", async function() {
            //addr2 is the merchant
            //whale_addr is the user

            //Get balances from USDT contract
            const addr2_balance = hre.ethers.formatUnits((await usdt.balanceOf(await addr2.getAddress())), 6);

            //console.log("addr2 balance: ",addr2_balance);
            const amount = hre.ethers.parseUnits("10000", 6);
            const {signature, message} = await createSignature(addr2, amount);

            const tx = await simplyPay.connect(whale_addr).transact(message, signature);

            await tx.wait();

            expect(tx).to.emit(simplyPay, "PaymentSuccess")
            .withArgs(whale_addr.getAddress(), addr2.getAddress());

            //Get balances from USDT contract
            const addr2_balance2 = hre.ethers.formatUnits((await simplyPay.balances(addr2.getAddress())), 6);

            //console.log("addr2 balance: ",addr2_balance2);

            //Get balance from SimplyPay
            expect(
                await simplyPay.balances(addr2.getAddress())
            ).to.equal(amount);
        })
        it("Should revert with Insufficient balance", async function() {
            const amount = hre.ethers.parseUnits("100000", 6);
            const {signature, message} = await createSignature(addr3, amount);

            await expect(
                simplyPay.connect(addr2).transact(message, signature)
            ).to.be.revertedWith("Insufficient balance")
        })
        it("Should revert with Signature is invalid", async function() {
            const amount = hre.ethers.parseUnits("100000", 6);
            const {signature, message} = await createSignature(addr3, amount);

            const currentNonce = await simplyPay.nonces(addr3);
            const nonce = hre.ethers.toNumber(currentNonce) + 1;

            const customMessage = {
                sender: await addr1.getAddress(),
                amount: amount,
                nonce: nonce,
                expire: expireTime
            }

            await expect(
                simplyPay.connect(addr2).transact(customMessage, signature)
            ).to.be.revertedWith("Signature is invalid")
        })
       
    })
})