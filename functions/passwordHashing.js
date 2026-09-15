import bcrypt from "bcrypt";

const asin = 10;

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, asin);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

//parent@gmail.com, teacher@gmail.com  admin@gmail.com || password ng lahat benten
