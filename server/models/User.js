export interface UserSchema {
  _id?: any;
  email: string;
  passwordHash: string; 
  createdAt: Date;
}