import mongoose, {
  Schema,
  type Document,
  type Model,
} from 'mongoose';
import bcrypt  from 'bcryptjs';
import crypto  from 'crypto';
import { env } from '../config/env';
import type { UserRole } from '../types/common.types';

// ─── Interface ────────────────────────────────────────────────────
export interface IUser extends Document {
  _id:              mongoose.Types.ObjectId;
  name:             string;
  email:            string;
  password:         string | undefined;
  googleId:         string | undefined;
  authProvider:     'local' | 'google';
  avatar:           string | undefined;
  role:             UserRole;
  isEmailVerified:  boolean;
  isActive:         boolean;
  // Brute force protection
  loginAttempts:    number;
  lockUntil:        Date | undefined;
  // Email verification
  emailVerificationToken:   string | undefined;
  emailVerificationExpires: Date | undefined;
  // Password reset
  passwordResetToken:   string | undefined;
  passwordResetExpires: Date | undefined;
  // Storage
  storageUsed:  number;
  storageLimit: number;
  // Push notifications
  fcmToken:   string | undefined;
  // Timestamps
  lastLogin:  Date | undefined;
  createdAt:  Date;
  updatedAt:  Date;

  // Methods
  comparePassword(candidate: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
}

interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

// ─── Schema ───────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      index:     true,
    },
    password: {
      type:   String,
      select: false, // Never returned in queries by default
    },
    googleId: {
      type:   String,
      sparse: true,
      index:  true,
    },
    authProvider: {
      type:    String,
      enum:    ['local', 'google'],
      default: 'local',
    },
    avatar: {
      type: String,
    },
    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },
    isEmailVerified: {
      type:    Boolean,
      default: false,
    },
    isActive: {
      type:    Boolean,
      default: true,
      index:   true,
    },
    loginAttempts: {
      type:    Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    emailVerificationToken: {
      type:   String,
      select: false,
    },
    emailVerificationExpires: {
      type:   Date,
      select: false,
    },
    passwordResetToken: {
      type:   String,
      select: false,
    },
    passwordResetExpires: {
      type:   Date,
      select: false,
    },
    storageUsed: {
      type:    Number,
      default: 0,
      min:     0,
    },
    storageLimit: {
      type:    Number,
      default: 1073741824, // 1GB in bytes (free tier)
    },
    fcmToken: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ isActive: 1, createdAt: -1 });

// ─── Pre-save: Hash password ──────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.password == null) return next();
  this.password = await bcrypt.hash(this.password, env.BCRYPT_SALT_ROUNDS);
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────
userSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  if (this.password == null) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function (): boolean {
  return this.lockUntil != null && this.lockUntil > new Date();
};

userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  const MAX_ATTEMPTS  = 5;
  const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

  this.loginAttempts += 1;

  if (this.loginAttempts >= MAX_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_DURATION);
  }

  await this.save();
};

userSchema.methods.generateEmailVerificationToken = function (): string {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return rawToken;
};

userSchema.methods.generatePasswordResetToken = function (): string {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  return rawToken;
};

// ─── Static Methods ───────────────────────────────────────────────
userSchema.statics.findByEmail = function (email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase().trim() }).select('+password');
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);

// Named export alias for services that import UserModel
export { User as UserModel };

// Export AuthProvider enum equivalent
export const AuthProvider = {
  LOCAL:  'local',
  GOOGLE: 'google',
} as const;

export type AuthProviderType = typeof AuthProvider[keyof typeof AuthProvider];
