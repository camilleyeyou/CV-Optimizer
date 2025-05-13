# CV Optimizer - ATS-Friendly Resume Builder

A modern web application that helps users create professional, ATS-friendly resumes with AI-powered optimization.

## Features

- 🤖 AI-powered content suggestions
- 📊 ATS compatibility scoring
- 📝 Multiple professional templates
- 🔒 Secure user authentication
- 📄 PDF export with clean formatting
- 📱 Mobile-responsive design
- ✨ Real-time preview
- 🎯 Job description keyword matching

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- OpenAI API integration
- PDFKit for PDF generation

### Frontend (Coming Soon)
- React 18
- Redux Toolkit
- Material-UI / Tailwind CSS
- React-PDF

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cv-optimizer.git
cd cv-optimizer
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Create environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB:
```bash
# Make sure MongoDB is running locally
mongod
```

5. Run the backend server:
```bash
npm run dev
```

The server will start at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Resume
- `POST /api/resume` - Create resume
- `GET /api/resume` - Get all resumes
- `GET /api/resume/:id` - Get specific resume
- `PUT /api/resume/:id` - Update resume
- `DELETE /api/resume/:id` - Delete resume
- `POST /api/resume/:id/analyze` - Analyze resume with ATS

### AI Features
- `POST /api/ai/summary` - Generate professional summary
- `POST /api/ai/enhance-experience` - Enhance work experience
- `POST /api/ai/suggest-skills` - Suggest relevant skills
- `POST /api/ai/cover-letter` - Generate cover letter

### PDF
- `POST /api/pdf/generate` - Generate PDF
- `POST /api/pdf/preview` - Preview PDF

## Project Structure

```
cv-optimizer/
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── server.js
│   └── package.json
├── client/ (coming soon)
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- OpenAI for AI capabilities
- PDFKit for PDF generation
- All open-source contributors

