import { FoundationsUploadIcon } from './icons/FoundationsUploadIcon.jsx';
import { UploadCloudIcon } from './icons/UploadCloudIcon.jsx';

export default function App() {
  return (
    <main className="icon-shell">
      <header className="page-header">
        <p className="eyebrow">Design System</p>
        <h1>Menu Item Icons</h1>
      </header>

      <section className="icon-grid" aria-label="Menu item icons">
        <article className="icon-card">
          <div className="icon-preview">
            <UploadCloudIcon size={48} color="#111827" title="Upload Cloud" />
          </div>
          <h2>Upload Cloud</h2>
        </article>

        <article className="icon-card">
          <div className="icon-preview">
            <FoundationsUploadIcon size={48} color="#111827" title="Foundations Upload" />
          </div>
          <h2>Foundations Upload</h2>
        </article>
      </section>
    </main>
  );
}
