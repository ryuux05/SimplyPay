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

    async function getImpersonatedSigner(address: string): Promise<Signer> {
        await hre.ethers.provider.send('hardhat_impersonateAccount',[address]);
        
        await signer.sendTransaction({
            to: address,
            value: hre.ethers.parseEther("1") 
        });
        
        return await hre.ethers.getSigner(address);
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

        usdt = new hre.ethers.Contract(USDT_addr, usdtAbi, deployer);

        const num_usdt = hre.ethers.formatUnits((await usdt.balanceOf(whale_addr)), 6);

        console.log("USDT: ",num_usdt);
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
                ],
            }

            const currentNonce = await simplyPay.nonces(signer);
            const nonce = hre.ethers.toNumber(currentNonce) + 1;

            const message = {
                sender: await signer.getAddress(),
                amount: hre.ethers.parseEther("10").toString(),
                nonce: nonce
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
                nonce: nonce
            }

            const sender = await signer.getAddress()

            await expect(
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
            const depositAmount = hre.ethers.parseUnits("5357882847", 6);

            // Approve the vault to spend user's USDT
            const tx = await usdt.connect(whale_addr).approve(await simplyPay.getAddress(), depositAmount, {gasLimit:1000000});
        
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

        it("Should be able to withdraw")

        it("Should keep track on user balance")

        
    })

    describe("Generate URL and do transaction", function() {

    })
})