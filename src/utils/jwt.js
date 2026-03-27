import jwt from "jsonwebtoken";

//Generate token and attach it to the respond cookie
export const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    },
  );

  //Cookie option
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: "lax",
  };

  //Remove Password from output
  const userWithoutPassword = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user?.avatarUrl,
  };
  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token, user: userWithoutPassword });
};
