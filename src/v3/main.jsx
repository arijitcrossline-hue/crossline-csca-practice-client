import React from 'react';
import { createRoot } from 'react-dom/client';
import { Theme } from '@astryxdesign/core/theme';

// Astryx base styles — required for components to render correctly.
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
// Neutral theme (warm grays, minimal, quiet).
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import '@astryxdesign/theme-neutral/theme.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Theme theme={neutralTheme}>
      <App />
    </Theme>
  </React.StrictMode>
);
