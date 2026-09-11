# ⚡ CP Arena

**A competitive programming judge for VS Code.**
Compile, run, and test your solutions against multiple test cases — all without leaving your editor.

[![Version](https://img.shields.io/visual-studio-marketplace/v/AashwatJain.cp-arena)](https://marketplace.visualstudio.com/items?itemName=AashwatJain.cp-arena)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/AashwatJain.cp-arena)](https://marketplace.visualstudio.com/items?itemName=AashwatJain.cp-arena)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧪 **Test Case Management** | Add, edit, delete, and re-run test cases inline in the sidebar |
| ▶️ **One-Click Run** | Compile and run all test cases — or a single one — with one click |
| 📡 **Competitive Companion** | Auto-import problems and test cases from Codeforces, AtCoder, CodeChef, and 50+ judges |
| ✅ **Verdict System** | Instant `AC` / `WA` / `TLE` / `RTE` / `CE` verdicts with execution time |
| 🌐 **Multi-Language** | C++, C, Java, Python, JavaScript, Rust, and Go |
| 📤 **Quick Submit** | Copies your code to the clipboard and opens the submission page |
| 🔁 **CPH Compatible** | Automatically imports problems saved by the legacy Competitive Programming Helper (`.cph`) |
| 🚦 **ONLINE_JUDGE Toggle** | Compile C/C++ with `-DONLINE_JUDGE` straight from the sidebar |
| 🎨 **Native UI** | A clean, dark-themed sidebar that feels at home in VS Code |

---

## 🚀 Getting Started

### Prerequisites

- **VS Code** `1.80.0` or later
- A compiler / interpreter for the language you use, installed and available on your `PATH`
  (e.g. `g++` for C++, `python3` for Python, `javac` / `java` for Java, `rustc` for Rust, `go`, `node`)
- *(Optional)* the [Competitive Companion](https://github.com/jmerle/competitive-companion) browser extension for auto-importing problems

### Installation

Search for **"CP Arena"** in the VS Code Extensions view and click **Install**, or:

```bash
code --install-extension AashwatJain.cp-arena
```

---

## ⚠️ Configure Your Compiler First

CP Arena runs whatever compile/run command you configure — so the commands need to match **your** machine. The shipped defaults may not work as-is on every OS (for example, the default C++ command targets a specific compiler/OS).

Open **Settings** (`Ctrl+,` / `Cmd+,`) → search **"CP Arena"**, and set the command for your setup. A few common C++ examples:

| OS / Toolchain | Suggested `cp-arena.cpp.compileCommand` |
|---|---|
| Linux / Windows (MinGW) | `g++ -O2 -std=c++17 -Wall` |
| macOS (Homebrew GCC 15) | `g++-15 -O2 -std=c++23` |
| Clang | `clang++ -O2 -std=c++17` |

> 💡 Don't include the input/output file names or the `-o` flag — CP Arena appends those automatically. Just provide the compiler and the flags you want.

The same applies to the C, Java, Rust, and Python commands (see the [Configuration](#️-configuration) table). Edit whichever ones you use.

---

## 📖 Usage

### Import a Problem
Install **Competitive Companion** in your browser, open any problem, and click the green **+** icon. CP Arena creates the source file, saves the test cases, and loads everything into the sidebar.

### Run Test Cases
1. Open your solution file — the sidebar focuses on it automatically
2. Click **▶ Run All** in the sidebar (or the status-bar button)
3. Verdicts stream in: ✅ `AC`, ❌ `WA`, ⏱ `TLE`, 💥 `RTE`, 🛠 `CE`

You can also click **▶** on a single test case card to run just that one. Passing cases collapse automatically; failing ones expand so you can see the diff.

### Add / Edit / Delete Test Cases
- **Add:** click **+ New TC** and fill in the input and expected output
- **Edit:** expand a case, change the fields, and click away — it saves automatically
- **Delete:** click the 🗑 icon on a case

### Stop Execution
Click ⏹ (or run `CP Arena: Stop Execution`) to immediately kill a running solution, including child processes from wrappers like `go run` and `java`.

### Submit Your Solution
Click the ✈ **Submit** icon. CP Arena saves the file, copies your code to the clipboard, and opens the correct submission page in your browser. Paste and submit.

### `ONLINE_JUDGE` Toggle
The `OJ` toggle in the bottom bar controls whether `-DONLINE_JUDGE` is passed to the C/C++ compiler — handy for switching between local debug output and submission builds.

---

## ⚙️ Configuration

All settings live under **Settings → Extensions → CP Arena**.

| Setting | Default | Description |
|---|---|---|
| `cp-arena.general.defaultLanguage` | `cpp` | Default language for imported problems |
| `cp-arena.general.timeLimit` | `3000` | Default time limit per test case (ms) |
| `cp-arena.general.companionPort` | `10043` | Competitive Companion listener port |
| `cp-arena.general.savePath` | *(workspace)* | Where new problem files are saved |
| `cp-arena.cpp.compileCommand` | *(compiler + flags)* | **Edit this to match your C++ compiler** |
| `cp-arena.c.compileCommand` | `gcc -std=c17 -O2 -Wall` | C compile command |
| `cp-arena.java.compileCommand` | `javac` | Java compile command |
| `cp-arena.java.runCommand` | `java` | Java run command |
| `cp-arena.rust.compileCommand` | `rustc -O` | Rust compile command |
| `cp-arena.python.runCommand` | `python3` | Python interpreter |

---

## 🛠 Supported Languages

| Language | Mode | Default Tool |
|---|---|---|
| **C++** | compiled | `g++` |
| **C** | compiled | `gcc` |
| **Rust** | compiled | `rustc` |
| **Java** | compiled + run | `javac` + `java` |
| **Python** | interpreted | `python3` |
| **JavaScript** | interpreted | `node` |
| **Go** | run | `go run` |

---

## 📋 Commands

Available from the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---|---|
| `CP Arena: Run All Test Cases` | Compile and run every test case |
| `CP Arena: Add Test Case` | Add a new empty test case |
| `CP Arena: Stop Execution` | Kill the running solution |
| `CP Arena: Clear All Test Cases` | Remove all test cases |
| `CP Arena: Submit Code` | Copy code and open the submission page |

---

## 🏗 Building from Source

```bash
git clone https://github.com/AashwatJain/cp-arena.git
cd cp-arena
npm install
npm run build      # bundles src/ → dist/ with esbuild
npx vsce package   # produces a .vsix
```

Press **F5** in the project to launch a development window with the extension loaded.

---

## 📜 License

Licensed under the terms in [LICENSE.md](LICENSE.md).

---

<p align="center">
  Made with ❤️ for competitive programmers
</p>
