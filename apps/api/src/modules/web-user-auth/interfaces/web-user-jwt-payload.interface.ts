export interface WebUserJwtPayload {
  sub: number;
  email: string;
}

export interface AuthenticatedWebUserPrincipal {
  webUserId: number;
  email: string;
  isActive: boolean;
}
