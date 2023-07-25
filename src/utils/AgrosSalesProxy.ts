import Web3, { utils } from "web3";
import { AgrosSalesAbi, AgrosTokenAbi } from '../abi';
import { env } from "../env";

export class AgrosSalesProxy {
    private signer;
    private web3;
    private agrosSaleSC;
    private agrosTokenSC;

    constructor(privateKey: string) {
        this.web3 = new Web3(env.WEB3_PROVIDER_URL);
        this.web3.eth.accounts.wallet.add(privateKey);

        this.signer = this.web3.eth.accounts.wallet[0].address;

        const options = {
            from: this.signer,
        }

        const agrosSale = new this.web3.eth.Contract(
            AgrosSalesAbi, 
            env.AGROS_SALES_ADDRESS,
            options
        );

        const agrosToken = new this.web3.eth.Contract(
            AgrosTokenAbi, 
            env.AGROS_TOKEN_ADDRESS,
            options
        );

        this.agrosSaleSC = agrosSale.methods;
        this.agrosTokenSC = agrosToken.methods;
    }

    getEvents() {
        return this.agrosSaleSC.events;
    }

    async checkRulesForPurchaseNFT() {
        const { signer, agrosTokenSC, agrosSaleSC } = this;

        const result = { err: '', ok: true };
        const associateNftId = await agrosSaleSC.ASSOCIATED_NFT_ID().call();
        const tokens = await this.web3.eth.getBalance(signer);
        const agrosTokens = await agrosTokenSC.balanceOf(signer).call<bigint>();

        const ownNfts = await agrosSaleSC.balanceOf(signer, associateNftId).call();
        const nftPrice = utils.toBigInt(utils.toWei(8, 'ether'));

        if (tokens < 100000) {
           return { err: `Not enough ether: your balance is ${tokens} wei`, ok: false };
        }

        if (agrosTokens < nftPrice) {
            const amount = utils.fromWei(tokens, 'ether');

           return { err: `Not enough tokens: your balance is ${amount} AGT`, ok: false };
        }

        if (ownNfts) {
           return { err: 'You already own this NFT', ok: false };
        }

        return result;
    }

    async purchaseAssociateNFT() {
        const { signer, agrosSaleSC } = this;

        const nonce = await this.web3.eth.getTransactionCount(signer);

        return agrosSaleSC.purchaseAssociatedNFT().send({
            gas: '100000',
            gasPrice: utils.toWei('1', 'gwei'),
            nonce: utils.toHex(nonce),
        });
    }
}