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
