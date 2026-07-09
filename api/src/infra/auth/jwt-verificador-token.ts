import jwt from "jsonwebtoken";

export interface TokenPayload {
  sub: string;
  email: string;
}

export function verificarToken(token: string, secret: string): TokenPayload {
  const payload = jwt.verify(token, secret);

  return payload as TokenPayload;
}
