import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

export default function PublicFooter() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please complete all contact form fields');
      return;
    }

    toast.success('Message sent. We will contact you soon.');
    setIsContactOpen(false);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <>
      <footer className="public-footer">
        <div className="public-footer-grid">
          <section className="stack-sm">
            <h4 className="icon-label"><i className="fa-solid fa-graduation-cap" aria-hidden="true" /> Study Planner</h4>
            <p className="muted">AI Powered Academic Assistant</p>
            <p className="muted">Version v1.0.0</p>
          </section>

          <section className="stack-sm">
            <h4 className="icon-label"><i className="fa-solid fa-compass" aria-hidden="true" /> Navigation</h4>
            <a href="#">About</a>
            <a href="#">Features</a>
            <button className="public-link-btn" onClick={() => setIsContactOpen(true)}>
              <span className="icon-label"><i className="fa-solid fa-envelope" aria-hidden="true" /> Contact</span>
            </button>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </section>

          <section className="stack-sm">
            <h4 className="icon-label"><i className="fa-solid fa-life-ring" aria-hidden="true" /> Support</h4>
            <a href="#">Help Center</a>
            <a href="#">FAQ</a>
            <a href="mailto:support@studyplanner.app">support@studyplanner.app</a>
          </section>

          <section className="stack-sm">
            <h4 className="icon-label"><i className="fa-solid fa-hashtag" aria-hidden="true" /> Social</h4>
            <div className="row gap-sm">
              <a className="icon-link" href="#" aria-label="GitHub">
                <i className="fa-brands fa-github" aria-hidden="true" />
              </a>
              <a className="icon-link" href="#" aria-label="LinkedIn">
                <i className="fa-brands fa-linkedin" aria-hidden="true" />
              </a>
              <a className="icon-link" href="#" aria-label="Twitter">
                <i className="fa-brands fa-x-twitter" aria-hidden="true" />
              </a>
            </div>
          </section>
        </div>

        <p className="muted public-footer-copy">(c) 2026 Study Planner. All rights reserved.</p>
      </footer>

      <Modal isOpen={isContactOpen} title="Contact Support" onClose={() => setIsContactOpen(false)}>
        <form className="stack" onSubmit={onSubmit}>
          <label>
            Full Name
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </label>
          <label>
            Email
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label>
            Message
            <textarea
              className="input textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help?"
            />
          </label>
          <div className="row gap-sm">
            <Button type="submit">
              <span className="icon-label"><i className="fa-solid fa-paper-plane" aria-hidden="true" /> Send Message</span>
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsContactOpen(false)}>
              <span className="icon-label"><i className="fa-solid fa-xmark" aria-hidden="true" /> Cancel</span>
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
