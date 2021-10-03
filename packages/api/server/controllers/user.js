const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User, Verification } = require('../models');
const emailService = require('../services/email.service');
const authService = require('../services/auth.service');

exports.create = async (req, res) => {
    try {
        let email = req.body.email;
        if (!validateEmail(email)) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid email address'
            });
        }

        let password = req.body.password;
        if (password.length < 8) {
            return res.status(400).json({
                code: 400,
                message: 'Password must be at least 8 characters'
            });
        }

        const user = await User.findOne({
            where: {
                email
            }
        });
        if (user) {
            return res.status(400).json({
                code: 400,
                message: 'Email is already in use.'
            });

        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let newUser = await User.create({
            email,
            password: hashedPassword
        });
        delete newUser.dataValues.password;

        await emailService.sendVerificationCode(newUser);

        return res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: 'Server error'
        });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: {
                exclude: ['password']
            }
        });

        return res.status(200).json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            code: 500,
            message: 'Server error'
        });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id: parseInt(req.params.id, 10)
            },
            attributes: {
                exclude: ['password']
            }
        });
        if (!user) {
            return res.status(204).json({
                code: 204,
                message: 'Cannot found the user'
            });
        }

        return res.status(202).json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: 'Server error'
        });
    }
};

exports.verify = async (req, res) => {
    try {
        const userId = req.params.id;
        const code = req.body.code;

        let user = await User.findOne({
            where: {
                id: userId
            },
            attributes: {
                exclude: ['password']
            }
        });
        if (!user) {
            return res.status(400).json({
                code: 400,
                message: 'Cannot found the user'
            });
        }

        const userVerification = await Verification.findOne({
            where: {
                UserId: userId,
                status: 'CR',
                expiredAt: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!userVerification) {
            return res.status(400).json({
                code: 400,
                message: 'Cannot found a code for the user'
            });
        }

        if (userVerification.code !== code) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid code'
            })
        }

        await user.update({status: 'VE'});
        await userVerification.update({status: 'VE'});

        return res.status(200).json({
            code: 200,
            message: 'Verified the user email',
            user,
            token: authService.generateToken(user.id)
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
           code: 500,
           message: 'Server error'
        });
    }
}

validateEmail = (email) => {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
}
