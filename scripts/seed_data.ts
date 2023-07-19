import { randomBytes } from 'crypto';
import { fakerES as faker } from '@faker-js/faker';
import { Web3 } from 'web3';
import { PrismaClient } from '@prisma/client'
import { env } from '../src/env';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    }
  }
});

async function seed() {
    const web3 = new Web3(env.WEB3_PROVIDER_URL);

    const createProducer = () => {
      const account = web3.eth.accounts.create();
      const id = randomBytes(12).toString('hex');

      return {
        id: id,
        address: account.address,
        privateKey: account.privateKey,
      };
    }

    const maybe = (s: string) => faker.helpers.maybe(() => s);
    const createProducerInfo = (producerId: string) => ({
      producerId: producerId,
      firstName:  maybe(faker.person.firstName()),
      lastName: maybe(faker.person.lastName()),
      phoneNumber: maybe(faker.phone.number('+51 9########')),
      documentType: 'DNI',
      documentNumber: faker.helpers.replaceSymbolWithNumber('7#######'),
      countryIsoCode: maybe(faker.location.countryCode('alpha-3')),
      cropPlotSize: maybe(`${faker.number.int({ min: 1000, max: 5000 })}m2`),
      cropType: maybe(faker.helpers.arrayElement(['Cocoa', 'Coffee', 'Corn', 'Potato', 'Grape'])),
    });

    const producers = faker.helpers.multiple(createProducer, {
      count: 10,
    });

    await prisma.producer.createMany({ data: producers });
    await prisma.producerInfo.createMany({
      data: producers.map((p) => createProducerInfo(p.id)),
    });
}

seed().then(async () => {
  await prisma.$disconnect();
})
.catch(async (err) => {
  console.error(err);
  process.exit(1);
});