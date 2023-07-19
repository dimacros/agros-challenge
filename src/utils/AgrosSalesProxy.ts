import Web3, { utils } from "web3";
import { AgrosSalesAbi, AgrosTokenAbi } from '../abi';
import { env } from "../env";

export class AgrosSalesProxy {
    private wallet;
    private web3;
    private agrosSaleSC;
    private agrosTokenSC;

    constructor(privateKey: string) {
        this.web3 = new Web3(env.WEB3_PROVIDER_URL);
        this.wallet = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        this.web3.eth.accounts.wallet.add(this.wallet);

        const options = {
            from: this.wallet.address,
        }

        this.agrosSaleSC = new this.web3.eth.Contract(
            AgrosSalesAbi, 
            env.AGROS_SALES_ADDRESS,
            options
        );

        this.agrosTokenSC = new this.web3.eth.Contract(
            AgrosTokenAbi, 
            env.AGROS_TOKEN_ADDRESS,
            options
        );
    }

    getEvents() {
        return this.agrosSaleSC.events;
    }

    async purchaseAssociateNFT() {
        const { wallet, agrosTokenSC, agrosSaleSC } = this;
        const { balanceOf } = agrosTokenSC.methods;
        const { ASSOCIATED_NFT_ID, balanceOf: nftCount, purchaseAssociatedNFT } = agrosSaleSC.methods;

        const associateNftId = await ASSOCIATED_NFT_ID().call<bigint>();
        const tokens = await this.web3.eth.getBalance(wallet.address);
        const agrosTokens = await balanceOf(wallet.address).call<bigint>();
        const ownNfts = await nftCount(wallet.address, associateNftId).call<boolean>();
        const nftPrice = utils.toBigInt(utils.toWei(8, 'ether'));

        if (tokens < 100000) {
            throw new Error(`Not enough ether: your balance is ${tokens} wei`);
        }

        if (agrosTokens < nftPrice) {
            const amount = utils.fromWei(tokens, 'ether');

            throw new Error(`Not enough tokens: your balance is ${amount} AGT`);
        }

        if (ownNfts) {
            throw new Error('You already own this NFT');
        }

        const nonce = await this.web3.eth.getTransactionCount(wallet.address);
        const receipt = await purchaseAssociatedNFT().send({
            gas: '100000',
            gasPrice: utils.toWei('1', 'gwei'),
            nonce: utils.toHex(nonce),
        });

        return receipt;
    }
}