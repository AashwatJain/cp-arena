# ⚡ CP Arena

**A competitive programming judge for VS Code.**
Compile, run, and test your solutions against multiple test cases without leaving your editor.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧪 **Test Case Management** | Add, edit, delete, and re-run test cases from the sidebar |
| ▶️ **One-Click Run** | Compile once and run every test case, or re-run just one |
| 📡 **Competitive Companion** | Auto-import problems and test cases from Codeforces, AtCoder, CodeChef, and other judges |
| ✅ **Instant Verdicts** | `AC` / `WA` / `TLE` / `RTE` / `CE` with per-case execution time |
| 🎯 **Forgiving Output Check** | Token-based comparison ignores extra whitespace; `YES`/`NO` matched case-insensitively |
| ⏱ **Relaxed Time Limit** | Runs are judged against 2.5× the problem's stated limit, so slower local hardware doesn't cause false `TLE`s |
| 🛡 **Runaway Guard** | A 16 MB output cap kills solutions stuck printing in an infinite loop |
| 🛑 **Stop Anytime** | Kill a running solution instantly, including child processes |
| 📤 **Quick Submit** | Copies your code and opens the judge's submit page |
| 🔁 **CPH Compatible** | Problems created by Competitive Programming Helper (`.cph`) are imported automatically |
| 🚦 **ONLINE_JUDGE Toggle** | Compile C/C++ with `-DONLINE_JUDGE` straight from the sidebar |

---

## 🚀 Getting Started

### Install

Open **Extensions** in VS Code, search for **CP Arena**, and click **Install**.

### Requirements

- **VS Code** `1.80.0` or later
- A compiler or interpreter for the language you use, available on your `PATH`
- *(Optional)* The [Competitive Companion](https://github.com/jmerle/competitive-companion) browser extension for importing problems

> **Important:** CP Arena does not bundle any compiler. Before your first run, set the compile/run command for your language to match what's installed on your machine. See [Set up your compiler](#-set-up-your-compiler).

---

## 🔧 Set up your compiler

CP Arena ships with generic defaults, but compiler names and flags vary between machines and operating systems. **Edit the command for your language to match your own setup** before running anything.

Open **Settings → Extensions → CP Arena**, or add the setting directly to your `settings.json`.

### C++

The default is `g++ -O2 -std=c++17`. Change it to whatever your system provides:

```jsonc
{
  // Standard g++ (most Linux distros, MinGW / MSYS2 on Windows)
  "cp-arena.cpp.compileCommand": "g++ -O2 -std=c++17",

  // Homebrew GCC on macOS (version-suffixed binary)
  "cp-arena.cpp.compileCommand": "g++-15 -O2 -std=c++23",

  // Clang
  "cp-arena.cpp.compileCommand": "clang++ -O2 -std=c++17",

  // Codeforces-like build with extra warnings and a larger stack
  "cp-arena.cpp.compileCommand": "g++ -O2 -std=c++20 -Wall -Wextra"
}
```

Anything valid on your command line works here — add sanitizers, change the standard, point at an absolute compiler path, whatever you need. CP Arena appends the source file and output path automatically, so don't include them yourself.

### Other languages

```jsonc
{
  "cp-arena.c.compileCommand": "gcc -std=c17 -O2 -Wall",
  "cp-arena.rust.compileCommand": "rustc -O",
  "cp-arena.java.compileCommand": "javac",
  "cp-arena.java.runCommand": "java",
  "cp-arena.python.runCommand": "python3"   // use "python" on most Windows setups
}
```

### Verifying your compiler

If a run fails with a "command not found" style error, the command isn't on your `PATH`. Check it in a terminal first:

```bash
g++ --version
python3 --version
```

Whatever name works there is the name to put in your settings.

---

## 📖 Usage

### Import a problem

Install **Competitive Companion**, open a problem page, and click the extension's **+** icon. CP Arena creates the source file, saves the sample tests, and opens everything in the sidebar.

### Open a problem locally

Open any supported source file (`.cpp`, `.c`, `.py`, `.java`, `.rs`, `.go`) and the sidebar attaches to it. If no saved problem exists, you get an empty workspace where you can add your own test cases.

### Run

Click **▶ Run All** in the sidebar, or use the **Run Tests** button in the status bar. Your file is saved and compiled first, then each case runs in turn. Cards collapse on `AC` and expand on failure, so only the problems need your attention.

To re-run a single case, click the **▶** on that card.

### Submit

Click the **Submit** icon. CP Arena saves the file, copies your code to the clipboard, and opens the matching Codeforces submit page (contest, gym, group, and problemset URLs are all handled). Paste and submit.

If the problem has no saved URL, you'll be prompted for one.

### `ONLINE_JUDGE` toggle

The **OJ** switch in the bottom bar controls whether `-DONLINE_JUDGE` is passed to the C/C++ compiler, so you can keep local debug output behind an `#ifndef ONLINE_JUDGE` guard without editing code between runs.

---

## ⚙️ Settings

| Setting | Default | Description |
|---|---|---|
| `cp-arena.general.defaultLanguage` | `cpp` | Language used for newly imported problems |
| `cp-arena.general.timeLimit` | `3000` | Time limit recorded on locally created problems (ms) |
| `cp-arena.general.companionPort` | `10043` | Port the Competitive Companion listener binds to |
| `cp-arena.general.savePath` | *(workspace root)* | Where imported problem files are written |
| `cp-arena.cpp.compileCommand` | `g++ -O2 -std=c++17` | C++ compile command |
| `cp-arena.c.compileCommand` | `gcc -std=c17 -O2 -Wall` | C compile command |
| `cp-arena.java.compileCommand` | `javac` | Java compile command |
| `cp-arena.java.runCommand` | `java` | Java run command |
| `cp-arena.rust.compileCommand` | `rustc -O` | Rust compile command |
| `cp-arena.python.runCommand` | `python3` | Python interpreter |

> The sidebar shows the problem's original time limit, but runs are enforced against **2.5× that limit**. Local hardware, cold binary starts and editor overhead rarely match the original grading server, so enforcing the exact limit tends to produce false `TLE`s.

---

## 🛠 Supported Languages

| Language | Mode | Default tool |
|---|---|---|
| **C++** | compiled | `g++` |
| **C** | compiled | `gcc` |
| **Rust** | compiled | `rustc` |
| **Java** | compiled, then run | `javac` + `java` |
| **Python** | interpreted | `python3` |
| **JavaScript** | interpreted | `node` |
| **Go** | compiled and run | `go run` |

---

## 📋 Commands

Available from the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---|---|
| `CP Arena: Run All Test Cases` | Compile and run every test case |
| `CP Arena: Add Test Case` | Append an empty test case |
| `CP Arena: Stop Execution` | Kill the running solution |
| `CP Arena: Clear All Test Cases` | Remove all test cases from the current problem |
| `CP Arena: Submit Code` | Copy code and open the submit page |

---

## 🧠 How Verdicts Work

- **AC** — output matches
- **WA** — tokens differ. Trailing whitespace and newlines are ignored, and `YES`/`NO` compare case-insensitively
- **TLE** — exceeded 2.5× the problem's time limit, or produced more than 16 MB of output
- **RTE** — non-zero exit code or a fatal signal such as `SIGSEGV`
- **CE** — compilation failed; the compiler's output is shown in the sidebar

---

## 🏗 Building from Source

```bash
git clone https://github.com/AashwatJain/cp-arena.git
cd cp-arena
npm install
npm run build        # bundles src/ into dist/ with esbuild
npx vsce package     # produces a .vsix
```

Press **F5** in the project to launch a VS Code window with the extension loaded for debugging.

---

## 📜 License

See [LICENSE.md](LICENSE.md).

---

<p align="center">Made for competitive programmers</p>
