# 📚 Knowledge Database System

A modern, lightweight knowledge base system designed for individuals and small teams, featuring AWS IAM-style permissions, collaborative workspaces, and full-text search capabilities.

## 🌟 Features

- 🔐 **IAM Permissions System** - AWS-style fine-grained access control
- 📝 **Document Management** - Full CRUD operations with versioning
- 👥 **Workgroup Collaboration** - Team-based document sharing
- 🔍 **Full-Text Search** - PostgreSQL FTS with highlighting
- 📊 **Audit Logging** - Complete operation tracking
- 🏗️ **Modern Architecture** - React + Node.js + PostgreSQL

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18.0
- PostgreSQL ≥ 14
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/knowledge-db.git
cd knowledge-db

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start development servers
npm run dev
```

### Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **API Documentation**: http://localhost:3000/api/docs

## 📁 Project Structure

```
knowledge-db/
├── src/
│   ├── backend/          # Node.js + Express API
│   ├── frontend/         # React + Vite frontend
│   └── nlp/             # NLP module (future)
├── docs/                # Comprehensive documentation
├── tests/               # Test files
├── .gitignore          # Git ignore rules
├── .env.example        # Environment template
└── README.md           # This file
```

## 📚 Documentation

Comprehensive documentation is available in the `/ docs` directory:

- **[PRD-v2.md](docs/PRD-v2.md)** - Product requirements
- **[architecture-v2.md](docs/architecture-v2.md)** - Technical architecture
- **[api-spec-v2.md](docs/api-spec-v2.md)** - API specifications
- **[db-schema-v2.md](docs/db-schema-v2.md)** - Database design
- **[deployment.md](docs/deployment.md)** - Deployment guide
- **[security.md](docs/SECURITY.md)** - Security policies

## 🔧 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: PostgreSQL 14+
- **Authentication**: JWT + bcrypt
- **Permissions**: AWS IAM-style policies

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: TanStack Query
- **Routing**: React Router
- **HTTP Client**: Axios

## 🤝 Contributing

Please read our [Contributing Guide](docs/Contributing.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: Check the `/docs` directory
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions

## 📈 Roadmap

- [ ] NLP-powered semantic search
- [ ] Real-time collaborative editing
- [ ] Advanced analytics dashboard
- [ ] Mobile app support
- [ ] Plugin ecosystem

---

⭐ **Star this repository if you find it helpful!**
