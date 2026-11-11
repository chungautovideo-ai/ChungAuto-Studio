// ContentOS.exe: starts the local server through installer/start.ps1 (same checks as Mo-ContentOS.bat)
// and opens the home page in its own app window. Build: installer/build-exe.ps1
using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

static class ContentOSLauncher
{
    const string Url = "http://127.0.0.1:5180/home";

    [STAThread]
    static int Main()
    {
        string root = Path.GetDirectoryName(Application.ExecutablePath);
        string script = Path.Combine(root, "installer", "start.ps1");
        if (!File.Exists(script))
        {
            MessageBox.Show("Không tìm thấy installer\\start.ps1. Đặt ContentOS.exe trong thư mục gốc của ContentOS.", "ContentOS", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }

        // No output redirection: the node server started by start.ps1 would inherit the pipe and the read would never end.
        var start = new ProcessStartInfo("powershell.exe", "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"" + script + "\"")
        {
            WorkingDirectory = root, UseShellExecute = false, CreateNoWindow = true
        };
        int code;
        using (var process = Process.Start(start))
        {
            process.WaitForExit();
            code = process.ExitCode;
        }
        if (code != 0)
        {
            string log = Path.Combine(root, "workspace", "logs", "server.err.log"), tail = "";
            try { string text = File.ReadAllText(log); tail = text.Length > 1500 ? text.Substring(text.Length - 1500) : text; } catch (IOException) { }
            MessageBox.Show("Chưa mở được ContentOS (cổng 5180 bận hoặc server lỗi).\n\n" + tail.Trim() + "\n\nXem workspace\\logs\\server.err.log.", "ContentOS", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return code;
        }

        // Chrome first (user's choice), Edge as fallback, then the default browser.
        string browser = FindBrowser(@"Google\Chrome\Application\chrome.exe") ?? FindBrowser(@"Microsoft\Edge\Application\msedge.exe");
        if (browser != null)
        {
            string profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ContentOS", "app-window");
            Process.Start(new ProcessStartInfo(browser, "--app=" + Url + " --user-data-dir=\"" + profile + "\" --window-size=1440,900 --no-first-run --no-default-browser-check") { UseShellExecute = false });
        }
        else Process.Start(new ProcessStartInfo(Url) { UseShellExecute = true });
        return 0;
    }

    static string FindBrowser(string relative)
    {
        foreach (var dir in new[] { Environment.SpecialFolder.ProgramFiles, Environment.SpecialFolder.ProgramFilesX86, Environment.SpecialFolder.LocalApplicationData })
        {
            string path = Path.Combine(Environment.GetFolderPath(dir), relative);
            if (File.Exists(path)) return path;
        }
        return null;
    }
}
