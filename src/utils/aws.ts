import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY as string
    },
    region: process.env.AWS_S3_BUCKET_REGION as string
});

const s3UploadObject = async (file: { name: string, mimetype: string, body: Buffer }) => {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: file.name,
        Body: file.body,
        ContentType: file.mimetype
    });
    return client.send(command);
};

const s3DeleteObject = async (key: string) => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
    });
    return client.send(command);
};

export {
    s3UploadObject,
    s3DeleteObject
}
