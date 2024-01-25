const bcrypt = require('bcrypt');
const { Role } = require('@prisma/client');
const { register } = require('./auth.controller');

jest.mock('bcrypt');
jest.mock('@prisma/client');

describe('register function', () => {
  it('creates a new user and responds with a success message', async () => {
    bcrypt.hash.mockResolvedValue('hashed_password');
    const mockCreate = jest.fn().mockResolvedValue({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: Role.USER,
    });

    jest.mock('../src/prisma/schema.prisma', () => ({
      prisma: {
        user: { create: mockCreate },
      },
    }));

    const req = { body: { name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'User' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };

    await register(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(mockCreate).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed_password',
      role: Role.USER,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User created successfully',
      user: { id: 1, name: 'John Doe', email: 'john@example.com', role: Role.USER },
    });
  });

  it('handles internal server error and responds with a 500 status', async () => {
    bcrypt.hash.mockResolvedValue('hashed_password');
    const mockCreateError = jest.fn().mockRejectedValue(new Error('Prisma error'));

    jest.mock('../src/prisma/schema.prisma', () => ({
      prisma: { user: { create: mockCreateError } },
    }));

    const req = { body: {} };
    const res = { status: jest.fn(() => res), json: jest.fn() };

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
  });
});
