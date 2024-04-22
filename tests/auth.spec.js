const { mockRequest, mockResponse } = require("jest-mock-req-res");
const {
  login,
  register,
  generateAccessToken,
  generateRefreshToken,
} = require("../src/controller/auth.controller"); // Import your login function
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

describe("Login function", () => {
  test("Should return status 404 if user is not found", async () => {
    const req = mockRequest({
      body: {
        email: "nonexistent@example.com",
        password: "password123",
      },
    });
    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  test("Should return status 401 if password is invalid", async () => {
    // Mocking user data
    const user = {
      email: "test7@gmail.com",
      // Assuming password is hashed by bcrypt
      password: await bcrypt.hash("123456aA@", 10),
    };

    const req = mockRequest({
      body: {
        email: "trantanminh0603@gmail.com",
        password: "password123",
      },
    });
    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid password" });
  });

  test("Should return status 200 and tokens on successful login", async () => {
    // Mocking user data
    const user = {
      email: "admin@gmail.com",
      // Assuming password is hashed by bcrypt
      password: await bcrypt.hash("123456aA@", 10),
    };

    const req = mockRequest({
      body: {
        email: user.email,
        password: "123456aA@",
      },
    });
    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Login successful",
        token: expect.any(String),
        refreshToken: expect.any(String),
      })
    );
  });

  // You can add more tests to cover edge cases or additional scenarios
});

describe("generateAccessToken function", () => {
  test("Should return a valid JWT token", async () => {
    // Mock user data
    const name = "Test User";
    const email = "test@example.com";
    const role = "user";

    // Mock JWT sign function
    jwt.sign = jest.fn().mockReturnValue("mockedJWTToken");

    // Mock Redis client and setEx function
    const redisClient = {
      setEx: jest.fn().mockResolvedValue("OK"),
    };

    // Mock process.env.SECRET_KEY
    process.env.SECRET_KEY = "mockedSecretKey";

    const token = await generateAccessToken(name, email, role);

    // Assert that the function returns a non-empty string
    expect(typeof token).toBe("string");
    expect(token).toBeTruthy();
  });

  test("Should generate valid refresh token", async () => {
    // Mock user data
    const email = "test@example.com";

    // Mock JWT sign function
    jwt.sign = jest.fn().mockReturnValue("mockedJWTToken");

    // Mock Redis client and setEx function
    const redisClient = {
      setEx: jest.fn().mockResolvedValue("OK"),
    };

    // Mock process.env.SECRET_KEY
    process.env.REFRESH_SECRET_KEY = "mockedSecretKey";

    const token = await generateRefreshToken(email);

    // Assert that the function returns a non-empty string
    expect(typeof token).toBe("string");
    expect(token).toBeTruthy();
  });

  // You can add more tests to cover edge cases or additional scenarios
});
