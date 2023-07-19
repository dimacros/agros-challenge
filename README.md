# Challenge (Spanish)

Asumiendo la existencia de una API, que entregará
información del productor: información personal y de su
unidad productiva (parcela, cultivo), se solicita desplegar
tres Smart Contracts (SC) en red Testnet EVM compatible
(Polygon, Chainlink, Ethereum, u otra), el primer SC que
permita entregar un token (ERC20) a un productor, un
segundo SC que entregue un NFT (ERC721) al productor.
Finalmente un tercer SC que permita la compra de un
determinado NFT de Asociado usando sus tokens ERC20.

**Token ERC20:**
Se entregará un valor de token por cada campo de
información completada del productor, por ejemplo si la
API entrega 10 campos de datos y para un productor solo
están completados 8, el SC debe entregarle 8 TOKENS.
Esta información se asocia a la wallet del productor, que
informará la API también.

**SC NFT:**
Se entregará un NFT si el API informa que es productor
orgánico, dentro del NFT debe estar asociada una imagen
como “sello de productor orgánico” e indicar el cultivo
respectivo, por ejemplo:
stamp: http://......./sello.jpg
crop: cacao
Esta información se asocia a la wallet del productor, que
informará la API también.

# Concept Diagram
![Agros Concept Diagram](resources/Agros.svg "Agros Concept Diagram")

# Getting Started

## Requirements
- Nodejs v18
- Open Zeppelin (Relayer and Autotask)
- Docker (optional)

## First Steps
Clone the repository:

`git clone git@github.com:dimacros/sistema-facturacion.git`

Copy `.env.example` and rename it to `.env`. Replace the values ​​with yours.

Optionally you can mock the api with *docker*:

`docker-compose up --build`

Setup a mongo database in the cloud and replace DATABASE_URL in the `.env` file.
I suggest using mondodb Atlas (it's free).

Now, you can try the endpoints:

`GET https://localhost:8080/producers`

`POST https://localhost:8080/producers/:id/associate`

## Testing
`npx hardhat test`

## Deploy
`npx hardhat run scripts/deploy.ts --network testnet` 
