import mongoose, { type Document, type Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ─── Enums ────────────────────────────────────────────────────────
export enum UserRole {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

// ─── Interface ────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  authProvider: AuthProvider;
  googleId?: string;
  avatar?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  fcmToken?: string;
  storageUsed: number;   // bytes
  storageLimit: number;  // bytes
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
}

interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

// ─── Schema ───────────────────────────────────────────────────────
const userSchema = new Schema<IUser, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Query mein by default nahi aayega
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.FREE,
    },
    authProvider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
    },
    googleId: {
      type: String,
      sparse: true, // null values unique index allow karta hai
    },
    avatar: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    storageUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    storageLimit: {
      type: Number,
      default: 524_288_000, // 500MB — free tier
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        // Sensitive fields response mein kabhi nahi jayenge
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// ─── Pre-save: Password Hash ──────────────────────────────────────
userSchema.pre<IUser>('save', async function (next) {
  // Password change nahi hua toh hash mat karo
  if (!this.isModified('password') || !this.password) return next();

  const saltRounds = parseInt(process.env['BCRYPT_SALT_ROUNDS'] ?? '12', 10);
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password as string);
};

userSchema.methods.generateEmailVerificationToken = function (): string {
  // Raw token email mein jayega
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Hashed version DB mein store hoga
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // 24 hours
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return rawToken;
};

userSchema.methods.generatePasswordResetToken = function (): string {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // 1 hour
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

  return rawToken;
};

userSchema.methods.isLocked = function (): boolean {
  if (!this.lockUntil) return false;
  return (this.lockUntil as Date) > new Date();
};

userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  this.loginAttempts = (this.loginAttempts as number) + 1;

  if ((this.loginAttempts as number) >= MAX_ATTEMPTS && !this.isLocked()) {
    this.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }

  await (this as IUser).save();
};

// ─── Static Methods ───────────────────────────────────────────────
userSchema.static('findByEmail', function (email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase().trim() });
});

export const UserModel = mongoose.model<IUser, IUserModel>('User', userSchema);