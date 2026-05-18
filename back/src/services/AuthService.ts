import UserDAO from '../dao/UserDAO';
import { verifyPassword } from '../utils/passwordHash';
import { signAccessToken } from '../utils/jwt';

class AuthService {
  /**
   * Validates credentials and returns a JWT plus public user fields.
   */
  async login(email: string, password: string) {
    const user = await UserDAO.findByEmailWithPassword(email);
    if (!user || !verifyPassword(password, user.contraseña)) {
      throw new Error('Email o contraseña incorrectos');
    }

    const token = signAccessToken(String(user._id), user.email);
    const plain = user.toJSON() as {
      _id: string;
      alias: string;
      email: string;
      imagenPerfil?: string;
      createdAt?: string;
      updatedAt?: string;
    };

    return { token, user: plain };
  }
}

export default new AuthService();
