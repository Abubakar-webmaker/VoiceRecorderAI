# 🎙️ AI Voice Recorder

A full-stack AI-powered voice recording mobile application built with **React Native** (frontend) and **Node.js/Express** (backend). The app allows users to record, manage, and transcribe audio using AI, with features like folder organization, audio playback, push notifications, subscriptions, and real-time communication via WebSockets.

---

## 📁 Project Structure

```
VoiceRecorderAI/
├── src/                        # React Native app source
│   ├── api/                    # Axios instance & API endpoints
│   ├── assets/                 # Fonts, icons, images, animations
│   ├── core/                   # Config, constants, theme, localization
│   ├── features/               # Feature-based modules
│   │   ├── ai/                 # AI transcription & analysis
│   │   ├── auth/               # Authentication
│   │   ├── folder/             # Folder management
│   │   ├── player/             # Audio playback
│   │   ├── recording/          # Voice recording
│   │   ├── settings/           # App settings
│   │   └── subscription/       # In-app subscriptions
│   ├── navigation/             # React Navigation setup
│   ├── services/               # Audio, notifications, socket, storage
│   ├── shared/                 # Reusable components, hooks, utils
│   └── store/                  # Redux store & root reducer
├── backend/                    # Express.js API server
│   └── src/
│       ├── config/             # Env, DB, Swagger, Firebase config
│       ├── controllers/        # Route controllers
│       ├── middleware/         # Auth, error, validation middleware
│       ├── models/             # Mongoose models
│       ├── routes/             # API route definitions
│       ├── services/           # Business logic services
│       ├── sockets/            # Socket.IO handlers
│       ├── types/              # TypeScript type definitions
│       ├── utils/              # Logger, helpers
│       └── validators/         # Zod validation schemas
├── android/                    # Android native project
└── ios/                        # iOS native project
```

---

## ✨ Features

- 🎙️ **Voice Recording** — High-quality audio recording with waveform visualization
- 🤖 **AI Transcription** — Automatic speech-to-text powered by OpenAI
- 📁 **Folder Organization** — Organize recordings into custom folders
- ▶️ **Audio Playback** — Full-featured player with seek, speed control
- 🔔 **Push Notifications** — Firebase Cloud Messaging via Notifee
- 💳 **Subscriptions** — Stripe-powered in-app subscription plans
- 🌐 **Real-time Sync** — Socket.IO for live updates
- 🌍 **Localization** — Multi-language support via i18next
- 🔐 **Secure Auth** — JWT access/refresh tokens + Keychain storage
- ☁️ **Cloud Storage** — Cloudinary for audio file storage

---

## 🛠️ Tech Stack

### Frontend (React Native)
| Category | Library |
|---|---|
| Framework | React Native 0.75.4 |
| Language | TypeScript |
| State Management | Redux Toolkit + Redux Persist |
| Navigation | React Navigation v6 |
| Styling | NativeWind (Tailwind CSS) + React Native Paper |
| Forms | React Hook Form + Zod |
| Audio | react-native-audio-recorder-player, react-native-track-player |
| Animations | Lottie, React Native Reanimated |
| Notifications | Notifee + Firebase Messaging |
| HTTP Client | Axios |
| Real-time | Socket.IO Client |
| Storage | AsyncStorage, React Native Keychain |

### Backend (Node.js)
| Category | Library |
|---|---|
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB + Mongoose |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| AI | OpenAI API |
| File Storage | Cloudinary + Multer |
| Real-time | Socket.IO |
| Payments | Stripe |
| Push Notifications | Firebase Admin SDK |
| Email | Nodemailer |
| Validation | Zod |
| Security | Helmet, CORS, Rate Limiting, HPP, XSS-Clean, Mongo-Sanitize |
| Logging | Winston + Morgan |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- React Native environment setup — [Guide](https://reactnative.dev/docs/set-up-your-environment)
- MongoDB (local or Atlas)
- Android Studio / Xcode

---

## 📱 Frontend Setup

**1. Install dependencies**
```sh
npm install
```

**2. Configure environment**

Create `.env.development` and `.env.production` in the root:
```env
API_BASE_URL=http://localhost:5000/api/v1
SOCKET_URL=http://localhost:5000
```

**3. iOS — Install CocoaPods**
```sh
bundle install
bundle exec pod install
```

**4. Start Metro**
```sh
npm start
# or with clean cache
npm run start:clean
```

**5. Run the app**
```sh
# Android
npm run android

# iOS
npm run ios
```

---

## 🖥️ Backend Setup

**1. Navigate to backend**
```sh
cd backend
```

**2. Install dependencies**
```sh
npm install
```

**3. Configure environment**

Copy `.env.example` to `.env` and fill in the values:
```sh
cp .env.example .env
```

```env
NODE_ENV=development
PORT=5000
API_VERSION=v1

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai_voice_recorder_dev

# JWT
JWT_ACCESS_SECRET=<your_access_secret>
JWT_REFRESH_SECRET=<your_refresh_secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

# OpenAI
OPENAI_API_KEY=<openai_api_key>

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<password>
EMAIL_FROM=<from_email>

# CORS & Rate Limiting
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CLIENT_URL=http://localhost:3000
```

**4. Start development server**
```sh
npm run dev
```

**5. Build for production**
```sh
npm run build
npm start
```

**API Docs** available at: `http://localhost:5000/api-docs`  
**Health Check** at: `http://localhost:5000/health`

---

## 📜 Available Scripts

### Frontend
| Script | Description |
|---|---|
| `npm start` | Start Metro bundler |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm run type-check` | TypeScript type check |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run build:android:release` | Build Android release APK |

### Backend
| Script | Description |
|---|---|
| `npm run dev` | Start dev server (ts-node-dev) |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run type-check` | TypeScript type check |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |

---

## 🔒 Security

The backend implements multiple security layers:
- **Helmet** — Secure HTTP headers
- **Rate Limiting** — Global (100 req/15min) + strict auth limits (20 req/15min)
- **CORS** — Configurable allowed origins
- **Mongo Sanitize** — NoSQL injection prevention
- **XSS Clean** — Cross-site scripting prevention
- **HPP** — HTTP parameter pollution prevention
- **JWT** — Short-lived access tokens (15m) + refresh tokens (7d)

---

## 🧪 Testing

```sh
# Frontend
npm test
npm run test:watch
npm run test:coverage

# Backend
cd backend && npm test
cd backend && npm run test:coverage
```

---

## 📦 Build & Release

**Android Release APK**
```sh
npm run build:android:release
# Output: android/app/build/outputs/apk/release/
```

**iOS Release**
```sh
npm run build:ios:release
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'feat: add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.
