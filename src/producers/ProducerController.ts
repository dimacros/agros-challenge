import { Prisma, PrismaClient } from "@prisma/client";
import { cronjob } from "../cronjob";
import { AgrosSalesProxy } from "../utils/AgrosSalesProxy";
import type { ProducerListResponse, SearchParams } from "./Producer";

export class ProducerController {
    constructor(
        readonly producerRepo: PrismaClient["producer"],
    ) {}

    async getProducers(params: SearchParams): Promise<ProducerListResponse> {
        const { start, end, page, limit } = params;

        const where: Prisma.ProducerWhereInput = {};

        if (start) {
            where.associatedAt = {
                gte: start,
                lte: end ?? new Date()
            }
        }

        const producers = await this.producerRepo.findMany({
            select: {
                id: true,
                address: true,
                associatedAt: true,
                producerInfo: true,
                createdAt: true,
                updatedAt: true,
            },
            where: where,
            skip: (page - 1) * limit,
            take: limit
        });

        return producers as ProducerListResponse;
    }

    async becomeAssociate(id: string) {
        let producer = await this.producerRepo.findUnique({
            where: { id }
        });
        
        if (! producer) {
            throw new Error("Producer not found");
        }

        if (producer.associatedAt) {
            throw new Error("Producer already associated");
        }

        const agrosSaleProxy = new AgrosSalesProxy(producer.privateKey);

        const { err, ok } = await agrosSaleProxy.checkRulesForPurchaseNFT();

        if (! ok) {
            throw new Error(err);
        }

        const jobs = await cronjob.jobs({ 
            name: 'purchase associated nft',
            data: {
                producerId: producer.id,
                privateKey: producer.privateKey
            }
        });

        const tasks = jobs.map(job => () => job.isRunning());
        const runningJobs = await Promise.all(tasks.map(x => x()));

        if (runningJobs.some(x => x)) {
            return { status: "already processed" };
        }

        await cronjob.now('purchase associated nft', { 
            producerId: producer.id, 
            privateKey: producer.privateKey
        });

        return { status: "processing" };
    } 
}
