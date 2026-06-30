import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../../domain/services/IPasswordHasher.js';

export class BcryptPasswordHasher extends IPasswordHasher {
  constructor(rondas = 10) {
    super();
    this.rondas = rondas;
  }

  async hash(plano) {
    return bcrypt.hash(plano, this.rondas);
  }

  async comparar(plano, hash) {
    return bcrypt.compare(plano, hash);
  }
}
