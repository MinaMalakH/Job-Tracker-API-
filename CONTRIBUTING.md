# Contributing to Job Tracker API

Thank you for your interest in contributing! This guide will help you get
started quickly and make sure your changes are easy to review.

## ✏️ How to Contribute

1. **Fork the repository** and clone your fork.
2. Create a new branch for each feature or bug fix:
   ```bash
   git checkout -b feature/describe-thing
   ```
3. Make your changes, keeping code style consistent (TypeScript, linting, etc.).
4. Add tests for new functionality and make sure existing tests pass:
   ```bash
   npm test
   ```
5. Commit with a descriptive message and push your branch.
6. Open a pull request against the `main` branch of the original repository.

## 🧪 Testing

The project uses **Jest** for unit tests and **Supertest** for API integration
tests. Tests live in the `tests/` directory and are triggered by `npm test`.

## 📄 Code Style

- Use TypeScript types and interfaces where appropriate.
- Keep functions small and focused.
- Write clear, concise comments on complex logic.

## 📚 Documentation

Update `README.md` or add new files under `docs/` when you introduce new
features or break significant existing behavior.

## ⚠️ Issues

If you discover a bug or have a feature request, please first check existing
issues. If none match, create a new issue with as much detail as possible.
Include steps to reproduce, expected behavior, and any relevant logs.

We appreciate your contributions! 😊
