import AWS from 'aws-sdk';
import isBase64 from 'is-base64';
import bluebird from 'bluebird';
import {
  AWS_SECRET_ACCESS_KEY,
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_BUCKET_NAME,
  ENCRYPTION_SECRET,
} from '../config/envVariables';

const Cryptr = require('cryptr');

const config = {
  aws: {
    secret_access_key: AWS_SECRET_ACCESS_KEY,
    access_key_id: AWS_ACCESS_KEY_ID,
    region: AWS_REGION,
    bucket_name: AWS_BUCKET_NAME,
  },
};

AWS.config.update({
  secretAccessKey: config.aws.secret_access_key,
  accessKeyId: config.aws.access_key_id,
  region: config.aws.region,
});

AWS.config.setPromisesDependency(bluebird);

const s3 = new AWS.S3({ params: { Bucket: config.aws.bucket_name } });

/**
 * @Module UserController
 * @description Controlls all the user based activity
 */
/**
 * @static
 * @description Returns message based on the status
 * @param {Object} res - Response object
 * @param {Number} status - Appropraite error status
 * @param {String} error - The appropriate error message
 * @returns {Object} res object to report approprate error
 * @memberof Utilites
 */
export function errorStat(res, status, error) {
  return res.status(status).json({ status, error });
}

/**
 * @static
 * @description Returns message based on the status
 * @param {Object} res - Response object
 * @param {integer} status - status code to be sent
 * @param {String} key - the output data key
 * @param {Object} value - the output data values
 * @returns {Object} res object to report the appropraite message
 * @memberof Utilities
 */
export function successStat(res, status, key, value) {
  return res.status(status).json({ status, [key]: value });
}

/**
 * @static
 * @description Returns message based on the status
 * @param {Object} res - Response object
 * @param {Object} req - Request object
 * @param {Object} object - object to be validated
 * @param {Object} schema - The schema object
 * @param {Functon} next - The next function
 * @returns {Object} res object to report the appropraite message
 * @memberof Utilities
 */

export function validateJoi(object, schema, req, res, next, name) {
  const { error, value } = schema.validate(object, { abortEarly: false });

  if (error) {
    return errorStat(
      res,
      400,
      error.details.map((detail) => {
        const message = detail.message.replace(/"/gi, '');
        return message;
      })
    );
  }

  req.body[name] = value;
  return next();
}

export const uploadImage = async (url, fileName) => {
  try {
    if (!isBase64(url, { mimeRequired: true })) {
      throw Error('Invalid base64 image');
    }
    const buffer = new Buffer.from(
      url.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );
    const data = {
      ACL: 'public-read',
      Key: fileName,
      Body: buffer,
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg',
    };
    return s3.upload(data).promise();
  } catch (err) {
    return err.message;
  }
};

export const uploadData = async (file, path, fileName) => {
  if (!isBase64(file, { mimeRequired: true })) {
    throw Error('Invalid base64 Data');
  }

  const buffer = new Buffer.from(
    file.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  );

  const data = {
    ACL: 'public-read',
    Key: `${path}/${fileName}`,
    Body: buffer,
    ContentEncoding: 'base64',
  };

  return s3.upload(data).promise();
};

export const getFolderListings = async () =>
  s3
    .listObjects({ Bucket: 'utiva-app', Delimiter: ',', Prefix: 'Courses' })
    .promise();

export const createFileFolder = async (path) => {
  const params = {
    Key: path,
  };

  return s3.putObject(params).promise();
};

export const deleteImage = async (path) => {
  const deleteParam = {
    Key: path,
  };

  return s3.deleteObject(deleteParam).promise();
};

// deleteImage(
//   'Courses/Data Incubator/classes/Pre-class Learning [Introduction to Excel]/att_users_202103041239.csv'
// );

// console.log(
//   createFileFolder(
//     'Courses/Data Incubator/classes/Pre-class Learning [Introduction to Excel]/'
//   )
// );

export const encryptQuery = (string) => {
  try {
    const cryptr = new Cryptr(ENCRYPTION_SECRET);
    const encryptedString = cryptr.encrypt(string);
    return encryptedString;
  } catch (error) {}
};

export const decrypt = (string) => {
  try {
    const cryptr = new Cryptr(ENCRYPTION_SECRET);
    const decryptedString = cryptr.decrypt(string);
    return decryptedString;
  } catch (error) {
    return false;
  }
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};

export const generatePassword = (passwordLength, coupon) => {
  const numberChars = '0123456789';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const symbols = '!@#$%&*';

  const allChars = coupon
    ? upperChars
    : numberChars + upperChars + lowerChars + symbols;
  let randPasswordArray = Array(passwordLength);
  randPasswordArray[0] = coupon ? upperChars : numberChars;
  randPasswordArray[1] = upperChars;
  randPasswordArray[2] = coupon ? upperChars : lowerChars;
  randPasswordArray[3] = coupon ? upperChars : symbols;
  randPasswordArray = randPasswordArray.fill(allChars, 4);
  return shuffleArray(
    randPasswordArray.map((x) => x[Math.floor(Math.random() * x.length)])
  ).join('');
};
