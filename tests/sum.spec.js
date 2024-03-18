const { mockRequest, mockResponse } = require("jest-mock-req-res");
const { login, register } = require("../src/controller/auth.controller"); // Import your login function
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

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
        email: user.email,
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
      email: "test7@gmail.com",
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
