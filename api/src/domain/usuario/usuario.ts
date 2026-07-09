import { randomUUID } from "node:crypto";

export interface UsuarioProps {
  email: string;
  senhaHash: string;
}

export interface UsuarioRestauracao extends UsuarioProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Usuario {
  readonly id: string;
  private readonly _email: string;
  private readonly _senhaHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(id: string, props: UsuarioProps, createdAt: Date, updatedAt: Date) {
    this.id = id;
    this._email = props.email;
    this._senhaHash = props.senhaHash;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static criar(props: UsuarioProps): Usuario {
    const agora = new Date();

    return new Usuario(randomUUID(), props, agora, agora);
  }

  static restaurar(props: UsuarioRestauracao): Usuario {
    return new Usuario(props.id, props, props.createdAt, props.updatedAt);
  }

  get email(): string {
    return this._email;
  }

  get senhaHash(): string {
    return this._senhaHash;
  }
}
