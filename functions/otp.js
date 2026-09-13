import crypto from "crypto";

export const generateOtp = () => {
  const otp = String(crypto.randomInt(100000, 1000000));

  const otpHash = crypto.createHash("sha256").update(otp).digest("base64");

  return {
    otp,
    otpHash,
  };
};

export const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("base64");
};
