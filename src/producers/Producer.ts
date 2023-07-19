import type { Producer, ProducerInfo } from '@prisma/client';

export type SearchParams = {
    start: Date | null;
    end: Date | null;
    page: number;
    limit: number;
}

export type ProducerListResponse = Array<ProducerResponse & {
    producerInfo: ProducerInfo | null 
}>;

export type ProducerResponse = Omit<Producer, 'privateKey'>;
