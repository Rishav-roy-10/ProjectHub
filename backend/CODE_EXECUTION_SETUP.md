# Code Execution Setup Guide

## Overview
This feature allows users to run code in multiple programming languages using:
- **Iframe execution** for HTML, CSS, and JavaScript (client-side)
- **Judge0 API** for other programming languages (server-side)

## Setup Requirements

### 1. RapidAPI Account
- Sign up at [RapidAPI](https://rapidapi.com/)
- Subscribe to [Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce/)
- Get your API key

### 2. Environment Variables
Create a `.env` file in the backend directory with:

```env
# RapidAPI Configuration for Judge0
RAPIDAPI_KEY=your-rapidapi-key-here

# Other existing variables...
MONGODB_URI=mongodb://localhost:27017/ai-developer
JWT_SECRET=your-jwt-secret-key-here
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
PORT=3000
NODE_ENV=development
```

### 3. Dependencies
The backend already includes the required `axios` package for HTTP requests.

## Features

### Supported Languages

#### Iframe Execution (Client-side)
- **HTML** - Direct rendering
- **CSS** - Wrapped in HTML with demo content
- **JavaScript** - Wrapped in HTML with console capture

#### API Execution (Server-side via Judge0)
- **Python** (3.8.1)
- **Java** (OpenJDK 13.0.1)
- **C++** (GCC 9.2.0)
- **C** (GCC 9.2.0)
- **C#** (Mono 6.6.0.161)
- **PHP** (7.4.1)
- **Ruby** (2.7.0)
- **Go** (1.13.5)
- **Rust** (1.40.0)
- **Swift** (5.2.3)
- **Kotlin** (1.3.70)
- **Scala** (2.13.2)
- **R** (4.0.0)
- **Dart** (2.7.2)
- **TypeScript** (3.7.4)
- **Perl** (5.28.1)
- **Haskell** (8.8.1)
- **Lua** (5.3.5)
- **Bash** (5.0.0)
- **SQL** (SQLite 3.27.2)

## API Endpoints

### POST `/code/execute`
Execute code using Judge0 API

**Request Body:**
```json
{
  "sourceCode": "print('Hello World')",
  "language": "python",
  "input": "optional input data"
}
```

**Response:**
```json
{
  "success": true,
  "type": "api",
  "result": {
    "success": true,
    "output": "Hello World\n",
    "error": "",
    "executionTime": "0.123",
    "memory": "1024",
    "status": "Success"
  }
}
```

### GET `/code/languages`
Get list of supported languages

### GET `/code/health`
Health check for the code execution service

## Frontend Integration

The frontend automatically:
1. Detects file type and sets execution method
2. Shows language selector dropdown
3. Displays input field for API execution
4. Shows iframe preview or execution results
5. Handles loading states and errors

## Security Features

- **Sandboxed iframes** for client-side execution
- **Input validation** on all API endpoints
- **Rate limiting** (implemented by Judge0)
- **Error handling** for failed executions

## Usage Examples

### HTML File
- Click "Run Code" → Shows live preview in iframe

### CSS File
- Click "Run Code" → Shows styled demo content in iframe

### JavaScript File
- Click "Run Code" → Shows output with console capture in iframe

### Python File
- Click "Run Code" → Sends to Judge0 API and shows results

### Java File
- Click "Run Code" → Sends to Judge0 API and shows compilation/execution results

## Troubleshooting

### Common Issues

1. **"Code execution failed"**
   - Check RapidAPI key in .env file
   - Verify Judge0 subscription is active
   - Check backend server is running

2. **"Execution timeout"**
   - Code may be too complex or have infinite loops
   - Judge0 has execution time limits

3. **"Compilation error"**
   - Check syntax in the selected language
   - Verify language selection matches file content

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your .env file.

## Performance Notes

- **Iframe execution**: Instant, no network delay
- **API execution**: 1-5 seconds depending on code complexity
- **Memory usage**: Limited by Judge0 quotas
- **Concurrent executions**: Limited by RapidAPI plan

## Future Enhancements

- Local execution for supported languages
- Custom input/output test cases
- Code formatting and linting
- Execution history and sharing
- Custom language support
