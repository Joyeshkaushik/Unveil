import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#07090f;--text:#f8faff;--text2:rgba(248,250,255,0.5);--text3:rgba(248,250,255,0.25);
  --border:rgba(255,255,255,0.07);--glass:rgba(255,255,255,0.04);--glass2:rgba(255,255,255,0.07);
}
html,body,#root{min-height:100%;}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;}

.pr-bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
.pr-orb{position:absolute;border-radius:50%;filter:blur(90px);}
.pr-o1{width:600px;height:600px;top:-200px;left:-150px;opacity:.5;
  background:radial-gradient(circle,rgba(59,130,246,0.2) 0%,rgba(99,102,241,0.12) 40%,transparent 70%);}
.pr-o2{width:450px;height:450px;bottom:-150px;right:-100px;opacity:.4;
  background:radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%);}
.pr-grid{position:absolute;inset:0;
  background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);
  background-size:28px 28px;
  mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%);}

.pr-nav{position:sticky;top:0;z-index:100;padding:0 40px;height:60px;
  display:flex;justify-content:space-between;align-items:center;
  background:rgba(7,9,15,0.8);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);}
.pr-logo{font-size:18px;font-weight:900;letter-spacing:3px;cursor:pointer;
  background:linear-gradient(135deg,#f8faff 30%,#93c5fd 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.pr-back{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:100px;
  background:var(--glass);border:1px solid var(--border);color:var(--text2);font-size:13px;font-weight:600;
  font-family:'Outfit',sans-serif;cursor:pointer;transition:all 0.2s;}
.pr-back:hover{background:var(--glass2);color:var(--text);}

.pr-wrap{position:relative;z-index:1;max-width:1000px;margin:0 auto;padding:60px 24px 80px;}
.pr-title{text-align:center;font-size:42px;font-weight:900;letter-spacing:-1.5px;margin-bottom:12px;}
.pr-title span{background:linear-gradient(135deg,#60a5fa,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.pr-sub{text-align:center;font-size:16px;color:var(--text2);max-width:480px;margin:0 auto 20px;}

.pr-toggle{display:flex;justify-content:center;margin-bottom:48px;}
.pr-toggle-inner{display:flex;gap:4px;padding:4px;border-radius:100px;
  background:rgba(255,255,255,0.03);border:1px solid var(--border);}
.pr-toggle-btn{padding:10px 24px;border-radius:100px;font-size:14px;font-weight:600;
  cursor:pointer;border:none;transition:all 0.2s;font-family:'Outfit',sans-serif;
  background:transparent;color:var(--text2);}
.pr-toggle-btn.active{background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;
  box-shadow:0 0 16px rgba(59,130,246,0.35);}
.pr-toggle-btn:hover:not(.active){color:var(--text);background:var(--glass);}
.pr-save{margin-left:8px;padding:2px 10px;border-radius:100px;font-size:11px;font-weight:700;
  background:rgba(34,197,94,0.15);color:#86efac;border:1px solid rgba(34,197,94,0.25);}

.pr-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;}
.pr-card{padding:32px;border-radius:24px;position:relative;overflow:hidden;
  background:linear-gradient(145deg,rgba(255,255,255,0.05),rgba(59,130,246,0.02));
  border:1px solid var(--border);backdrop-filter:blur(20px);transition:all 0.25s;
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.07);}
.pr-card:hover{transform:translateY(-4px);border-color:rgba(59,130,246,0.2);}
.pr-card.featured{border-color:rgba(59,130,246,0.3);
  background:linear-gradient(145deg,rgba(59,130,246,0.08),rgba(99,102,241,0.04));}
.pr-card.featured::before{content:'';position:absolute;top:0;left:15%;right:15%;height:1px;
  background:linear-gradient(90deg,transparent,rgba(59,130,246,0.4),transparent);}

.pr-badge{position:absolute;top:16px;right:16px;padding:4px 12px;border-radius:100px;
  font-size:10px;font-weight:700;letter-spacing:0.5px;
  background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;}

.pr-plan-name{font-size:14px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;}
.pr-price{font-size:48px;font-weight:900;font-family:'JetBrains Mono',monospace;margin-bottom:4px;}
.pr-price span{font-size:18px;font-weight:500;color:var(--text2);}
.pr-price-note{font-size:13px;color:var(--text3);margin-bottom:24px;}

.pr-features{list-style:none;margin-bottom:28px;}
.pr-features li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--text2);margin-bottom:12px;}
.pr-features li::before{content:'✓';color:#86efac;font-weight:700;font-size:13px;}

.pr-btn{width:100%;padding:14px;border-radius:14px;font-size:14px;font-weight:700;
  cursor:pointer;transition:all 0.22s;font-family:'Outfit',sans-serif;border:none;}
.pr-btn-primary{background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;
  box-shadow:0 0 20px rgba(59,130,246,0.3);}
.pr-btn-primary:hover{transform:translateY(-1px);box-shadow:0 0 28px rgba(59,130,246,0.45);}
.pr-btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
.pr-btn-ghost{background:var(--glass);border:1px solid var(--border);color:var(--text2);}
.pr-btn-ghost:hover{background:var(--glass2);color:var(--text);}

.pr-current{padding:14px;border-radius:14px;font-size:14px;font-weight:600;text-align:center;
  background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);color:#86efac;}

.pr-faq{margin-top:80px;}
.pr-faq-title{text-align:center;font-size:28px;font-weight:800;margin-bottom:32px;}
.pr-faq-item{padding:20px 24px;border-radius:16px;margin-bottom:12px;
  background:var(--glass);border:1px solid var(--border);cursor:pointer;transition:all 0.2s;}
.pr-faq-item:hover{border-color:rgba(59,130,246,0.2);}
.pr-faq-q{font-size:15px;font-weight:600;margin-bottom:0;}
.pr-faq-a{font-size:14px;color:var(--text2);line-height:1.7;margin-top:12px;display:none;}
.pr-faq-item.open .pr-faq-a{display:block;}

.pr-alert{padding:16px 20px;border-radius:14px;margin-bottom:24px;font-size:14px;display:flex;align-items:center;gap:12px;}
.pr-alert-success{background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);color:#86efac;}
.pr-alert-error{background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.2);color:#fca5a5;}
`

export default function Pricing() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [billing, setBilling] = useState('monthly')
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    const id = 'pr-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style'); el.id = id; el.textContent = CSS
      document.head.appendChild(el)
    }

    // Fetch current subscription
    if (user) {
      api.get('/payments/subscription').then(res => setSubscription(res.data)).catch(() => {})
    }
  }, [user, searchParams])

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleCheckout = async (priceId) => {
    if (!user) {
      navigate('/signup')
      return
    }
    setLoading(true)

    const isLoaded = await loadRazorpayScript()
    if (!isLoaded) {
      setAlert({ type: 'error', msg: 'Razorpay SDK failed to load. Are you offline?' })
      setLoading(false)
      return
    }

    try {
      const { data } = await api.post('/payments/checkout', { priceId })

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: 'Unveil AI',
        description: 'Pro Subscription Plan',
        theme: { color: '#3B82F6' },
        prefill: {
          name: user.name || '',
          email: user.email || ''
        },
        handler: async (response) => {
          setLoading(true)
          try {
            await api.post('/payments/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature
            })

            setAlert({ type: 'success', msg: 'Subscription activated! Welcome to Pro.' })
            const res = await api.get('/payments/subscription')
            setSubscription(res.data)
          } catch (verifyErr) {
            setAlert({ type: 'error', msg: verifyErr.response?.data?.error || 'Verification failed' })
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Checkout failed' })
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your active Pro subscription?')) {
      return
    }
    setLoading(true)
    try {
      await api.post('/payments/cancel')
      setAlert({ type: 'success', msg: 'Subscription successfully cancelled.' })
      const res = await api.get('/payments/subscription')
      setSubscription(res.data)
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Failed to cancel subscription' })
      setLoading(false)
    }
  }

  const plans = [
    {
      name: 'Free',
      price: '$0',
      note: 'Forever free',
      features: ['20 scans per hour', '5 video scans per hour', '7-day history', 'All detection types', 'Browser extension'],
      cta: subscription?.tier === 'free' ? 'current' : 'free'
    },
    {
      name: 'Pro',
      price: billing === 'monthly' ? '$15' : '$12',
      note: billing === 'monthly' ? '/month' : '/month, billed yearly',
      priceId: billing === 'monthly'
        ? (import.meta.env.VITE_STRIPE_PRO_MONTHLY || 'price_pro_monthly')
        : (import.meta.env.VITE_STRIPE_PRO_YEARLY || 'price_pro_yearly'),
      features: ['200 scans per hour', '50 video scans per hour', '90-day history', 'PDF report export', 'Priority support', 'API access (coming soon)'],
      featured: true,
      cta: subscription?.tier === 'pro' ? 'current' : 'upgrade'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      note: 'Contact us',
      features: ['Unlimited scans', '1-year history', 'Custom API limits', 'Dedicated support', 'SLA guarantee', 'Team management'],
      cta: 'contact'
    }
  ]

  const faqs = [
    { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.' },
    { q: 'How accurate is the detection?', a: 'Our detection uses a combination of statistical analysis and AI to identify AI-generated content. Accuracy varies by content type, typically 70-90%. Results are probabilistic, not definitive.' },
    { q: 'What payment methods do you accept?', a: 'We accept credit cards, debit cards, UPI, net banking, and popular wallets through our secure Razorpay gateway.' },
    { q: 'Do you offer refunds?', a: 'We offer a full refund within 7 days of purchase if you\'re not satisfied with the service.' },
  ]

  return (
    <div>
      <div className="pr-bg">
        <div className="pr-orb pr-o1" /><div className="pr-orb pr-o2" /><div className="pr-grid" />
      </div>

      <nav className="pr-nav">
        <div className="pr-logo" onClick={() => navigate('/dashboard')}>UNVEIL</div>
        <button className="pr-back" onClick={() => navigate(user ? '/dashboard' : '/')}>
          ← {user ? 'Dashboard' : 'Home'}
        </button>
      </nav>

      <div className="pr-wrap">
        <h1 className="pr-title">Simple, <span>transparent pricing</span></h1>
        <p className="pr-sub">Start free, upgrade when you need more. No hidden fees.</p>

        {alert && (
          <div className={`pr-alert pr-alert-${alert.type}`}>
            {alert.type === 'success' ? '✓' : '⚠'} {alert.msg}
          </div>
        )}

        <div className="pr-toggle">
          <div className="pr-toggle-inner">
            <button className={`pr-toggle-btn ${billing === 'monthly' ? 'active' : ''}`}
              onClick={() => setBilling('monthly')}>Monthly</button>
            <button className={`pr-toggle-btn ${billing === 'yearly' ? 'active' : ''}`}
              onClick={() => setBilling('yearly')}>
              Yearly <span className="pr-save">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="pr-cards">
          {plans.map((plan, i) => (
            <div key={i} className={`pr-card ${plan.featured ? 'featured' : ''}`}>
              {plan.featured && <div className="pr-badge">MOST POPULAR</div>}
              <div className="pr-plan-name">{plan.name}</div>
              <div className="pr-price">{plan.price}<span>{plan.name !== 'Enterprise' ? '/mo' : ''}</span></div>
              <div className="pr-price-note">{plan.note}</div>
              <ul className="pr-features">
                {plan.features.map((f, j) => <li key={j}>{f}</li>)}
              </ul>
              {plan.cta === 'current' ? (
                <div className="pr-current">Current Plan</div>
              ) : plan.cta === 'free' ? (
                <button className="pr-btn pr-btn-ghost" onClick={() => navigate('/signup')}>Get Started</button>
              ) : plan.cta === 'contact' ? (
                <button className="pr-btn pr-btn-ghost" onClick={() => window.location.href = 'mailto:hello@unveil.app'}>Contact Sales</button>
              ) : subscription?.tier === 'pro' ? (
                <button className="pr-btn pr-btn-ghost" onClick={handleCancel} disabled={loading}>
                  {loading ? 'Loading...' : 'Cancel Subscription'}
                </button>
              ) : (
                <button className="pr-btn pr-btn-primary" onClick={() => handleCheckout(plan.priceId)} disabled={loading}>
                  {loading ? 'Loading...' : 'Upgrade to Pro'}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pr-faq">
          <h2 className="pr-faq-title">Frequently Asked Questions</h2>
          {faqs.map((faq, i) => (
            <div key={i} className={`pr-faq-item ${openFaq === i ? 'open' : ''}`}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div className="pr-faq-q">{faq.q}</div>
              <div className="pr-faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
