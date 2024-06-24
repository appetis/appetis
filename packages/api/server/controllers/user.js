const bcrypt = require('bcrypt');
const path = require('path');
const { Op } = require('sequelize');
const { User, Verification, Profile } = require('../models');
const userService = require('../services/user.service');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');
const s3Service = require('../services/s3.service');

const findVerificationToVerify = async userId => {
  return Verification.findOne({
    where: {
      UserId: userId,
      status: 'CR',
      expiredAt: {
        [Op.gt]: new Date(),
      },
    },
  });
};

const verifyStatus = async (user, userVerification) => {
  await user.update({ status: 'VE' });
  await userVerification.update({ status: 'VE' });
};

const createOrUpdateUserProfile = async (userId, data) => {
  const profileData = {
    UserId: userId,
    name: data.name,
    department: data.department,
    position: data.position,
    phone: data.phone,
    phone_ext: data.phone_ext,
    status: data.status,
  };

  let profile = await userService.getUserProfile(userId);
  if (profile) {
    profile = await profile.update(profileData);
  } else {
    profile = await Profile.create(profileData);
  }

  await userService.addProfileStatusName(profile);

  return profile;
};

const validateEmail = email => {
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
};

const createUser = async (email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    email,
    password: hashedPassword,
  });
  delete newUser.dataValues.password;

  return newUser;
};

exports.create = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!validateEmail(email)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid email address',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        code: 400,
        message: 'Password must be at least 8 characters',
      });
    }

    const user = await userService.getUserByEmail(email);
    if (user) {
      return res.status(400).json({
        code: 400,
        message: 'Email is already in use.',
      });
    }

    const newUser = await createUser(email, password);

    await emailService.sendVerificationCode(newUser);

    return res.status(201).json({
      code: 201,
      message: 'Created the user',
      user: newUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: 'Server error',
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();

    return res.status(200).json({
      code: 200,
      message: 'Found all users',
      users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: 'Server error',
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserWithProfileById(req.params.id);
    if (!user) {
      return res.status(204).json({
        code: 204,
        message: 'Cannot find the user',
      });
    }

    return res.status(200).json({
      code: 200,
      message: 'Found the user',
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: 'Server error',
    });
  }
};

exports.verify = async (req, res) => {
  try {
    const userId = req.params.id;
    const { code } = req.body;

    const user = await userService.getUserWithTeamById(userId);
    if (!user) {
      return res.status(400).json({
        code: 400,
        message: 'Cannot find the user',
      });
    }

    const userVerification = await findVerificationToVerify(userId);
    if (!userVerification || userVerification.code !== code) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid code',
      });
    }

    await verifyStatus(user, userVerification);

    const accessToken = authService.generateAccessToken(user.id);
    const refreshToken = await authService.generateRefreshToken(user.id);

    return res.status(200).json({
      code: 200,
      message: 'Verified the user email',
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: 'Server error',
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userService.getUserWithProfileById(userId);
    if (!user) {
      return res.status(400).json({
        code: 400,
        message: 'Cannot find the user',
      });
    }

    const profile = await createOrUpdateUserProfile(userId, req.body);

    return res.status(200).json({
      code: 200,
      message: 'Updated the profile',
      profile,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: 'Server error',
    });
  }
};

exports.getUserStatusById = async (req, res) => {
  const userStatus = await userService.getUserStatusById(req.params.id);
  if (!userStatus) {
    return res.status(400).json({
      code: 400,
      message: 'Cannot find the status',
    });
  }

  return res.status(200).json({
    code: 200,
    message: 'Success',
    statusCode: userStatus.statusCode,
    statusName: userStatus.statusName,
  });
};

exports.updateAvatar = async (req, res) => {
  console.log('updateAvatar - file:', req.file);
  const filename = path.basename(req.file.location);
  const userId = req.params.id;

  try {
    const profile = await userService.getUserProfile(userId);
    if (!profile) {
      return res.status(400).json({
        code: 400,
        message: 'Cannot find the user profile',
      });
    }

    const { avatar } = profile;
    console.log('userId:', userId, ', avatar:', avatar);
    if (avatar) {
      await s3Service.deleteAvatar(avatar.substring(avatar.lastIndexOf('/') + 1));
    }

    await profile.update({ avatar: s3Service.getAvatarUrl(filename) });

    return res.status(200).json({
      code: 200,
      message: 'Updated the avatar',
      avatar: filename,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: 'Cannot update the avatar',
    });
  }
};
