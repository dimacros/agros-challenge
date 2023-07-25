import { Web3, utils } from 'web3';
import { AgrosSalesAbi } from './abi';
import { env } from './env';
import { prisma } from './prisma';
import { ProducerController } from './producers/ProducerController';

export async function autotask() {
    const web3 = new Web3(env.WEB3_PROVIDER_URL);
    const privateKey = Buffer.from(env.METAMASK_PRIVATE_KEY ?? '', 'hex');
    const signer = web3.eth.accounts.privateKeyToAccount(privateKey);

    web3.eth.accounts.wallet.add(signer.privateKey);

    const AgrosSales = new web3.eth.Contract(AgrosSalesAbi, env.AGROS_SALES_ADDRESS, {
        from: signer.address,
        gasPrice: utils.toWei('1', 'gwei'),
        gas: '1000000',
    });

    const controller = new ProducerController(prisma.producer);
    const producers = await controller.getProducers({ page: 1, limit: 100 });
    const readyProducers = producers.map(p => ({
        address: p.address,
        fields: Object.entries(p.producerInfo).filter(([_, v]) => v).length,
        isOrganic: p.producerInfo.isOrganic,
        cropType: p.producerInfo.cropType ?? 'none',
    })).filter(p => p.fields >= 1);

    for (const producer of readyProducers) {
        const { address, fields, isOrganic, cropType } = producer;
        const { paidFields, verifyProducer } = AgrosSales.methods;

        const totalPaidFields = await paidFields(address).call<bigint>();

        if (fields <= totalPaidFields) {
            console.log('Producer fields already paid');
            continue;
        }

        try {
            const nonce = await web3.eth.getTransactionCount(signer.address);

            await verifyProducer(address, fields, isOrganic, cropType).send({
                nonce: utils.toHex(nonce),
            });

            console.log(`Producer ${address} verified with ${fields} AGR token(s)`);
        } catch (e) {
            console.error(e);
        }
    }
}

autotask().catch(e => {
    console.error(e);
}).finally(() => {
    process.exit(1);
});