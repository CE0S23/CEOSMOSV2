const fs = require('fs');

const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production' || process.env.VERCEL === '1';
const apiUrl = process.env.API_URL || (isProd ? '/api' : 'http://localhost:3000/api');

const envConfigFile = `export const environment = {
  production: ${isProd},
  apiUrl: '${apiUrl}'
};
`;

const targetPath = './src/environments/environment.prod.ts';
fs.writeFileSync(targetPath, envConfigFile);
console.log(`Environment file generated at ${targetPath} with API_URL: ${apiUrl}`);
