import { Agenda, Job } from '@hokify/agenda';
import { AgrosSalesProxy } from './utils/AgrosSalesProxy';
import { env } from './env';
import { prisma } from './prisma';

const agenda = new Agenda({ 
    db: { 
        address: env.DATABASE_URL 
    },
    ensureIndex: true,
});

agenda.define<{ 
    producerId: string, 
    privateKey: string,
    txHash: string
}>('purchase associated nft', async job => {
    let { producerId, privateKey } = job.attrs.data;

    const agrosSales = new AgrosSalesProxy(privateKey);

    try {
        const receipt = await agrosSales.purchaseAssociateNFT();

        if (receipt.status) {
            await prisma.producer.update({
                where: { id: producerId },
                data: { associatedAt: new Date() }
            });
        }
    } catch (e) {
        console.error(e);
        job.schedule('1 minute');
        job.fail(e as Error);
    }

    await job.save();
});

agenda.on('start:purchase associated nft', _ => {
    console.log('Job started');
});

agenda.on('complete:purchase associated nft', _ => {
	console.log(`Job finished`);
});

export const cronjob = agenda;
