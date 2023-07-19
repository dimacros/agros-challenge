import { Prisma, PrismaClient } from "@prisma/client";
import { cronjob } from "../cronjob";
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

        return producers;
    }

    async becomeAssociate(id: string): Promise<{ status: string }> {
        let producer = await this.producerRepo.findUnique({
            where: { id }
        });
        
        if (! producer) {
            throw new Error("Producer not found");
        }

        if (producer.associatedAt) {
            throw new Error("Producer already associated");
        }

        cronjob.now('purchase associated nft', { 
            producerId: producer.id, 
            privateKey: producer.privateKey
        });

        return { status: "processing" };
    } 
}
