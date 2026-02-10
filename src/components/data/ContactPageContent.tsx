import { useState } from 'react';

const CONTACT_EMAIL = 'emailofimran1992@gmail.com';
const PHONE_1 = '01622364274';
const PHONE_2 = '01340966449';
// WhatsApp: use 880 prefix for Bangladesh (drop leading 0)
const WA_1 = '8801622364274';
const WA_2 = '8801340966449';

export default function ContactPageContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = [
      `Name: ${name || '(not provided)'}`,
      `Email: ${email || '(not provided)'}`,
      '',
      message || '(no message)',
    ].join('\n');
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject || 'Contact from OPAL')}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <section className="py-5 py-lg-7">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5 mb-lg-6">
          <p className="text-uppercase small text-secondary mb-2 fw-semibold" style={{ letterSpacing: '0.12em' }}>
            Get in touch
          </p>
          <h1 className="display-6 fw-bold mb-3">Contact us</h1>
          <p className="text-body-secondary mx-auto" style={{ maxWidth: '32rem' }}>
            Have a question or need help? We’re here for you. Send a message and we’ll get back to you as soon as we can.
          </p>
        </div>

        <div className="row g-4 g-lg-5 justify-content-center">
          {/* Left: contact info cards */}
          <div className="col-12 col-lg-4 order-lg-1 order-2">
            <div className="d-flex flex-column gap-3 h-100">
              <div
                className="rounded-4 p-4 h-100 border border-0 shadow-sm"
                style={{ background: 'linear-gradient(145deg, #f8f9fa 0%, #f1f3f5 100%)' }}
              >
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center mb-3"
                  style={{ width: 48, height: 48, background: 'rgba(0,0,0,0.06)' }}
                >
                  <i className="bi bi-envelope fs-5 text-dark" aria-hidden="true" />
                </div>
                <h6 className="fw-semibold mb-2">Email</h6>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-body text-decoration-none link-dark link-underline-opacity-0 link-underline-opacity-100-hover"
                >
                  {CONTACT_EMAIL}
                </a>
                <p className="small text-body-secondary mt-2 mb-0">We typically reply within 24 hours.</p>
              </div>
              <div
                className="rounded-4 p-4 h-100 border border-0 shadow-sm"
                style={{ background: 'linear-gradient(145deg, #f8f9fa 0%, #f1f3f5 100%)' }}
              >
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center mb-3"
                  style={{ width: 48, height: 48, background: 'rgba(0,0,0,0.06)' }}
                >
                  <i className="bi bi-clock fs-5 text-dark" aria-hidden="true" />
                </div>
                <h6 className="fw-semibold mb-2">Response time</h6>
                <p className="small text-body-secondary mb-0">Mon–Fri, 9am–6pm. Orders: track via the link in the footer.</p>
              </div>
              <div
                className="rounded-4 p-4 h-100 border border-0 shadow-sm"
                style={{ background: 'linear-gradient(145deg, #f8f9fa 0%, #f1f3f5 100%)' }}
              >
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center mb-3"
                  style={{ width: 48, height: 48, background: 'rgba(0,0,0,0.06)' }}
                >
                  <i className="bi bi-telephone fs-5 text-dark" aria-hidden="true" />
                </div>
                <h6 className="fw-semibold mb-2">WhatsApp or direct call</h6>

                <div className="d-flex flex-column gap-2">
                  <a
                    href={`https://wa.me/${WA_1}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body text-decoration-none link-dark link-underline-opacity-0 link-underline-opacity-100-hover d-flex align-items-center gap-2 small"
                  >
                    <i className="bi bi-whatsapp text-success" aria-hidden="true" />
                    {PHONE_1}
                  </a>
                  <a
                    href={`https://wa.me/${WA_2}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body text-decoration-none link-dark link-underline-opacity-0 link-underline-opacity-100-hover d-flex align-items-center gap-2 small"
                  >
                    <i className="bi bi-whatsapp text-success" aria-hidden="true" />
                    {PHONE_2}
                  </a>
                  <a href={`tel:${PHONE_1}`} className="small text-body-secondary text-decoration-none d-flex align-items-center gap-2">
                    <i className="bi bi-telephone-outbound" aria-hidden="true" />
                    Call {PHONE_1}
                  </a>
                  <a href={`tel:${PHONE_2}`} className="small text-body-secondary text-decoration-none d-flex align-items-center gap-2">
                    <i className="bi bi-telephone-outbound" aria-hidden="true" />
                    Call {PHONE_2}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="col-12 col-lg-6 col-xl-5 order-lg-2 order-1">
            <div
              className="rounded-4 p-4 p-lg-5 border border-0 shadow-sm"
              style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12 col-sm-6">
                  <label htmlFor="contact-name" className="form-label small fw-medium text-body-secondary">
                    Name
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    className="form-control form-control-lg rounded-3 border border-secondary border-opacity-25"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      padding: '0.65rem 1rem',
                    }}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label htmlFor="contact-email" className="form-label small fw-medium text-body-secondary">
                    Email
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    className="form-control form-control-lg rounded-3 border border-secondary border-opacity-25"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ padding: '0.65rem 1rem' }}
                  />
                </div>
                <div className="col-12">
                  <label htmlFor="contact-subject" className="form-label small fw-medium text-body-secondary">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="contact-subject"
                    className="form-control form-control-lg rounded-3 border border-secondary border-opacity-25"
                    placeholder="How can we help?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{ padding: '0.65rem 1rem' }}
                  />
                </div>
                <div className="col-12">
                  <label htmlFor="contact-message" className="form-label small fw-medium text-body-secondary">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    className="form-control rounded-3 border border-secondary border-opacity-25"
                    placeholder="Your message..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      resize: 'none',
                      minHeight: '120px',
                    }}
                  />
                </div>
                <div className="col-12 pt-2">
                  <button
                    type="submit"
                    className="btn btn-dark btn-lg rounded-pill px-4 w-100 w-sm-auto"
                  >
                    Send message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
