const User = require("../models/user-model");
//const bcrypt = require("bcrypt");


const home = async (req, res) => {
  try {
    console.log(req.body);
    res.status(200).json("welcome to our home page");
  } catch (error) {
    console.log("internal server error");
  }
};

const register = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    const userExist = await User.findOne({ email: email });
    if (userExist) {
      return res.status(400).json({ message: "user email already exists!" });
    }
    // const saltRound =10;
    // const hash_password= await bcrypt.hash(password , saltRound);
    // const userCreated = await User.create({username, email, phone, password: hash_password});

    const userCreated = await User.create({ username, email, phone, password });

    res
      .status(200)
      .send({
        message: "Registration Successful",
        token: await userCreated.generateToken(),
        userId: userCreated._id.toString(),
      });
  } catch (error) {
   res.status(400).send({ msg: "page not found!!" });
   next(error);
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userExist = await User.findOne({ email });

    if (!userExist) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

     //const isPasswordValid = await bcrypt.compare(password, userExist.password);
    const isPasswordValid = await userExist.comparePassword(password);

    if (isPasswordValid) {
      res.status(200).json({
        message: "Login Successful",
        token: await userExist.generateToken(),
        userId: userExist._id.toString(),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password " });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


const user = async (req,res) =>{
try{
   const userData = req.user;
  return res.status(200).json({message: userData});
}catch(error){
res.status(400).json({message: error});
}
}
module.exports = { home, register, login, user };
