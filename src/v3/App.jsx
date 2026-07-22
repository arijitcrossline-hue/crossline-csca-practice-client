import React, { useState } from 'react';
import { AppShell } from '@astryxdesign/core/AppShell';
import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { TopNav } from '@astryxdesign/core/TopNav';
import { Card } from '@astryxdesign/core/Card';
import { Button } from '@astryxdesign/core/Button';
import { List, ListItem } from '@astryxdesign/core/List';

// Warm, cozy, minimal dashboard demo using the Astryx neutral theme.
// Pure grayscale spine (#fafafa → #171717), Figtree type, flat surfaces,
// no harsh color — the content stays the focus.

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'do_not_disturb_onto', selectedIcon: 'do_not_disturb_onto' },
  { id: 'exams', label: 'Exams', icon: 'description', selectedIcon: 'description' },
  { id: 'results', label: 'Results', icon: 'bar_chart', selectedIcon: 'bar_chart' },
  { id: 'weakness', label: 'Weakness', icon: 'target', selectedIcon: 'target' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'trophy', selectedIcon: 'trophy' },
  { id: 'pricing', label: 'Pricing', icon: 'workspace_premium', selectedIcon: 'workspace_premium' },
  { id: 'settings', label: 'Settings', icon: 'settings', selectedIcon: 'settings' },
];

const metrics = [
  { label: 'Latest score', value: '78%', sub: 'CSCA Mock 12' },
  { label: 'Improvement', value: '+12%', sub: 'Last 5 exams' },
  { label: 'Attempts', value: '16', sub: 'This month: 3' },
  { label: 'Average', value: '72%', sub: 'All exams' },
];

const weaknesses = [
  { topic: 'Calculus', pct: 47 },
  { topic: 'Diagrams', pct: 58 },
  { topic: 'Mechanics', pct: 64 },
  { topic: 'Optics', pct: 71 },
];

const recent = [
  { exam: 'CSCA Mock 12', score: '78%', date: 'Jul 21', status: 'ok' },
  { exam: 'CSCA Mock 11', score: '72%', date: 'Jul 18', status: 'ok' },
  { exam: 'Physics Set 4', score: '65%', date: 'Jul 14', status: 'ok' },
];

export default function App() {
  const [active, setActive] = useState('dashboard');

  return (
    <AppShell
      height="fill"
      variant="wash"
      contentPadding={4}
      sideNav={
        <SideNav collapsible={{ defaultIsCollapsed: false }}>
          <SideNavHeading
            productIcon={<span style={{ fontSize: '1.2rem' }}>📚</span>}
            productName="Crossline"
          />
          <SideNavSection>
            {navItems.map((item) => (
              <SideNavItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                selectedIcon={item.selectedIcon}
                isSelected={active === item.id}
                onClick={() => setActive(item.id)}
              />
            ))}
          </SideNavSection>
        </SideNav>
      }
      topNav={
        <TopNav
          title="Dashboard"
          subtitle="Welcome back, Arijit"
          endContent={
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button label="Create account" variant="ghost" size="sm" />
              <Button label="Start exam" variant="primary" size="sm" />
            </div>
          }
        />
      }
    >
      <Dashboard active={active} />
    </AppShell>
  );
}

function Dashboard({ active }) {
  if (active !== 'dashboard') {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
          {navItems.find((n) => n.id === active)?.label}
        </h2>
        <p>This section is part of the demo shell. Switch back to Dashboard to see the warm minimal layout.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gap: '1.5rem' }}>
      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
          Good morning, Arijit 👋
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Ready for your next exam? Your last score was 78%.
        </p>
      </div>

      {/* Metric row — 4 small cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {metrics.map((m) => (
          <Card key={m.label} padding={3}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-primary)', lineHeight: 1, marginBottom: '0.4rem' }}>
              {m.value}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{m.sub}</div>
          </Card>
        ))}
      </div>

      {/* Two-column: weaknesses + recent results */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Weaknesses */}
        <Card padding={4}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
            Biggest weaknesses
          </h3>
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {weaknesses.map((w) => (
              <div key={w.topic}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{w.topic}</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{w.pct}%</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-background-muted)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${w.pct}%`, background: 'var(--color-text-primary)', borderRadius: '3px', opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.25rem' }}>
            <Button label="View analysis" variant="ghost" size="sm" />
          </div>
        </Card>

        {/* Recent results */}
        <Card padding={4}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
            Recent results
          </h3>
          <List hasDividers density="compact">
            {recent.map((r) => (
              <ListItem
                key={r.exam}
                startContent={<span style={{ fontSize: '1rem' }}>📝</span>}
                primaryText={r.exam}
                secondaryText={r.date}
                endContent={<span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{r.score}</span>}
              />
            ))}
          </List>
          <div style={{ marginTop: '1rem' }}>
            <Button label="All results" variant="ghost" size="sm" />
          </div>
        </Card>
      </div>

      {/* CTA strip */}
      <Card padding={4}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              Start your next exam
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
              Physics · Mock 13 · 48 questions · 60 minutes
            </p>
          </div>
          <Button label="Start exam" variant="primary" />
        </div>
      </Card>
    </div>
  );
}
