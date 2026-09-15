import { useState, type ReactElement } from 'react';
import { ALL_STORIES, CATEGORIES } from './storyRegistry';
import styles from './WorkbenchShell.module.scss';

export function WorkbenchShell(): ReactElement {
  const [selectedStoryId, setSelectedStoryId] = useState<string>(ALL_STORIES[0]?.id ?? 'button');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light' | 'high-contrast'>('dark');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [gainLoss, setGainLoss] = useState<'green-up' | 'red-up'>('green-up');

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'high-contrast'): void => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleDensityChange = (newDensity: 'comfortable' | 'compact'): void => {
    setDensity(newDensity);
    document.documentElement.setAttribute('data-density', newDensity);
  };

  const handleGainLossChange = (newGainLoss: 'green-up' | 'red-up'): void => {
    setGainLoss(newGainLoss);
    document.documentElement.setAttribute('data-gain-loss', newGainLoss);
  };

  const activeStory = ALL_STORIES.find((s) => s.id === selectedStoryId) ?? ALL_STORIES[0];

  const filteredStories = ALL_STORIES.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className={styles.workbench ?? ''}>
      <header className={styles.topBar ?? ''}>
        <div className={styles.brand ?? ''}>
          <h1 className={styles.title ?? ''}>StaySteady UI</h1>
          <span className={styles.badge ?? ''}>Component Workbench</span>
        </div>

        <div className={styles.controls ?? ''}>
          <div className={styles.controlGroup ?? ''}>
            <span>Theme:</span>
            <select
              value={theme}
              onChange={(e) =>
                handleThemeChange(e.target.value as 'dark' | 'light' | 'high-contrast')
              }
              className={styles.select ?? ''}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="high-contrast">High Contrast</option>
            </select>
          </div>

          <div className={styles.controlGroup ?? ''}>
            <span>Density:</span>
            <select
              value={density}
              onChange={(e) => handleDensityChange(e.target.value as 'comfortable' | 'compact')}
              className={styles.select ?? ''}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>

          <div className={styles.controlGroup ?? ''}>
            <span>Gain/Loss:</span>
            <select
              value={gainLoss}
              onChange={(e) => handleGainLossChange(e.target.value as 'green-up' | 'red-up')}
              className={styles.select ?? ''}
            >
              <option value="green-up">Green-Up (Western/IN)</option>
              <option value="red-up">Red-Up (East Asia)</option>
            </select>
          </div>
        </div>
      </header>

      <div className={styles.main ?? ''}>
        <aside className={styles.sidebar ?? ''}>
          <div className={styles.searchBox ?? ''}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components..."
              className={styles.searchInput ?? ''}
            />
          </div>

          <nav className={styles.navList ?? ''}>
            {CATEGORIES.map((cat) => {
              const storiesInCat = filteredStories.filter((s) => s.category === cat);
              if (storiesInCat.length === 0) return null;
              return (
                <div key={cat} className={styles.categoryGroup ?? ''}>
                  <div className={styles.categoryHeader ?? ''}>{cat}</div>
                  {storiesInCat.map((story) => (
                    <button
                      key={story.id}
                      type="button"
                      data-active={story.id === selectedStoryId}
                      onClick={() => setSelectedStoryId(story.id)}
                      className={styles.storyButton ?? ''}
                    >
                      {story.name}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className={styles.content ?? ''}>
          {activeStory && (
            <>
              <div className={styles.storyHeader ?? ''}>
                <h2 className={styles.storyTitle ?? ''}>{activeStory.name}</h2>
                <p className={styles.storyDesc ?? ''}>{activeStory.description}</p>
              </div>

              <div className={styles.storyCanvas ?? ''}>{activeStory.render()}</div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
