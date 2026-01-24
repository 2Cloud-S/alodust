import { useState } from "react";
import { Card } from "../Card";
import { Button } from "../Button";
import "./ObsSetupGuide.css";

interface ObsSetupGuideProps {
  serverUrl: string;
  streamKey: string;
}

export function ObsSetupGuide({ serverUrl, streamKey }: ObsSetupGuideProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Card glowColor="magenta" className="obs-setup-guide">
      <div className="guide-header">
        <h3>OBS Studio Setup Guide</h3>
        <p>Configure your OBS Studio to stream non-gaming content</p>
      </div>

      <div className="guide-steps">
        {/* Step 1: Download OBS */}
        <div className="setup-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Download OBS Studio</h4>
            <p>If you don't have OBS Studio installed:</p>
            <Button
              onClick={() => window.open("https://obsproject.com/download", "_blank")}
              variant="ghost"
            >
              Download OBS Studio
            </Button>
          </div>
        </div>

        {/* Step 2: Configure RTMP Output */}
        <div className="setup-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Configure Streaming Settings</h4>
            <p>In OBS Studio, go to: <strong>Settings → Stream</strong></p>

            <div className="config-field">
              <label>Service</label>
              <div className="field-value">
                <code>Custom</code>
              </div>
            </div>

            <div className="config-field">
              <label>Server</label>
              <div className="field-value">
                <code>{serverUrl}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(serverUrl, "server")}
                >
                  {copiedField === "server" ? "✓ Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="config-field">
              <label>Stream Key</label>
              <div className="field-value">
                <code>{streamKey}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(streamKey, "key")}
                >
                  {copiedField === "key" ? "✓ Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Configure Output Settings */}
        <div className="setup-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Output Settings (Recommended)</h4>
            <p>Go to: <strong>Settings → Output</strong></p>

            <div className="config-field">
              <label>Output Mode</label>
              <div className="field-value">
                <code>Advanced</code>
              </div>
            </div>

            <div className="config-field">
              <label>Encoder</label>
              <div className="field-value">
                <code>x264 (or Hardware if available)</code>
              </div>
            </div>

            <div className="config-field">
              <label>Bitrate</label>
              <div className="field-value">
                <code>5000-8000 Kbps</code>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Add Sources */}
        <div className="setup-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h4>Add Your Content</h4>
            <p>Add sources to your OBS scene:</p>
            <ul>
              <li><strong>Display Capture</strong> - Share your entire screen</li>
              <li><strong>Window Capture</strong> - Share a specific window</li>
              <li><strong>Browser Source</strong> - Embed web pages</li>
              <li><strong>Media Source</strong> - Play video files</li>
            </ul>
          </div>
        </div>

        {/* Step 5: Start Streaming */}
        <div className="setup-step">
          <div className="step-number">5</div>
          <div className="step-content">
            <h4>Start Streaming</h4>
            <p>Click <strong>"Start Streaming"</strong> in OBS Studio</p>
            <div className="warning-box">
              ⚠️ Make sure Tailscale is connected before starting the stream
            </div>
          </div>
        </div>
      </div>

      <div className="guide-footer">
        <Button
          onClick={() => window.open("https://obsproject.com/wiki/", "_blank")}
          variant="ghost"
        >
          OBS Documentation
        </Button>
      </div>
    </Card>
  );
}
