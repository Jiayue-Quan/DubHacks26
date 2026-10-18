import { useEffect, useState } from 'react';
import BlobArt from '../blob/BlobArt';
import './Credits.css';

/*
  The end credits (scene "end_credits", "art": "credits", "layout": "full").
  Dark blue night, slow waves along the bottom, Violet sitting alone by the water.
  The two messages fade in one after the other, then the hotline and the title stay on screen.
  Click anywhere to skip ahead to the next part.
*/

const STEPS = [
  { at: 1.2 },    // 1: "For us this might just be a topic..."
  { at: 11 },     // 2: "Please support victims..."
  { at: 21 },     // 3: hotline + title (stays)
];

export default function Credits() {
  const [step, setStep] = useState(0);

  // move to the next part on a timer (or when clicked)
  useEffect(() => {
    if (step >= STEPS.length) return;
    const wait = step === 0 ? STEPS[0].at : STEPS[step].at - STEPS[step - 1].at;
    const timer = setTimeout(() => setStep(s => s + 1), wait * 1000);
    return () => clearTimeout(timer);
  }, [step]);

  const skip = () => setStep(s => Math.min(STEPS.length, s + 1));

  return (
    <div className="cr" onClick={skip}>
      <div className="cr-sky" />
      <div className="cr-stars" />
      <div className="cr-moon" />

      {/* slow waves along the bottom */}
      <svg className="cr-waves" viewBox="0 0 1600 300" preserveAspectRatio="none" aria-hidden>
        <path className="cr-wave cr-wave--1" d="M0 120 Q200 80 400 120 T800 120 T1200 120 T1600 120 T2000 120 T2400 120 T2800 120 T3200 120 V300 H0 Z" />
        <path className="cr-wave cr-wave--2" d="M0 170 Q200 130 400 170 T800 170 T1200 170 T1600 170 T2000 170 T2400 170 T2800 170 T3200 170 V300 H0 Z" />
        <path className="cr-wave cr-wave--3" d="M0 220 Q200 190 400 220 T800 220 T1200 220 T1600 220 T2000 220 T2400 220 T2800 220 T3200 220 V300 H0 Z" />
      </svg>

      {/* violet, alone by the water, looking out */}
      <div className="cr-violet" aria-hidden>
        <div className="cr-violet__body"><BlobArt who="violet" idSuffix="credits" /></div>
      </div>

      <div className="cr-text">
        <p className={`cr-block${step === 1 ? ' is-on' : ''}`}>
          For us this might just be a “topic” or an “idea” or an “issue,” but for so many others
          this is their entire life, and without the right support, it is all they get in this life.
        </p>

        <p className={`cr-block${step === 2 ? ' is-on' : ''}`}>
          Please support victims and extend compassion, not judgment, towards them.
          <br /><br />
          Remember, abuse is not love. It is not merely a moment of anger. Abuse is control.
          <br /><br />
          <em>You deserve better.</em>
        </p>

        <div className={`cr-end${step >= 3 ? ' is-on' : ''}`}>
          <div className="cr-hotline" onClick={e => e.stopPropagation()}>
            <span className="cr-hotline__tag">if you or someone you know needs help</span>
            <h2>National Domestic Violence Hotline</h2>
            <p className="cr-hotline__hours">Call · Chat · Text — 24/7</p>
            <div className="cr-hotline__ways">
              <a href="tel:18007997233">1-800-799-SAFE (7233)</a>
              <a href="sms:88788?body=START">Text “START” to 88788</a>
              <a href="https://www.thehotline.org" target="_blank" rel="noreferrer">thehotline.org</a>
            </div>
          </div>

          <h1 className="cr-title">it comes in waves</h1>
          <p className="cr-made">made at DubHacks ’26</p>
          <button className="cr-again" type="button" onClick={e => { e.stopPropagation(); window.location.reload(); }}>
            play again
          </button>
        </div>
      </div>
    </div>
  );
}
