import Fastify from 'fastify';
import { ProducerController } from './producers/ProducerController';
import { prisma } from './prisma';
import { cronjob } from './cronjob';

const fastify = Fastify({
  logger: true
})

fastify.get<{
  Querystring: {
    start?: string;
    end?: string;
    page?: string;
    limit?: string;
  }
}>('/producers', async function (request) {
  const { start, end, page, limit } = request.query;

  const controller = new ProducerController(prisma.producer);

  const response = await controller.getProducers({
    start: start ? new Date(start as string) : undefined,
    end: end ? new Date(end as string) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10
  });

  return response;
})

fastify.post<{
  Params: {
    id: string;
  }
}>('/producers/:id/associate', async function (request, response) {
  const { id } = request.params;

  const controller = new ProducerController(prisma.producer);

  try {
    const producer = await controller.becomeAssociate(id);

    response.send(producer);
  } catch (e) {
    response.status(403).send(e);
  }
})

async function start() {
    try {
        await cronjob.start();
        await fastify.listen({ port: 3000, host: '0.0.0.0' })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start().catch(err => console.error(err));