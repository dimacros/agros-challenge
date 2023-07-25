import type { Producer, ProducerInfo } from '@prisma/client';

export type SearchParams = {
    start?: Date;
    end?: Date;
    page: number;
    limit: number;
}

export type ProducerListResponse = Array<ProducerResponse & {
    producerInfo: ProducerInfo 
}>;

export type ProducerResponse = Omit<Producer, 'privateKey'>;
