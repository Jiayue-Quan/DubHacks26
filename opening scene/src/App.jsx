import { useState } from 'react';
import OpeningScene from './components/opening/OpeningScene';

export default function App() {
  const [introDone, setIntroDone] = useState(false);

  // 1. the book menu + opening animation
  if (!introDone) return <OpeningScene onComplete={() => setIntroDone(true)} />;

  // 2. after the opening: the game starts here
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif' }}>
      Chapter One: the game starts here.
    </div>
  );
}
