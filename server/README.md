# Physics Pocket Lab - Backend API

A comprehensive backend API for the Physics Pocket Lab educational platform, built with Node.js, Express, and MongoDB.

## Features

- 🔐 **Authentication & Authorization** - JWT-based user authentication
- 🧪 **Experiment Management** - CRUD operations for physics experiments
- 📊 **Progress Tracking** - User progress monitoring and analytics
- 🎯 **Quiz System** - Interactive quizzes with automatic grading
- 🏆 **Gamification** - Points, badges, and leaderboards
- 📅 **Daily Challenges** - Engaging daily tasks for users
- 🔍 **Search & Filtering** - Advanced experiment discovery
- 📈 **Analytics** - User performance and engagement metrics

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Environment Setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB** (if using local instance):
   ```bash
   mongod
   ```

4. **Seed the database:**
   ```bash
   npm run seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Experiments
- `GET /api/experiments` - List experiments (with filtering)
- `GET /api/experiments/:id` - Get experiment details
- `GET /api/experiments/meta/categories` - Get available categories

### User Progress
- `GET /api/user-progress` - Get user's progress
- `GET /api/user-progress/experiment/:id` - Get progress for specific experiment
- `POST /api/user-progress` - Create/update progress

### Quiz System
- `GET /api/quiz/experiment/:id` - Get quiz questions
- `POST /api/quiz/submit` - Submit quiz answers
- `GET /api/quiz/attempts` - Get user's quiz attempts

### Gamification
- `GET /api/gamification/points` - Get point transactions
- `GET /api/gamification/badges` - Get user badges
- `GET /api/gamification/leaderboard` - Get leaderboard
- `GET /api/gamification/daily-challenges` - Get daily challenges
- `POST /api/gamification/daily-challenges/:id/complete` - Complete challenge

## Database Models

### User
- Authentication and profile information
- Points, level, and badges
- User preferences

### Experiment
- Experiment details and content
- Theory, procedures, and materials
- Simulation parameters
- Quiz questions

### UserProgress
- Individual progress tracking
- Time spent and completion status
- Simulation data and notes

### QuizAttempt
- Quiz submissions and scores
- Answer analysis and grading
- Performance tracking

### PointTransaction
- Point earning and spending history
- Transaction types and descriptions
- Experiment and challenge references

### DailyChallenge
- Daily tasks and objectives
- Reward points and difficulty
- Completion tracking

### UserBadge
- Badge achievements
- Earning criteria and timestamps
- Badge categories and descriptions

## Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/physics-pocket-lab

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

## Development

### Running Tests
```bash
npm test
npm run test:watch
```

### Database Seeding
```bash
npm run seed
```

### Code Structure
```
server/
├── config/          # Database configuration
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API route handlers
├── seeders/         # Database seeding scripts
├── index.js         # Main server file
└── package.json     # Dependencies and scripts
```

## Security Features

- Helmet.js for security headers
- Rate limiting to prevent abuse
- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration

## Performance Features

- MongoDB indexing for fast queries
- Pagination for large datasets
- Efficient aggregation pipelines
- Connection pooling
- Request logging with Morgan

## Deployment

### Production Environment
1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Configure MongoDB Atlas or production database
4. Set up proper logging and monitoring
5. Use PM2 or similar for process management

### Docker Support (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details