backend/
├── config/
│   ├── db.js            # MongoDB connection
│   └── redis.js         # Redis connection
├── models/
│   ├── User.js
│   ├── MoodLog.js
│   ├── Insight.js
│   └── CollectiveMood.js
├── routes/
│   ├── auth.js
│   ├── logs.js
│   ├── insights.js
│   ├── collective.js
│   ├── therapist.js
│   └── reports.js
├── controllers/         # Logic for each route
├── middleware/
│   ├── auth.js          # JWT verification
│   └── rateLimiter.js
├── services/
│   ├── weatherService.js
│   ├── calendarService.js
│   ├── aiService.js     # OpenAI calls
│   └── notificationService.js
├── jobs/
│   └── insightCron.js   # Nightly AI analysis
├── .env
├── server.js
└── package.json