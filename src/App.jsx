import { UploadCloudIcon } from './icons';
import './App.css';

const workflowSteps = [
  'Design asset update in Figma',
  'Manual trigger in GitHub Actions',
  'Generate React icon and Storybook story',
  'Engineering review before merge',
  'UX/Product review in Storybook',
  'Release approval',
];

const gates = [
  {
    title: 'Gate 1: Engineering review',
    text: 'Developer validates naming, build quality, and code standards before merge.',
  },
  {
    title: 'Gate 2: UX review',
    text: 'UI/UX team checks the live Storybook output for visual fidelity and approval.',
  },
];

function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Design to code</p>
          <h1>Design System Sync Workflow</h1>
          <p className="lede">
            UI/UX updates are converted into code, validated, reviewed, and published to
            Storybook with explicit approval gates.
          </p>
        </div>
        <div className="icon-stage">
          <UploadCloudIcon size={72} color="#1f2937" title="Upload cloud icon" />
        </div>
      </section>

      <section className="panel">
        <h2>Workflow</h2>
        <ol className="step-list">
          {workflowSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="gates-grid">
        {gates.map((gate) => (
          <article key={gate.title} className="panel gate-card">
            <h3>{gate.title}</h3>
            <p>{gate.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
