export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface IPendingRegistration {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  roleName?: string;
  otpHash: string;
  attempts?: number;
}

export interface IVerifyEmail {
  email: string;
  otp: string;
}

export interface Ilogin {
  email: string;
  password: string;
}

export interface IGoogleLogin {
  idToken: string;
}

export interface IForgotPassword {
  email: string;
}

export interface IResetPassword {
  email: string;
  newPassword: string;
  otp: string;
}
