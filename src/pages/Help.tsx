import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Camera,
  Volume2,
  ShoppingCart,
  Settings,
  HelpCircle,
  ArrowLeft,
  Play,
  Mic,
  Hand,
  Keyboard,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Help = () => {
  const { speak } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: 'Start the Camera',
      description: 'Press the "Start Camera" button or use Ctrl+Shift+C to activate your device camera. Allow camera permissions when prompted.',
      icon: Camera,
    },
    {
      title: 'Point at Products',
      description: 'Hold your device steady and point the camera at a product. The AI will automatically detect and identify items in view.',
      icon: Hand,
    },
    {
      title: 'Listen to Details',
      description: 'When a product is detected, you\'ll hear its name announced. Press Enter or tap the detection box to hear full details.',
      icon: Volume2,
    },
    {
      title: 'Select Variant & Add to Cart',
      description: 'Choose your preferred size/variant, adjust quantity, then press "A" or tap "Add to Cart" to add the item.',
      icon: ShoppingCart,
    },
    {
      title: 'Use Voice Commands',
      description: 'Say "capture" to take a photo, "add" to add to cart, "cart" to hear cart summary, or "help" for assistance.',
      icon: Mic,
    },
  ];

  const handlePlayTutorial = () => {
    const step = tutorialSteps[currentStep];
    speak(`Step ${currentStep + 1}: ${step.title}. ${step.description}`);
  };

  const handlePlayAll = () => {
    const fullTutorial = tutorialSteps
      .map((step, i) => `Step ${i + 1}: ${step.title}. ${step.description}`)
      .join('. Next step. ');
    speak(`Welcome to the SmartShop tutorial. ${fullTutorial}. Tutorial complete.`);
  };

  const faqs = [
    {
      question: 'How does the AI detect products?',
      answer: 'The app uses advanced computer vision (YOLOv8) to identify products in your camera view. It analyzes the image and matches detected items against a product database.',
    },
    {
      question: 'What if the camera doesn\'t recognize a product?',
      answer: 'Try moving closer to the product, ensuring good lighting, or pressing the Capture button for a clearer snapshot. You can also try uploading an image.',
    },
    {
      question: 'How do I use voice commands?',
      answer: 'Tap the microphone button in the navigation bar. Then speak commands like "capture", "add", "cart", "details", or "help".',
    },
    {
      question: 'Is my camera data stored?',
      answer: 'No. Camera frames are processed in real-time and are not stored. Only your cart data is saved locally on your device.',
    },
    {
      question: 'Can I use this app offline?',
      answer: 'Limited functionality is available offline. Your cart is stored locally and will sync when you reconnect to the internet.',
    },
    {
      question: 'How do I adjust the voice speed?',
      answer: 'Go to Settings (Ctrl+,) and adjust the Speech Rate slider under Voice Settings.',
    },
  ];

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
          Help & <span className="gradient-text">Tutorial</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Learn how to use SmartShop with voice-first guidance
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Interactive Tutorial */}
        <section className="glass-panel p-6" aria-labelledby="tutorial-heading">
          <div className="mb-6 flex items-center justify-between">
            <h2 id="tutorial-heading" className="flex items-center gap-3 font-display text-xl font-semibold text-foreground">
              <HelpCircle className="h-6 w-6 text-primary" />
              Getting Started Tutorial
            </h2>
            <Button variant="neon" size="sm" onClick={handlePlayAll}>
              <Play className="mr-2 h-4 w-4" />
              Play All
            </Button>
          </div>

          <div className="space-y-4">
            {tutorialSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;

              return (
                <div
                  key={index}
                  className={`
                    group relative flex cursor-pointer gap-4 rounded-xl border-2 p-4 transition-all duration-200
                    ${isActive
                      ? 'border-primary bg-primary/10 shadow-glow-cyan'
                      : 'border-border/50 bg-card hover:border-primary/30'
                    }
                  `}
                  onClick={() => setCurrentStep(index)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  onKeyDown={(e) => e.key === 'Enter' && setCurrentStep(index)}
                >
                  {/* Step number */}
                  <div
                    className={`
                      flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-bold
                      ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                    `}
                  >
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <h3 className="font-semibold text-foreground">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>

                  {/* Play button */}
                  {isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTutorial();
                      }}
                      aria-label={`Play step ${index + 1}`}
                    >
                      <Volume2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              variant="default"
              onClick={() => setCurrentStep(Math.min(tutorialSteps.length - 1, currentStep + 1))}
              disabled={currentStep === tutorialSteps.length - 1}
            >
              Next
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="glass-panel p-6" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="mb-6 flex items-center gap-3 font-display text-xl font-semibold text-foreground">
            <HelpCircle className="h-6 w-6 text-secondary" />
            Frequently Asked Questions
          </h2>

          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="rounded-xl border border-border/50 bg-card/50 px-4"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-medium text-foreground">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Quick Reference */}
        <section className="glass-panel p-6 lg:col-span-2" aria-labelledby="reference-heading">
          <h2 id="reference-heading" className="mb-6 flex items-center gap-3 font-display text-xl font-semibold text-foreground">
            <Keyboard className="h-6 w-6 text-neon-cyan" />
            Quick Reference
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Voice Commands */}
            <div className="rounded-xl bg-muted/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <Mic className="h-4 w-4 text-primary" />
                Voice Commands
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>"Capture" - Take photo</li>
                <li>"Add" - Add to cart</li>
                <li>"Details" - Hear info</li>
                <li>"Cart" - Cart summary</li>
                <li>"Help" - Get help</li>
              </ul>
            </div>

            {/* Gestures */}
            <div className="rounded-xl bg-muted/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <Hand className="h-4 w-4 text-secondary" />
                Touch Gestures
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Tap - Select item</li>
                <li>Long press - Read aloud</li>
                <li>Double tap - Capture</li>
                <li>Swipe - Navigate</li>
              </ul>
            </div>

            {/* Keyboard */}
            <div className="rounded-xl bg-muted/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <Keyboard className="h-4 w-4 text-neon-cyan" />
                Keyboard
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Tab - Navigate</li>
                <li>Enter/Space - Select</li>
                <li>Escape - Close modal</li>
                <li>? - Open help</li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="rounded-xl bg-muted/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <Settings className="h-4 w-4 text-success" />
                Quick Actions
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Ctrl+H - Home</li>
                <li>Ctrl+, - Settings</li>
                <li>Ctrl+Shift+C - Camera</li>
                <li>A - Add to cart</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Contact Support */}
      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          Need more help?{' '}
          <Button variant="link" className="h-auto p-0">
            Contact Support
          </Button>
        </p>
      </div>
    </main>
  );
};

export default Help;
