const sendCodeToUser = async (email, code) => {
  // In an ideal world, we'd send an email to the user.
  // For demonstration purposes, we'll just log to the console
  console.log(`Sending code ${code} to ${email}`);
};

module.exports = { sendCodeToUser };
