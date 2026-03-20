import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { sendTokenResponse } from "../utils/jwt.js";

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    //1. Check if the user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, error: "Email already in use" });
    }
    //2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    //3. Create User
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });
    //4. Send Response with cookie
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(401)
        .json({ success: false, error: "Please provide email and password" });
    }
    const user = await prisma.user.findUnique({ where: email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res, next) => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};
