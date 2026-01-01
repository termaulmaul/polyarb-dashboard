# Contributing to PolyArb

## How to Contribute

We welcome contributions from the community! Here's how you can help improve PolyArb.

## Development Setup

### Prerequisites
- Node.js 18+ and Python 3.8+
- pnpm package manager
- Git

### Local Development

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/polyarb-dashboard.git
   cd polyarb-dashboard
   ```

3. Install dependencies:
   ```bash
   # Frontend
   pnpm install

   # Backend
   cd backend/python
   pip install -r requirements.txt
   cd ../..
   ```

4. Start development environment:
   ```bash
   ./start_full.sh
   ```

## Contribution Guidelines

### Code Style
- Follow existing TypeScript/JavaScript patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing
- Write unit tests for new features
- Test in demo mode before production
- Verify risk management works correctly

### Pull Requests
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly (demo mode first!)
4. Update documentation if needed
5. Commit with clear messages: `git commit -m "Add: feature description"`
6. Push and create PR

### Areas for Contribution

#### High Priority
- [ ] Additional risk management features
- [ ] Performance optimizations
- [ ] Mobile responsiveness improvements
- [ ] Additional test coverage

#### Medium Priority
- [ ] Market analysis tools
- [ ] Advanced charting
- [ ] Portfolio management features
- [ ] API rate limiting improvements

#### Future Enhancements
- [ ] Multi-exchange support
- [ ] Advanced order types
- [ ] Machine learning predictions
- [ ] Social trading features

## Safety First

⚠️ **IMPORTANT**: When contributing trading logic:
- Always test in demo mode first
- Never risk real money during development
- Include comprehensive risk checks
- Add emergency stop mechanisms
- Document all safety assumptions

## Reporting Issues

- Use GitHub Issues for bugs
- Include steps to reproduce
- Mention your environment (OS, Node version, etc.)
- Attach relevant logs

## Code of Conduct

- Be respectful and constructive
- Test your changes thoroughly
- Follow security best practices
- Help review others' code

## License

By contributing, you agree to license your work under the MIT License.