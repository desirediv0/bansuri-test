import { S3Client } from '@aws-sdk/client-s3';

const spacesConfig = {
    endpoint: process.env.SPACES_ENDPOINT,
    region: process.env.SPACES_REGION,
    credentials: {
        accessKeyId: process.env.SPACES_ACCESS_KEY,
        secretAccessKey: process.env.SPACES_SECRET_KEY
    },
    forcePathStyle: false
};


if (!process.env.SPACES_BUCKET) {
    throw new Error('SPACES_BUCKET environment variable is not defined');
}

export default new S3Client(spacesConfig);