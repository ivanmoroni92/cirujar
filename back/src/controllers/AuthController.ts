import { Request, Response } from 'express';
import AuthService from '../services/AuthService';
import { isValidEmailFormat } from '../utils/emailFormat';

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

class AuthController {
  /**
   * POST /api/auth/login — JSON: email, contraseña
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, contraseña } = req.body ?? {};

      if (!isNonEmptyString(email) || !isNonEmptyString(contraseña)) {
        res.status(400).json({ error: 'email y contraseña son obligatorios.' });
        return;
      }

      if (!isValidEmailFormat(email)) {
        res.status(400).json({ error: 'Ingresá un email válido' });
        return;
      }

      const result = await AuthService.login(email, contraseña);
      res.status(200).json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
      if (message === 'Credenciales inválidas' || message === 'Email o contraseña incorrectos') {
        res.status(401).json({ error: message });
        return;
      }
      res.status(500).json({ error: message });
    }
  }
}

export default new AuthController();
