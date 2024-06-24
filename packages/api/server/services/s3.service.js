const AWS = require('aws-sdk');
const dotenv = require('dotenv');

dotenv.config();

const AWS_S3_CONFIG = {
  accessKeyId: process.env.AWS_S3_IMAGES_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_IMAGES_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};

const Bucket = 'workly-images';
const baseUrl = 'https://workly-images.s3.amazonaws.com/';
const originalPath = 'avatars/original/';
const thumbPath = 'avatars/thumb/';

const deleteFile = async (s3, Key) => {
  await s3
    .deleteObject({
      Bucket,
      Key,
    })
    .promise();
};

const createS3Instance = () => {
  return new AWS.S3(AWS_S3_CONFIG);
};

exports.getAwsS3 = () => {
  return createS3Instance();
};

exports.getBucket = () => {
  return Bucket;
};

exports.getOriginalPath = () => {
  return originalPath;
};

exports.getAvatarUrl = filename => {
  return baseUrl + thumbPath + filename;
};

exports.deleteAvatar = async filename => {
  console.log('filename:', filename);
  try {
    const s3 = createS3Instance();
    await deleteFile(s3, `${originalPath}${filename}`);
    await deleteFile(s3, `${thumbPath}${filename}`);
  } catch (error) {
    console.log(error);
  }
};
