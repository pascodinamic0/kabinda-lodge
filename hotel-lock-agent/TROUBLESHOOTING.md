# Troubleshooting Installation

## Issue: better-sqlite3 compilation fails

If you see errors about `better-sqlite3` failing to compile, this is because it's a native module that needs to be built. Common causes:

### Solution 1: Install build tools

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt-get install build-essential
# or
sudo yum groupinstall "Development Tools"
```

**Windows:**
Install Visual Studio Build Tools or use `npm install --global windows-build-tools`

### Solution 2: Use alternative (if better-sqlite3 continues to fail)

If `better-sqlite3` continues to have issues, you can temporarily use a file-based queue instead. Update `src/main/queue.ts` to use JSON files instead of SQLite.

### Solution 3: Path with spaces

If your project path has spaces (like "Pascal Digny"), node-gyp may have issues. Try:
1. Moving the project to a path without spaces
2. Or using a symlink to a path without spaces

## Issue: node-hid installation fails

`node-hid` also requires native compilation. Same solutions as above apply.

## Issue: @types/node-hid not found

This package doesn't exist. The code uses `require()` for node-hid to avoid type issues. This is fine - the code will work without types.

## Quick Fix: Skip native modules for now

If you just want to test the structure without hardware:

1. Comment out `better-sqlite3` and use a JSON file queue
2. Comment out `node-hid` and use mock card encoder
3. The rest of the agent will work for testing pairing and API integration




