# ⚡ CP Arena

**A premium competitive programming judge for VS Code.**
Compile, run, and test your solutions — all without leaving your editor.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧪 **Test Case Management** | Add, edit, and delete test cases right in the sidebar |
| ▶️ **One-Click Run** | Compile and run all test cases with a single click |
| 📡 **Competitive Companion** | Auto-import problems & test cases from Codeforces, AtCoder, and more |
| ✅ **Verdict System** | Instant AC / WA / TLE / RE / CE verdicts with execution time |
| 📤 **Quick Submit** | Copies your code to clipboard and opens the submission page |
| 🎨 **Beautiful UI** | A sleek, dark-themed sidebar that feels native to VS Code |

---

## 🚀 Getting Started

### Prerequisites

- **VS Code** `1.80.0` or later
- A **C++ compiler** (e.g. `g++`) installed and available in your PATH
- *(Optional)* [Competitive Companion](https://github.com/jmerle/competitive-companion) browser extension for auto-importing problems

### Installation

1. Download the latest `.vsix` file from Releases
2. Open VS Code → Extensions → `⋯` menu → **Install from VSIX…**
3. Select the downloaded file — done!

---

## 📖 Usage

### Import a Problem
Install the **Competitive Companion** browser extension, navigate to any problem on Codeforces (or other supported judges), and click the ➕ icon. The problem and its test cases will automatically appear in the CP Arena sidebar.

### Run Test Cases
1. Open your `.cpp` solution file — the sidebar will auto-focus
2. Click **▶ Run All** or press the status bar button
3. Watch verdicts appear in real-time: ✅ AC, ❌ WA, ⏱ TLE, 💥 RE

### Add Custom Test Cases
Click the **＋ Add Test Case** button in the sidebar to create your own inputs and expected outputs.

### Submit Your Solution
Click **Submit** — your code is copied to the clipboard and the judge's submission page opens in your browser. Just paste and submit!

---

## ⚙️ Configuration

All settings are available under **Settings → Extensions → CP Arena**.

| Setting | Default | Description |
|---|---|---|
| `cp-arena.general.defaultLanguage` | `cpp` | Default language for new problems |
| `cp-arena.general.timeLimit` | `3000` | Time limit per test case (ms) |
| `cp-arena.general.companionPort` | `10043` | Competitive Companion listener port |
| `cp-arena.general.savePath` | *(workspace)* | Default save path for problem files |
| `cp-arena.cpp.compileCommand` | `g++-15 -O2 -std=c++23` | C++ compilation command |
| `cp-arena.python.runCommand` | `python3` | Python interpreter command |
| `cp-arena.java.compileCommand` | `javac` | Java compile command |
| `cp-arena.java.runCommand` | `java` | Java run command |
| `cp-arena.rust.compileCommand` | `rustc -O` | Rust compile command |
| `cp-arena.c.compileCommand` | `gcc -std=c17 -O2 -Wall` | C compile command |

---

## 🛠 Supported Languages

- **C++** — Full support with customizable compile flags
- **C** — Compile and run with GCC
- **Python** — Interpreted execution
- **Java** — Compile and run
- **Rust** — Compile and run
- **Go** — Compile and run

---

## 📋 Commands

| Command | Description |
|---|---|
| `CP Arena: Run All Test Cases` | Compile and run all test cases |
| `CP Arena: Add Test Case` | Add a new empty test case |
| `CP Arena: Stop Execution` | Kill running processes |
| `CP Arena: Clear All Test Cases` | Remove all test cases |
| `CP Arena: Submit Code` | Copy code + open submission page |

---

## 🏗 Building from Source

```bash
# Clone the repository
git clone https://github.com/AashwatJain/cp-arena.git
cd cp-arena

# Install dependencies
npm install

# Build
npm run build

# Package as VSIX
npx vsce package
```

---

## 📜 License

This project is licensed under the terms specified in [LICENSE.md](LICENSE.md).

---

<p align="center">
  Made with ❤️ for competitive programmers
</p>
