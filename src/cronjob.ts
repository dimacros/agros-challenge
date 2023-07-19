import { Agenda, Job } from '@hokify/agenda';
import { AgrosSalesProxy } from './utils/AgrosSalesProxy';
import { env } from './env';
import { prisma } from './prisma';

const agenda = new Agenda({ db: { address: env.DATABASE_URL } });

agenda.define('autotask: verify producers', async () => {

});

agenda.define<{ 
    producerId: string, 
    privateKey: string,
}>('purchase associated nft', async job => {
    const { producerId, privateKey } = job.attrs.data;
    
    const agrosSales = new AgrosSalesProxy(privateKey);

    const receipt = await agrosSales.purchaseAssociateNFT();

    if (receipt.status) {
        await prisma.producer.update({
            where: { id: producerId },
            data: { associatedAt: new Date() }
        });
    }
});

agenda.on('success:purchase associated nft', _ => {
    console.log('Purchase associated NFT success');
});

agenda.on('fail:purchase associated nft', (err: Error, _: Job) => {
	console.log(`Job failed with error: ${err.message}`);
});

export const cronjob = agenda;
