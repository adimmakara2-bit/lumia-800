import { GoogleGenAI } from "@google/genai";
import { motion } from "motion/react";
import { AlertCircle, Bot, Code2, Cpu, Globe, Smartphone, Terminal } from "lucide-react";
import { useState } from "react";
import { CodeSnippet } from "./components/CodeSnippet";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { ScrollArea } from "./components/ui/scroll-area";
import { Separator } from "./components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

const PYTHON_PROXY_CODE = `import os
from flask import Flask, request, jsonify
import google.generativeai as genai

app = Flask(__name__)

# Configure Gemini API
# Replace 'YOUR_API_KEY' with your actual key or set GEMINI_API_KEY env var
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "YOUR_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        
        if not prompt:
            return "Error: No prompt provided", 400
            
        response = model.generate_content(prompt)
        # Return plain text for simplicity on WP7
        return response.text
    except Exception as e:
        return f"Error: {str(e)}", 500

if __name__ == '__main__':
    # Run on all interfaces so the phone can connect
    # Make sure your PC and Phone are on the same Wi-Fi
    app.run(host='0.0.0.0', port=5000)`;

const CS_CODE = `using System;
using System.Net;
using System.Windows;
using Microsoft.Phone.Controls;

namespace LumiaGemini
{
    public partial class MainPage : PhoneApplicationPage
    {
        // Replace with your PC's local IP address (e.g., 192.168.1.5)
        private const string ProxyUrl = "http://192.168.1.5:5000/chat";

        public MainPage()
        {
            InitializeComponent();
        }

        private void SendButton_Click(object sender, RoutedEventArgs e)
        {
            string prompt = InputBox.Text;
            if (string.IsNullOrWhiteSpace(prompt)) return;

            // Clear input and show status
            InputBox.Text = "";
            ChatLog.Text += "\\nYou: " + prompt + "\\n...";

            WebClient client = new WebClient();
            client.Headers["Content-Type"] = "application/json";
            
            // WP7.8 WebClient doesn't have UploadStringTaskAsync
            // We use the older event-based pattern
            client.UploadStringCompleted += (s, args) =>
            {
                Deployment.Current.Dispatcher.BeginInvoke(() =>
                {
                    if (args.Error == null)
                    {
                        ChatLog.Text = ChatLog.Text.TrimEnd('.') + "\\nGemini: " + args.Result + "\\n";
                    }
                    else
                    {
                        ChatLog.Text += "\\nError: " + args.Error.Message + "\\n";
                    }
                });
            };

            // Simple JSON string construction to avoid extra libraries for now
            string json = "{\\"prompt\\":\\"" + prompt.Replace("\\"", "\\\\\\"") + "\\"}";
            client.UploadStringAsync(new Uri(ProxyUrl), "POST", json);
        }
    }
}`;

const XAML_CODE = `<phone:PhoneApplicationPage
    x:Class="LumiaGemini.MainPage"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:phone="clr-namespace:Microsoft.Phone.Controls;assembly=Microsoft.Phone"
    xmlns:shell="clr-namespace:Microsoft.Phone.Shell;assembly=Microsoft.Phone"
    FontFamily="{StaticResource PhoneFontFamilyNormal}"
    FontSize="{StaticResource PhoneFontSizeNormal}"
    Foreground="{StaticResource PhoneForegroundBrush}"
    SupportedOrientations="Portrait" Orientation="Portrait">

    <Grid x:Name="LayoutRoot" Background="Transparent">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <StackPanel x:Name="TitlePanel" Grid.Row="0" Margin="12,17,0,28">
            <TextBlock Text="LUMIA GEMINI" Style="{StaticResource PhoneTextNormalStyle}"/>
            <TextBlock Text="chat" Margin="9,-7,0,0" Style="{StaticResource PhoneTextTitle1Style}"/>
        </StackPanel>

        <ScrollViewer Grid.Row="1" Margin="12,0,12,0">
            <TextBlock x:Name="ChatLog" TextWrapping="Wrap" FontSize="22" />
        </ScrollViewer>

        <Grid Grid.Row="2" Margin="12,10,12,10">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="Auto"/>
            </Grid.ColumnDefinitions>
            <TextBox x:Name="InputBox" Grid.Column="0" />
            <Button x:Name="SendButton" Grid.Column="1" Content="Send" Click="SendButton_Click" />
        </Grid>
    </Grid>
</phone:PhoneApplicationPage>`;

export default function App() {
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const testGemini = async () => {
    if (!testInput) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: testInput,
      });
      setTestOutput(response.text || "No response");
    } catch (error) {
      setTestOutput("Error: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
              <Smartphone className="text-zinc-950 h-5 w-5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">Lumia Gemini Companion</h1>
          </div>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-mono">
            WP7.8 Bridge
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <section className="mb-16">
            <h2 className="text-4xl font-bold tracking-tighter mb-4">Bring AI to your Lumia 800</h2>
            <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
              Windows Phone 7.8 is a beautiful piece of history, but its lack of TLS 1.2 support makes modern API calls difficult. 
              This guide provides a bridge to connect your legacy device to the power of Gemini.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                  <Terminal className="text-zinc-100 h-5 w-5" />
                </div>
                <CardTitle>1. The Proxy</CardTitle>
                <CardDescription>Python Flask server on your PC</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-zinc-400">
                Acts as a TLS bridge. Your phone talks HTTP to your PC, and your PC talks HTTPS to Google.
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                  <Code2 className="text-zinc-100 h-5 w-5" />
                </div>
                <CardTitle>2. The App</CardTitle>
                <CardDescription>C# Silverlight for WP7.1</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-zinc-400">
                A simple chat interface using the classic Metro UI design language.
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                  <Globe className="text-zinc-100 h-5 w-5" />
                </div>
                <CardTitle>3. The Connection</CardTitle>
                <CardDescription>Local Network (Wi-Fi)</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-zinc-400">
                Both devices must be on the same network for the phone to reach the proxy IP.
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="proxy" className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-8">
              <TabsTrigger value="proxy" className="data-[state=active]:bg-zinc-800">Python Proxy</TabsTrigger>
              <TabsTrigger value="xaml" className="data-[state=active]:bg-zinc-800">XAML Design</TabsTrigger>
              <TabsTrigger value="csharp" className="data-[state=active]:bg-zinc-800">C# Logic</TabsTrigger>
              <TabsTrigger value="test" className="data-[state=active]:bg-zinc-800">Test Gemini</TabsTrigger>
            </TabsList>

            <TabsContent value="proxy" className="space-y-6">
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Terminal className="h-5 w-5" /> Setup Python Proxy
                </h3>
                <ol className="list-decimal list-inside space-y-3 text-zinc-400 text-sm mb-6">
                  <li>Install Python on your PC.</li>
                  <li>Run <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200">pip install flask google-generativeai</code></li>
                  <li>Save the code below as <code className="text-zinc-200">proxy.py</code></li>
                  <li>Set your API key as an environment variable or paste it in the code.</li>
                  <li>Run it with <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200">python proxy.py</code></li>
                </ol>
                <CodeSnippet code={PYTHON_PROXY_CODE} language="python" title="proxy.py" />
              </div>
            </TabsContent>

            <TabsContent value="xaml">
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" /> Metro UI Design
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Paste this into your <code className="text-zinc-200">MainPage.xaml</code> in Visual Studio 2010.
                </p>
                <CodeSnippet code={XAML_CODE} language="xml" title="MainPage.xaml" />
              </div>
            </TabsContent>

            <TabsContent value="csharp">
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Code2 className="h-5 w-5" /> Silverlight Logic
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Paste this into your <code className="text-zinc-200">MainPage.xaml.cs</code>. 
                  Don't forget to update the <code className="text-zinc-200">ProxyUrl</code> with your PC's IP!
                </p>
                <CodeSnippet code={CS_CODE} language="csharp" title="MainPage.xaml.cs" />
              </div>
            </TabsContent>

            <TabsContent value="test">
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Bot className="h-5 w-5" /> Test Gemini API
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Before setting up your Lumia, verify that your Gemini API key is working correctly here.
                </p>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
                      placeholder="Ask Gemini something..."
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && testGemini()}
                    />
                    <Button onClick={testGemini} disabled={loading}>
                      {loading ? "Thinking..." : "Send"}
                    </Button>
                  </div>
                  {testOutput && (
                    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-2 uppercase font-bold tracking-widest">Response</p>
                      <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{testOutput}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <section className="mt-24 border-t border-zinc-800 pt-12">
            <div className="flex items-start gap-4 p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
              <AlertCircle className="text-zinc-500 h-6 w-6 shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Technical Note on TLS</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Windows Phone 7.8 (Silverlight) uses an older network stack that does not support the modern TLS 1.2/1.3 protocols required by Google's APIs. 
                  The Python proxy acts as a "Man-in-the-Middle" on your local network, accepting unencrypted (or older TLS) HTTP requests from the phone 
                  and forwarding them securely to Gemini. This is the most reliable way to keep these devices connected in 2026.
                </p>
              </div>
            </div>
          </section>
        </motion.div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-zinc-900 text-center">
        <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium">
          Lumia Gemini Companion • Built for the legacy community
        </p>
      </footer>
    </div>
  );
}
