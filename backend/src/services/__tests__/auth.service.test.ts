import { registerUser } from '../auth.service';
import { UserModel } from '@models/User.model';
import { SettingsModel } from '@models/Settings.model';
import { ApiError } from '@utils/ApiError';

jest.mock('@models/User.model');
jest.mock('@models/Settings.model');
jest.mock('@models/RefreshToken.model');
jest.mock('@models/ActivityLog.model');
jest.mock('../email.service');

describe('AuthService - registerUser', () => {
  const mockReq: any = { ip: '127.0.0.1', headers: {} };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw conflict error if email exists', async () => {
    (UserModel.findByEmail as jest.Mock).mockResolvedValue({ id: '123' });

    await expect(
      registerUser({ name: 'Test', email: 'test@example.com', password: 'password123' }, mockReq)
    ).rejects.toThrow(ApiError);
  });

  it('should create user and settings on success', async () => {
    (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
    (UserModel.create as jest.Mock).mockResolvedValue({
      _id: 'new_id',
      name: 'Test',
      email: 'test@example.com',
      role: 'user',
      generateEmailVerificationToken: jest.fn().mockReturnValue('token'),
      save: jest.fn(),
    });

    const result = await registerUser(
      { name: 'Test', email: 'test@example.com', password: 'password123' },
      mockReq
    );

    expect(UserModel.create).toHaveBeenCalled();
    expect(SettingsModel.create).toHaveBeenCalledWith({ userId: 'new_id' });
    expect(result.user.email).toBe('test@example.com');
  });
});
