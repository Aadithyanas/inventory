const User = require("../models/User");

const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {

    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // ❌ NO HASHING
    const user = new User({
      name,
      email,
      password   // storing directly
    });

    await user.save();

    res.json({
      message: "User created successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.login = async (req, res) => {

  console.log("LOGIN API HIT", req.body);

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    // ⭐ DIRECT PASSWORD COMPARE (NO HASH)
    if (password !== user.password) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    // ⭐ CREATE TOKEN
    const token = jwt.sign(
      { userId: user._id },
      "SECRET_KEY",
      { expiresIn: "7d" }
    );

    console.log(token);

    // ⭐ SEND RESPONSE
    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
