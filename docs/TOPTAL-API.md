# Toptal API Integration

## Overview

The CSS & JS Minifier extension integrates with Toptal's free minification APIs to provide CSS and JavaScript compression services.

## API Endpoints

### CSS Minification
- **URL**: `https://www.toptal.com/developers/cssminifier/api/raw`
- **Method**: POST
- **Content-Type**: `application/x-www-form-urlencoded`
- **Body**: `input=<css_content>`

### JavaScript Minification
- **URL**: `https://www.toptal.com/developers/javascript-minifier/api/raw`
- **Method**: POST
- **Content-Type**: `application/x-www-form-urlencoded`
- **Body**: `input=<js_content>`

## API Limitations

### Rate Limiting
- **Limit**: 30 requests per minute per IP address
- **Response**: HTTP 429 Too Many Requests
- **Reset**: Rate limit resets every minute

### File Size Limits
- **Maximum**: 5MB per request
- **Response**: HTTP 413 Request Entity Too Large
- **Recommendation**: Split large files or use alternative solutions

### Content Restrictions
- **Supported**: Valid CSS and JavaScript syntax
- **Validation**: Server-side syntax checking
- **Response**: HTTP 422 Unprocessable Entity for invalid syntax

## Request/Response Format

### Successful Request
```http
POST /developers/cssminifier/api/raw HTTP/1.1
Host: www.toptal.com
Content-Type: application/x-www-form-urlencoded

input=body { color: red; margin: 0; }
```

### Successful Response
```http
HTTP/1.1 200 OK
Content-Type: text/plain

body{color:red;margin:0}
```

### Error Response (Rate Limited)
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "message": "Maximum 30 requests per minute allowed"
}
```

## Implementation Details

### Error Handling Strategy
```typescript
switch (response.status) {
    case 400:
        errorMessage = 'Missing input parameter. Please ensure the file has content.';
        break;
    case 405:
        errorMessage = 'Invalid request method. This is an internal error, please try again.';
        break;
    case 406:  
        errorMessage = 'Invalid content type. This is an internal error, please try again.';
        break;
    case 413:
        errorMessage = 'File too large. Maximum allowed size is 5MB. Please reduce the file size.';
        break;
    case 422:
        errorMessage = `Invalid ${fileType} syntax. Please check your code for syntax errors.`;
        break;
    case 429:
        errorMessage = 'Rate limit exceeded. API allows 30 requests per minute. Please wait a moment and try again.';
        break;
    default:
        errorMessage = `${apiConfig.name} API error (${response.status}): ${response.statusText}`;
}
```

### Timeout Configuration
- **Default Timeout**: 5000ms (5 seconds)
- **Reason**: Based on performance testing showing responses up to 1100ms
- **Fallback**: User-friendly timeout message with retry suggestion

### Request Optimization
```typescript
// Form-encoded request body
const requestBody = new URLSearchParams({ input: text });

// Race timeout against fetch request
const response = await Promise.race([
    fetch(apiConfig.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody
    }),
    timeoutPromise
]);
```

## Performance Characteristics

### Response Times
- **Typical**: 200-400ms for small files (<10KB)
- **Large Files**: 800-1100ms for files approaching 1MB
- **Network Dependent**: Additional latency based on user location

### Compression Ratios
- **CSS**: Typically 20-40% size reduction
- **JavaScript**: Typically 15-30% size reduction  
- **Variables**: Depends on original formatting and comment density

### Reliability
- **Uptime**: Generally high availability
- **Maintenance**: Occasional brief outages for updates
- **Geographic**: Performance varies by user location

## Alternative Providers

### Potential Alternatives
1. **JSCompress.com API** - Similar service with different rate limits
2. **Local Minification** - Using libraries like `terser` or `clean-css`
3. **Build Tool Integration** - Webpack, Gulp, or Grunt plugins

### Migration Considerations
- Service interface abstraction allows for easy provider switching
- Configuration management for API endpoints
- Fallback mechanisms for service unavailability

## Security Considerations

### Data Privacy
- **Transmission**: HTTPS encrypted requests
- **Storage**: No server-side storage of submitted code
- **Logging**: Minimal logging for rate limiting purposes

### Content Safety
- **Validation**: Server-side syntax validation prevents malicious code execution
- **Isolation**: Each request processed independently
- **Sanitization**: No code execution, only text processing

## Monitoring and Debugging

### Request Logging
```typescript
// Debug information for troubleshooting
console.log(`API Request: ${apiConfig.url}`);
console.log(`Content Length: ${text.length} characters`);
console.log(`Response Status: ${response.status}`);
console.log(`Response Time: ${Date.now() - startTime}ms`);
```

### Health Checks
- Monitor API availability during extension startup
- Graceful degradation when API is unavailable
- User notification for service outages

### Error Tracking
- Categorize errors by type (network, rate limit, syntax)
- Provide actionable feedback to users
- Log patterns for debugging recurring issues

---

**Last Updated**: October 16, 2025
**Extension Version**: 1.0.0