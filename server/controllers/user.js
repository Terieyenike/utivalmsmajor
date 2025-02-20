import Sequelize from 'sequelize';
import { paginate, calculateLimitAndOffset } from 'paginate-info';
import models from '../database/models';
import helpers from '../helpers';
import Mail from '../services/mail/email';
import { generateToken, verifyToken } from '../helpers/auth';

const { Op } = Sequelize;

// const userRepository = new dbRepository(models.User);
const {
  successStat,
  errorStat,
  comparePassword,
  hashPassword,
  generatePassword,
  uploadImage,
} = helpers;

/**
 * / @static
 * @description Allows a user to sign in
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} object containing user data and access Token
 * @memberof UserController
 */
export const login = async (req, res) => {
  const { email, password, providerId, socialUid } = req.body.user;
  const { type } = req.query;

  let user;

  if (type === 'social' && !providerId && !socialUid) {
    return errorStat(res, 401, 'Incorrect Login information');
  }

  if (type === 'social') {
    user = await models.User.findOne({
      where: { email, providerId, socialUid },
    });

    if (!user) {
      user = await models.User.findOne({ where: { email } });

      if (user) {
        user.update({
          socialUid,
          providerId,
        });
      }
    }
  } else {
    user = await models.User.findOne({ where: { email } });
  }

  if (!user && type !== 'social') {
    return errorStat(res, 401, 'Incorrect Login information');
  }

  if (!user && type === 'social') {
    await models.User.create(req.body.user);
  }

  if (type !== 'social') {
    const matchPasswords = await comparePassword(password, user.password);

    if (!matchPasswords) {
      return errorStat(res, 401, 'Incorrect Login information');
    }
  }

  await req.session.login(user.role, { user: user.dataValues }, res);
  const message = 'Login successful';

  return successStat(res, 200, 'user', { ...user.userResponse(), message });
};

/**
 * / @static
 * @description Allows a user to sign up
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} object containing user data and access Token
 * @memberof UserController
 */
export const signup = async (req, res) => {
  const { email } = req.body.user;
  const isExist = await models.User.findOne({ where: { email } });

  if (isExist) return errorStat(res, 409, 'User Already Exist');

  const user = await models.User.create({
    role: 'student',
    ...req.body.user,
  });

  // const token = generateToken(
  //   { id: user.id, email },
  //   { expiresIn: 60 * 60 * 24 * 3 }
  // );

  // const link = `${req.protocol}://${req.headers.host}/api/v1/user/confirm_email?emailToken=${token}&id=${user.dataValues.id}`;

  // const mail = new Mail({
  //   to: email,
  //   subject: 'Welcome to Utiva',
  //   messageHeader: `Hi, ${user.firstname}!`,
  //   messageBody:
  // 'We are exicted to get you started. First,
  // you have to verify your account. Just click on the link below',
  //   iButton: true,
  // });
  // mail.InitButton({
  //   text: 'Verify Email',
  //   link,
  // });
  // mail.sendMail();

  await req.session.login(user.role, { user: user.dataValues }, res);
  const message = 'Registration is successful';

  return successStat(res, 201, 'user', { ...user.userResponse(), message });
};

export const quickCheckOut = async (req, res) => {
  const { email, fullName } = req.body.user;
  const isExist = await models.User.findOne({ where: { email } });

  if (isExist) return errorStat(res, 409, 'User Already Exist');

  const userProfile = fullName.split(' ');

  const password = await generatePassword(10);

  const user = await models.User.create({
    role: 'student',
    firstentry: true,
    updated: false,
    email,
    password,
    firstName: userProfile[0],
    lastName: userProfile[1],
  });

  const link =
    process.env.NODE_ENV === 'production'
      ? 'https://app.utiva.io/login'
      : 'http://localhost:3000/login';

  const mail = new Mail({
    to: email,
    subject: 'Welcome to Utiva',
    messageHeader: `Hi, ${user.firstName}!`,
    messageBody: `
      'We are exicted to get you started. Below are your login details' 
      email: ${email},
      password: ${password}
      Please login to continue
      `,
    iButton: true,
  });
  mail.InitButton({
    text: 'Login',
    link,
  });

  mail.sendMail();

  // await req.session.login(user.role, { user: user.dataValues }, res);
  const message = 'Registration is successful';

  return successStat(res, 201, 'user', { ...user.userResponse(), message });
};

/**
 * @static
 * @description Update user profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} object containing user data
 * @memberof UserController
 */
export const updateUser = async (req, res) => {
  const { id } = req.session.user;

  const user = await models.User.findOne({
    where: { id },
  });

  const data = req.body.user;

  if (data.profilePic && !data.profilePic.includes('media')) {
    let fileName =
      user.profilePic &&
      user.profilePic.split('https://utiva-app.s3.amazonaws.com/media/')[1];

    fileName = fileName || `${user.email.split('@')[0]}`;

    const image = await uploadImage(
      data.profilePic,
      `media/${fileName}`,
      data.mime
    );

    // eslint-disable-next-line prefer-destructuring
    data.profilePic = image.Location;
  }

  const updatedUser = { id, ...data };

  await user.update(updatedUser);
  await req.session.login(user.role, { user: user.userResponse() }, res);

  return successStat(res, 200, 'user', { ...user.userResponse() });
};

/**
 * / @static
 * @description Allows a user to sign in
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} object containing user data and access Token
 * @memberof UserController
 */
export const reset = async (req, res) => {
  const { password, oldPassword } = req.body.user;
  const { id } = req.session.user;

  const exixtingUser = await models.User.findOne({
    where: { id },
  });
  const matchPasswords = comparePassword(oldPassword, exixtingUser.password);

  if (!matchPasswords) {
    return errorStat(res, 401, 'Password is Incorrect please try again');
  }

  await exixtingUser.update({ password: hashPassword(password) });

  return successStat(res, 200, 'message', 'reset Successful');
};

/**
 * @description Allows a user to resend password link
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} object containing user data and access Token
 * @memberof UserController
 */

export const resetPassword = async (req, res) => {
  const { email } = req.body.user;

  const findUser = await models.User.findOne({ where: { email } });

  if (!findUser) return errorStat(res, 404, 'User does not exist');

  const token = await generateToken(
    { id: findUser.id, email },
    { expiresIn: 60 * 15 }
  );

  const domain =
    process.env.NODE_ENV === 'production'
      ? 'https://app.utiva.io'
      : 'http://localhost:3000';

  const link = `${domain}/auth/reset-password?emailToken=${token}&id=${findUser.id}`;

  const mail = new Mail({
    to: email,
    subject: 'Reset Password',
    messageHeader: `Hi!`,
    messageBody: 'Please Click on the link below to reset your password',
    iButton: true,
  });
  mail.InitButton({
    text: 'Reset password',
    link,
  });
  mail.sendMail();

  return successStat(
    res,
    200,
    'Message',
    'Reset passord link has been sent to your email, clik link to activate your account'
  );
};

export const changePassword = async (req, res) => {
  const { emailToken, id } = req.query;

  const { password } = req.body;

  const findUser = await await models.User.findOne({ where: { id } });

  if (!findUser) return errorStat(res, 401, 'Password reset unsuccesful');

  try {
    verifyToken(emailToken);
  } catch (err) {
    if (!findUser) return errorStat(res, 401, 'Link expired');
  }

  await findUser.update({
    password: await hashPassword(password),
  });

  return successStat(res, 200, 'Message', 'Your password has been changed');
};

/**
 * @static
 * @description Send a user email on successful registration
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} object containing user data and access Token
 * @memberof UserController
 */
export const confirmEmail = async (req, res) => {
  const { emailToken, id, resend } = req.query;
  if (resend) {
    const user = await models.User.findOne({ where: { id } });

    if (!user) return errorStat(res, 400, 'Unable to send verification email');
    const mail = new Mail({
      to: user.email,
      subject: 'Welcome email',
      messageHeader: `Hi, ${user.firstname}!`,
      messageBody:
        'We are exicted to get you started. First, you have to verify your account. Just click on the link below',
      iButton: true,
    });
    mail.InitButton({
      text: 'Verify Email',
      link: `${process.env.APP_URL}/api/v1/users/confirmEmail?token=${token}&id=${user.id}`,
    });
    mail.sendMail();
    return successStat(
      res,
      200,
      'message',
      'Verification link has been sent to your email'
    );
  }
  try {
    const verify = await verifyToken(emailToken, (err, decoded) => decoded);
    await models.User.update({ verified: true }, { where: { id: verify.id } });
    res.redirect(process.env.FRONTEND_URL);
    return successStat(res, 200, 'message', 'Email verified successfully');
  } catch (err) {
    return errorStat(res, 400, 'Unable to verifiy email');
  }
};

export const adminCreate = async (req, res) => {
  const { email } = req.body.user;

  try {
    const isExist = await models.User.findOne({ where: { email } });

    if (isExist) return errorStat(res, 409, 'User Already Exist');

    const password = await generatePassword(10);

    const user = await models.User.create({
      ...req.body.user,
      password,
      byadmin: true,
      updated: false,
      firstentry: true,
    });

    return successStat(res, 201, 'user', {
      ...user.userResponse(),
      message: 'User Created',
    });
  } catch (e) {
    return errorStat(res, 409, 'Operation Failed, Please try again later');
  }
};

export const getAllUsers = async (req, res) => {
  const { pageLimit, currentPage } = req.query;
  const { offset, limit } = calculateLimitAndOffset(currentPage, pageLimit);

  const { rows, count } = await models.User.findAndCountAll({
    attributes: [
      'id',
      'email',
      'firstName',
      'lastName',
      'occupation',
      'region',
      'status',
      'role',
      'profilePic',
    ],
    limit,
    offset,
  });

  const paginationMeta = paginate(currentPage, count, rows, pageLimit);

  return successStat(res, 200, 'users', { paginationMeta, rows });
};

export const activateUser = async (req, res) => {
  const { id } = req.params;

  const User = await models.User.findOne({
    where: { id },
  });

  await User.update({ status: 'active' });

  return successStat(
    res,
    200,
    'message',
    `${User.firstName} ${User.lastName} succesfully activated`
  );
};

export const deactivateUser = async (req, res) => {
  const { id } = req.params;

  const User = await models.User.findOne({
    where: { id },
  });

  await User.update({ status: 'inactive' });

  return successStat(
    res,
    200,
    'message',
    `${User.firstName} ${User.lastName} succesfully deactivated`
  );
};

export const updateAccount = async (req, res) => {
  const { id, role } = req.params;

  const exixtingUser = await models.User.findOne({
    where: { id },
  });

  if (!exixtingUser) {
    return errorStat(res, 404, "User dosen't exist");
  }

  await exixtingUser.update({ role });

  return successStat(res, 200, 'message', 'Successful Updated');
};

export const searchUsers = async (req, res) => {
  const { search_query } = req.params;

  const users = await models.User.findAll({
    where: {
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${search_query}%` } },
        { lastName: { [Op.iLike]: `%${search_query}%` } },
        { region: { [Op.iLike]: `%${search_query}%` } },
        { email: { [Op.iLike]: `%${search_query}%` } },
        { occupation: { [Op.iLike]: `%${search_query}%` } },
        { role: { [Op.iLike]: `%${search_query}%` } },
      ],
    },
  });

  return successStat(res, 200, 'data', users);
};
