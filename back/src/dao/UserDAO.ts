import User, { IUser } from '../models/User';

class UserDAO {
  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  async findAll(): Promise<IUser[]> {
    return await User.find().sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    const normalized = email.trim().toLowerCase();
    return await User.findOne({ email: normalized }).select('+contraseña');
  }

  async update(id: string, updateData: Record<string, unknown>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('+contraseña');
  }
}

export default new UserDAO();
