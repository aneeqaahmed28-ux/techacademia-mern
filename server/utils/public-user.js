function publicUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    isAdmin: Boolean(user.isAdmin),
  };
}

module.exports = { publicUser };
