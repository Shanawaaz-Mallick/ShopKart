import Razorpay from "razorpay";

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Server/.env");
  }
  if (!keyId.startsWith("rzp_test_")) {
    throw new Error("ShopKart checkout is configured for Razorpay Test Mode only");
  }

  return {
    keyId,
    client: new Razorpay({ key_id: keyId, key_secret: keySecret }),
  };
};

export default getRazorpayClient;
