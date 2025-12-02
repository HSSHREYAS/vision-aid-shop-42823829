import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Volume2,
  Eye,
  Zap,
  Type,
  Shield,
  Play,
  ArrowLeft,
  Keyboard,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Settings = () => {
  const { state, dispatch, speak } = useApp();
  const { settings } = state;
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const updateSetting = (key: string, value: boolean | number | string) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
  };

  const testVoice = () => {
    speak('This is a test of the text to speech system. Adjust the settings to your preference.');
  };

  return (
    <main className="container mx-auto animate-fade-in px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Link
          to="/"
          className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Scanner
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-wide text-foreground md:text-4xl">
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Customize your accessibility and display preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Voice Settings */}
        <section className="glass-panel p-6" aria-labelledby="voice-settings">
          <h2 id="voice-settings" className="mb-6 flex items-center gap-3 font-display text-xl font-semibold text-foreground">
            <Volume2 className="h-6 w-6 text-primary" />
            Voice Settings
          </h2>

          <div className="space-y-6">
            {/* Enable Voice */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="voice-enabled" className="text-base font-medium">
                  Enable Voice
                </Label>
                <p className="text-sm text-muted-foreground">
                  Read product info and notifications aloud
                </p>
              </div>
              <Switch
                id="voice-enabled"
                checked={settings.voiceEnabled}
                onCheckedChange={(checked) => updateSetting('voiceEnabled', checked)}
              />
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label htmlFor="voice-select">Voice</Label>
              <Select
                value={settings.voiceId}
                onValueChange={(value) => updateSetting('voiceId', value)}
                disabled={!settings.voiceEnabled}
              >
                <SelectTrigger id="voice-select" className="w-full">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speech Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Speech Rate</Label>
                <span className="text-sm text-muted-foreground">{settings.speechRate}x</span>
              </div>
              <Slider
                value={[settings.speechRate]}
                onValueChange={([value]) => updateSetting('speechRate', value)}
                min={0.5}
                max={2}
                step={0.1}
                disabled={!settings.voiceEnabled}
                aria-label="Speech rate"
              />
            </div>

            {/* Speech Pitch */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pitch</Label>
                <span className="text-sm text-muted-foreground">{settings.speechPitch}</span>
              </div>
              <Slider
                value={[settings.speechPitch]}
                onValueChange={([value]) => updateSetting('speechPitch', value)}
                min={0.5}
                max={2}
                step={0.1}
                disabled={!settings.voiceEnabled}
                aria-label="Speech pitch"
              />
            </div>

            {/* Test Voice */}
            <Button
              variant="outline"
              onClick={testVoice}
              disabled={!settings.voiceEnabled}
              className="w-full"
            >
              <Play className="mr-2 h-4 w-4" />
              Test Voice
            </Button>
          </div>
        </section>

        {/* Display Settings */}
        <section className="glass-panel p-6" aria-labelledby="display-settings">
          <h2 id="display-settings" className="mb-6 flex items-center gap-3 font-display text-xl font-semibold text-foreground">
            <Eye className="h-6 w-6 text-secondary" />
            Display Settings
          </h2>

          <div className="space-y-6">
            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="high-contrast" className="text-base font-medium">
                  High Contrast
                </Label>
                <p className="text-sm text-muted-foreground">
                  Increase color contrast for better visibility
                </p>
              </div>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={(checked) => {
                  updateSetting('highContrast', checked);
                  document.documentElement.classList.toggle('high-contrast', checked);
                }}
              />
            </div>

            {/* Large Text */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="large-text" className="text-base font-medium flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Large Text
                </Label>
                <p className="text-sm text-muted-foreground">
                  Increase text size throughout the app
                </p>
              </div>
              <Switch
                id="large-text"
                checked={settings.largeText}
                onCheckedChange={(checked) => updateSetting('largeText', checked)}
              />
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reduced-motion" className="text-base font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Reduced Motion
                </Label>
                <p className="text-sm text-muted-foreground">
                  Minimize animations and transitions
                </p>
              </div>
              <Switch
                id="reduced-motion"
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
              />
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className="glass-panel p-6" aria-labelledby="keyboard-shortcuts">
          <h2 id="keyboard-shortcuts" className="mb-6 flex items-center gap-3 font-display text-xl font-semibold text-foreground">
            <Keyboard className="h-6 w-6 text-neon-cyan" />
            Keyboard Shortcuts
          </h2>

          <div className="space-y-3">
            {[
              { action: 'Start/Stop Camera', shortcut: 'Ctrl+Shift+C' },
              { action: 'Capture Snapshot', shortcut: 'Space' },
              { action: 'Toggle Live Detection', shortcut: 'Ctrl+M' },
              { action: 'Switch Camera', shortcut: 'Ctrl+K' },
              { action: 'Add to Cart', shortcut: 'A' },
              { action: 'Undo', shortcut: 'U' },
              { action: 'Open Settings', shortcut: 'Ctrl+,' },
              { action: 'Help', shortcut: '?' },
            ].map(({ action, shortcut }) => (
              <div key={action} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-foreground">{action}</span>
                <kbd className="rounded bg-card px-3 py-1 font-mono text-sm text-primary shadow-neumorphic">
                  {shortcut}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="glass-panel p-6" aria-labelledby="privacy-settings">
          <h2 id="privacy-settings" className="mb-6 flex items-center gap-3 font-display text-xl font-semibold text-foreground">
            <Shield className="h-6 w-6 text-success" />
            Privacy
          </h2>

          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-4">
              <h3 className="mb-2 font-medium text-foreground">Data Processing</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Camera frames processed locally for detection</li>
                <li>• OCR text used only for product lookup</li>
                <li>• Cart data stored locally on your device</li>
                <li>• No personal data shared with third parties</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                Download My Data
              </Button>
              <Button variant="outline" className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10">
                Delete My Data
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Settings;
