# CV Optimizer

A full-stack web application for creating ATS-optimized resumes with AI-powered suggestions, professional PDF/DOCX export, and interview preparation tools.

## Features

- **Authentication** — Supabase Auth with JWT tokens and row-level security
- **Resume Builder** — Create and edit resumes with a guided form interface
- **AI-Powered Content** — Generate summaries, enhance bullet points, suggest skills, and tailor resumes to job descriptions
- **ATS Scoring** — Upload a PDF resume and get a detailed ATS compatibility analysis
- **PDF & DOCX Export** — Download resumes in multiple formats with professional templates
- **Cover Letters** — AI-generated cover letters tailored to specific job postings
- **Interview Prep** — AI-generated interview questions with answer evaluation
- **Job Tracker** — Kanban-style board to track applications (saved, applied, interview, offer, rejected)
- **Email Generator** — Follow-up, thank-you, acceptance, and decline emails
- **Resume Translation** — Translate resumes into other languages
- **AI Resume Creator** — Answer job-specific questions and get a complete resume generated
- **LinkedIn Import** — Parse a LinkedIn PDF export into structured resume data
- **Credit System** — Free tier (5 AI credits/month) with Pro/Premium unlimited access

## Tech Stack

### Backend
- **Runtime**: Node.js + Express
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **AI**: OpenAI API (gpt-4o-mini)
- **PDF Generation**: PDFKit (server-side)
- **DOCX Generation**: docx library
- **Security**: Helmet, CORS, express-rate-limit, express-validator
- **File Uploads**: Multer (in-memory, 5MB limit)

### Frontend
- **Framework**: React 19 with React Router v7
- **Auth**: Supabase JS client
- **HTTP**: Axios with auth interceptors
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **PDF (client)**: jsPDF + html2canvas

### Deployment
- **Platform**: Vercel (serverless functions)
- **Database**: Supabase hosted PostgreSQL
- **Environment Variables**: Vercel dashboard (never committed)

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key

### Installation

```bash
git clone https://github.com/camilleyeyou/CV-Optimizer.git
cd CV-Optimizer
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### Environment Variables

Copy the example files and fill in your credentials:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**Server** (`server/.env`):
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5002) |
| `NODE_ENV` | `development` or `production` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI API key |
| `CLIENT_URL` | Frontend URL (for CORS in production) |

**Client** (`client/.env`):
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_API_URL` | API URL (leave blank for Vercel) |

### Development

```bash
npm run dev
```

This starts both the client (port 3000) and server (port 5002) concurrently.

### Database Setup

Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor to create the required tables, RLS policies, and triggers.

## API Endpoints

### AI Features (require auth + credits)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/summary` | Generate professional summary |
| POST | `/api/ai/enhance-experience` | Improve work experience bullets |
| POST | `/api/ai/cover-letter` | Generate cover letter |
| POST | `/api/ai/suggest-skills` | Suggest relevant skills |
| POST | `/api/ai/tailor` | Tailor resume to job description |
| POST | `/api/ai/generate-questions` | Generate form questions from job desc |
| POST | `/api/ai/generate-resume` | Generate full resume from answers |
| POST | `/api/ai/interview-questions` | Generate interview prep questions |
| POST | `/api/ai/evaluate-answer` | Evaluate interview answer |
| POST | `/api/ai/generate-email` | Generate professional emails |
| POST | `/api/ai/translate-resume` | Translate resume to target language |

### ATS Features (require auth + credits)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ats/analyze` | Analyze PDF resume for ATS compatibility |
| POST | `/api/ats/optimize` | Get AI optimization suggestions |
| POST | `/api/ats/parse` | Parse PDF to JSON structure |
| POST | `/api/ats/quick-score` | Score resume against job title |

### Export (require auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/pdf/generate` | Generate PDF resume |
| POST | `/api/pdf/generate-docx` | Generate DOCX resume |

### System
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/credits` | Get user credit balance (auth required) |

## Project Structure

```
CV-Optimizer/
├── api/index.js              # Vercel serverless entry point
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # Page components
│   │   ├── services/api.js   # Axios client with auth
│   │   ├── context/          # Auth & Resume contexts
│   │   └── config/           # Supabase client init
│   └── public/fonts/         # Web fonts (same faces the PDF embeds)
├── server/                   # Express backend
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── services/         # Business logic (OpenAI, ATS, PDF, DOCX, fonts)
│   │   ├── middleware/       # Auth, credits, validation
│   │   ├── routes/           # Route definitions
│   │   ├── fonts/            # Embedded TTF/OTF faces for PDF export
│   │   └── server.js         # Express app setup
│   └── __tests__/            # Server tests
├── design-system/            # UI/UX design documentation
├── scripts/                  # Template validation & preview/PDF parity harness
├── template-registry.json    # Single source of truth for templates + layout
├── TEMPLATES.md              # Template contract — read before adding one
├── supabase-schema.sql       # Database schema
└── vercel.json               # Deployment config
```

## Résumé templates

Templates are defined entirely in `template-registry.json`, which is also the
shared layout contract the live preview and the PDF exporter both obey — that is
what keeps the on-screen page count equal to the exported one.

**Read [TEMPLATES.md](TEMPLATES.md) before adding or changing a template.** It
documents every field a template must define, what each of the three renderers
(preview, PDF, DOCX) consumes, and the rules (registry-driven only, no fabricated
data, no per-template branching in renderers).

Every template must pass the shipping gate before it ships:

```bash
npm run validate:templates                      # all templates
npm run validate:templates -- --templates=my-new-one
npm run validate:templates -- --no-preview      # skip Chromium
```

It renders each template against the stress fixture and asserts no content falls
outside the page box, the page count stays within the declared budget, non-Latin
text renders and is extractable, the preview and PDF agree on page count, and the
DOCX keeps all content in the declared section order. Needs `python3` with
`pymupdf`, plus Playwright and a local Chrome for the preview pass.

## License

This project is licensed under the MIT License.
