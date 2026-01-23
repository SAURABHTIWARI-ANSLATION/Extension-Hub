API Tester - Chrome Extension
A lightweight REST API testing tool for Chrome browser. Quickly test APIs without leaving your browser or opening Postman.

https://img.shields.io/badge/Version-1.0.0-blue
https://img.shields.io/badge/License-MIT-green
https://img.shields.io/badge/Platform-Chrome-yellow

API Tester Pro includes a professional theme system with 5 carefully designed themes:

### **Available Themes:**
| Theme | Best For | Characteristics |
|-------|----------|-----------------|
| **Ocean Blue** | Developer tools, productivity | Professional, reliable, high contrast |
| **Mint Teal** | Daily-use tools, trackers | Calm, refreshing, reduces eye strain |
| **Indigo Night** | Security, finance, analytics | Premium, focused, conveys trust |
| **Sky Gradient** | Beginner tools, education | Soft, approachable, easy to understand |
| **Violet Glow** | Creative tools, design | Modern, expressive, distinctive |

### **How to Change Theme:**
1. Click the ⚙️ settings button in top-right
2. Select your preferred theme
3. Click "Save Settings"
4. Theme applies immediately

### **Theme Guidelines:**
- One theme per extension (no rotation)
- Theme selection based on tool purpose
- Maintains accessibility standards (4.5:1 contrast ratio)
- Consistent layout across all themes
🚀 Features
Core Features
✅ Multiple HTTP Methods: GET, POST, PUT, DELETE, PATCH

✅ Custom Headers: Add and manage request headers

✅ Request Body Support: JSON, Text, and Form-Data formats

✅ Real-time Response: View formatted JSON responses

✅ Response Details: Status code, response time, size

✅ No External APIs: All client-side, no data sent to servers

Advanced Features
📊 Response Tabs: Body (formatted), Headers, and Raw views

📋 Copy to Clipboard: One-click response copying

🕒 Request History: Last 20 requests stored locally

⏱️ Performance Metrics: Response time and size tracking

🎨 Clean UI: Modern, intuitive interface

📦 Installation
Method 1: Load Unpacked (Development)
Download or clone this repository

Open Chrome and navigate to chrome://extensions/

Enable Developer mode (toggle in top-right)

Click "Load unpacked"

Select the extension folder

Pin the extension to your toolbar

Method 2: From ZIP File
Download api-tester-extension.zip

Extract the ZIP file

Follow steps 2-6 from Method 1

🛠️ Usage
Making Your First Request
1. GET Request
text
1. Select Method: GET
2. Enter URL: https://jsonplaceholder.typicode.com/posts/1
3. Click "Send"
2. POST Request
text
1. Select Method: POST
2. Enter URL: https://jsonplaceholder.typicode.com/posts
3. Add Header: Content-Type: application/json
4. Enter Body: {"title": "foo", "body": "bar", "userId": 1}
5. Click "Send"
Request Types Supported
Method	Description	When to Use
GET	Retrieve data	Fetching resources
POST	Create data	Adding new records
PUT	Update data	Full resource updates
DELETE	Remove data	Deleting resources
PATCH	Partial update	Partial modifications
Body Formats
Format	Content-Type	Example
JSON	application/json	{"key": "value"}
Text	text/plain	Plain text data
Form Data	application/x-www-form-urlencoded	key1=value1&key2=value2
🎯 Quick Start Examples
Test API 1: JSONPlaceholder
bash
# GET single post
GET https://jsonplaceholder.typicode.com/posts/1

# POST new post
POST https://jsonplaceholder.typicode.com/posts
Body: {"title": "My Post", "body": "Content", "userId": 1}
Test API 2: ReqRes
bash
# GET users
GET https://reqres.in/api/users?page=2

# POST login
POST https://reqres.in/api/login
Body: {"email": "eve.holt@reqres.in", "password": "cityslicka"}
Test API 3: Public APIs
bash
# GET random joke
GET https://official-joke-api.appspot.com/random_joke

# GET cat facts
GET https://cat-fact.herokuapp.com/facts
🔧 Keyboard Shortcuts
Action	Shortcut
Send Request	Enter in URL field
Toggle Headers	Click [+] next to Headers
Toggle Body	Click [+] next to Body
Switch Tabs	Click on Body/Headers/Raw tabs
📁 Project Structure
text
api-tester-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Main interface
├── popup.js              # Core functionality
├── style.css             # Styling
└── icons/                # Extension icons
    ├── icon16.png        # 16x16 icon
    ├── icon48.png        # 48x48 icon
    └── icon128.png       # 128x128 icon
🔐 Permissions
Permission	Reason
storage	Save request history locally
<all_urls>	Make requests to any API endpoint
Note: No data is sent to external servers. All data is stored locally in your browser.

🚨 Troubleshooting
Common Issues & Solutions
1. CORS Errors
text
Error: Failed to fetch
Cross-Origin Request Blocked
Solution: Test APIs that support CORS or use a CORS proxy.

2. Invalid JSON Response
Solution: Use "Raw" tab to view unformatted response.

3. Request Timeout
Solution: Check internet connection and API endpoint availability.

4. Extension Not Loading
Solution:

Ensure Developer mode is enabled

Check for errors in chrome://extensions/

Reload the extension

Debug Mode
Open Developer Tools on the extension popup:

Right-click on extension popup

Select "Inspect"

Check Console for errors

🔄 Development
Prerequisites
Google Chrome browser

Basic knowledge of HTML, CSS, JavaScript

Text editor (VS Code recommended)

Modifying the Extension
Add New HTTP Method
Edit popup.html - Add option to method select

Edit popup.js - Update updateBodyVisibility() function

Change UI Theme
Edit style.css - Modify color variables

Variables to change:

css
--primary-color: #3498db;
--success-color: #2ecc71;
--error-color: #e74c3c;
Increase History Limit
Edit popup.js:

javascript
// Change from 20 to desired number
if (requestHistory.length > 50) {
    requestHistory = requestHistory.slice(0, 50);
}
🌟 Feature Roadmap
Planned Features
Environment variables support

Request collections/saving

GraphQL support

Authentication helpers (OAuth, JWT)

curl command export

Response validation

Request scheduling

Dark/Light theme toggle

Want to Contribute?
Fork the repository

Create a feature branch

Make your changes

Submit a pull request

📚 Learning Resources
API Testing Concepts
REST API Tutorial

HTTP Status Codes

JSON Introduction

Chrome Extension Development
Chrome Extension Documentation

Manifest V3 Guide

Chrome APIs

🔗 Useful APIs for Testing
API	Description	Free Tier
JSONPlaceholder	Fake REST API	Yes
ReqRes	Test API with authentication	Yes
Public APIs	Collection of public APIs	Yes
Dog API	Dog pictures	Yes
OpenWeatherMap	Weather data	Limited
🤝 Support
Found a Bug?
Check existing issues

Create new issue with:

Steps to reproduce

Expected behavior

Actual behavior

Screenshots if applicable

Have a Feature Request?
Check feature roadmap

Submit detailed feature request

📄 License
MIT License - See LICENSE file for details.

🙏 Acknowledgments
Icons made with Favicon Generator

Color palette from Flat UI Colors

Test APIs from JSONPlaceholder

⭐ Quick Tips
Bookmark frequent APIs - Use history feature

Format JSON - Click "Format JSON" button for readable responses

Copy responses - One-click copy for sharing results

Check response time - Optimize slow APIs

Use history - Quickly re-run previous requests

Happy API Testing! 🚀

If you find this extension useful, consider giving it a star on GitHub!