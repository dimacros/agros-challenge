const defaultEnv = {
    AGROS_TOKEN_ADDRESS: '0x0',
    AGROS_SALES_ADDRESS: '0x0',
    WEB3_PROVIDER_URL: 'http://localhost:8545',
    DATABASE_URL: 'mongodb://root:R00tP4ssw0rd@mongo:27017/agros',
    NODE_ENV: 'development',
};

export const env = Object.assign(defaultEnv, process.env);