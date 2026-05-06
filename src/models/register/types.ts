export type RegisterUserType = 'passenger' | 'driver';

export interface RegisterPassengerPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  cpf: string;
  birthDate: string;
}

export interface RegisterDriverPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  cpf: string;
  cnhNumber: string;
  cnhExpirationDate: string;
  cnhCategory: string;
}

export type RegisterRequestPayload = RegisterPassengerPayload | RegisterDriverPayload;

export interface RegisterApiSuccess {
  success?: boolean;
  message?: string;
}

export type RegisterFormErrors = Partial<Record<RegisterField, string>>;

export type RegisterField =
  | 'name'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'phone'
  | 'cpf'
  | 'birthDate'
  | 'cnhNumber'
  | 'cnhCategory'
  | 'cnhExpirationDate';
