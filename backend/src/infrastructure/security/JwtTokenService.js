import jwt from 'jsonwebtoken';
import { ITokenService } from '../../domain/services/ITokenService.js';

export class JwtTokenService extends ITokenService {
  constructor({ secret, expiresIn }) {
    super();
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  firmar(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verificar(token) {
    return jwt.verify(token, this.secret);
  }
}
