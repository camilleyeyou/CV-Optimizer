# CV Optimizer

A full-stack web application for creating ATS-optimized resumes with AI-powered suggestions and professional PDF export.

## Features

- 🔐 User authentication with JWT
- 📄 Resume CRUD operations
- 🤖 AI-powered content suggestions
- 📊 ATS compatibility scoring
- 📑 PDF generation with multiple templates
- 🔍 Keyword analysis and optimization
- 📱 Responsive design (coming soon)

## Tech Stack

### Backend
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication
- PDFKit for PDF generation
- Natural & NLP libraries for ATS scoring

### Frontend (Coming Soon)
- React 18
- Redux Toolkit
- Material-UI/Tailwind CSS

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB Atlas account
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cv-optimizer.git
cd cv-optimizer
cat > README.md << 'EOF'
# CV Optimizer

A full-stack web application for creating ATS-optimized resumes with AI-powered suggestions and professional PDF export.

## Features

- 🔐 User authentication with JWT
- 📄 Resume CRUD operations
- 🤖 AI-powered content suggestions
- 📊 ATS compatibility scoring
- 📑 PDF generation with multiple templates
- 🔍 Keyword analysis and optimization
- 📱 Responsive design (coming soon)

## Tech Stack

### Backend
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication
- PDFKit for PDF generation
- Natural & NLP libraries for ATS scoring

### Frontend (Coming Soon)
- React 18
- Redux Toolkit
- Material-UI/Tailwind CSS

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB Atlas account
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cv-optimizer.git
cd cv-optimizer

Install server dependencies:

bashcd server
npm install

Set up environment variables:

bashcp .env.example .env
# Edit .env with your credentials

Start the development server:

bashnpm run dev
API Endpoints
Authentication

POST /api/auth/register - Register new user
POST /api/auth/login - User login
GET /api/auth/me - Get current user

Resume

POST /api/resume - Create resume
GET /api/resume - Get all resumes
GET /api/resume/:id - Get specific resume
PUT /api/resume/:id - Update resume
DELETE /api/resume/:id - Delete resume
POST /api/resume/:id/analyze - ATS analysis

PDF

POST /api/pdf/generate - Generate PDF
POST /api/pdf/preview - Preview PDF (base64)

Project Structure
cv-optimizer/
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   └── package.json
├── client/ (coming soon)
└── README.md
Contributing

Fork the repository
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

License
This project is licensed under the MIT License.
