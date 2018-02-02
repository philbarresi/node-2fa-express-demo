const bcrypt = require("bcrypt");
const saltRounds = 10;
const myPlaintextPassword = "s0//P4$$w0rD";
const someOtherPlaintextPassword = "not_bacon";
const uuidv4 = require("uuid/v4");

const sessions = [];

const getRandomCode = () => Math.floor(100000 + Math.random() * 900000);

const getUsers = async () => {
  const userList = [
    { id: uuidv4(), username: "test@test.com", rawPassword: "mypassword" },
    { id: uuidv4(), username: "test2@test.com", rawPassword: "anotherpassword" }
  ];

  const usersWithEncryptedPasswords = userList.map(async user => {
    const hashedPassword = await bcrypt.hash(user.rawPassword, saltRounds);
    return { ...user, rawPassword: undefined, password: hashedPassword };
  });

  return await Promise.all(usersWithEncryptedPasswords);
};

const userList = getUsers();

const login = async (username, password) => {
  const users = await userList;
  const userWithNameMatch = users.filter(x => x.username === username);
  if (userWithNameMatch.length === 0) throw "No matching users";

  const user = userWithNameMatch[0];

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) throw "No matching users";

  const newSessionId = uuidv4();

  const newSession = {
    sessionId: newSessionId,
    userId: user.id,
    loginState: "PasswordAuthenticated"
  };

  sessions.push(newSession);

  return newSession;
};

const getUserById = async userId => {
  const users = await userList;
  const userIdMatches = users.filter(x => x.id === userId);
  if (userIdMatches.length === 0) throw "No matching users";
  return userIdMatches[0];
};

const getUserFromSession = async sessionId => {
  const session = getSession(sessionId);
  if (!session) throw "No session found";
  const user = await getUserById(session.userId);
  return { user, session };
};

const generate2faCode = async sessionId => {
  const session = getSession(sessionId);
  if (!session) throw "No session found";

  const verificationCode = getRandomCode();
  const hashedCode = await bcrypt.hash(`${verificationCode}`, saltRounds);

  session.twoFactorCode = hashedCode;

  return verificationCode;
};

const validate2faCode = async (sessionId, code) => {
  const session = getSession(sessionId);
  if (!session) throw "No session found";

  const codeMatches = await bcrypt.compare(`${code}`, session.twoFactorCode);
  if (!codeMatches) throw "Code invalid";
  session.loginState = "TwoFactorAuthenticated";
  
  return true;
};

const getSession = sessionId => {
  return sessions.filter(x => x.sessionId === sessionId)[0];
};

module.exports = {
  getSession,
  getUserById,
  getUsers,
  login,
  getUserById,
  getUserFromSession,
  generate2faCode,
  validate2faCode
};
