import { expect, test } from '@playwright/test';

async function createBoard(
  page: import('@playwright/test').Page,
  name: string,
  details = '',
) {
  await page.getByRole('textbox', { name: 'Board name' }).fill(name);
  if (details) {
    await page.getByRole('textbox', { name: 'Details (optional)' }).fill(details);
  }
  await page.getByRole('button', { name: 'Create board' }).click();
}

test('create, move, rename, and delete a card', async ({ page }) => {
  await page.goto('/');
  await createBoard(page, 'Summer launch');

  const ideas = page.getByRole('region', { name: 'Ideas' });
  const planning = page.getByRole('region', { name: 'Planning' });

  await ideas.getByRole('button', { name: 'Add a card to Ideas' }).click();
  await page.getByRole('textbox', { name: 'Card title' }).fill('Browser test card');
  await page.getByRole('textbox', { name: 'Card details' }).fill('Created by Playwright');
  await page.getByRole('button', { name: 'Save card' }).click();

  const card = page.getByRole('article', { name: /Browser test card/ });
  await expect(card).toBeVisible();

  const moveHandle = card.getByRole('button', { name: 'Move Browser test card' });
  const source = await moveHandle.boundingBox();
  const target = await planning.boundingBox();
  if (!source || !target) throw new Error('Could not locate card and target column');

  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + 80, { steps: 12 });
  await page.mouse.up();

  await expect(planning.getByRole('article', { name: /Browser test card/ })).toBeVisible();
  await expect(ideas.getByRole('article', { name: /Browser test card/ })).toHaveCount(0);

  await planning.getByRole('button', { name: 'Rename Planning' }).click();
  await page.getByRole('textbox', { name: 'Column name' }).fill('Ready');
  await page.getByRole('button', { name: 'Save column name' }).click();
  const ready = page.getByRole('region', { name: 'Ready' });
  await ready.getByRole('button', { name: 'Delete Browser test card' }).click();
  await expect(ready.getByRole('article', { name: /Browser test card/ })).toHaveCount(0);
});

test('keeps the board usable on a phone-sized viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await createBoard(page, 'Mobile launch');

  await expect(page.getByRole('heading', { level: 1, name: 'Mobile launch' })).toBeVisible();
  await expect(page.locator('[data-column-id]')).toHaveCount(5);

  const dimensions = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewportWidth);

  await page.setViewportSize({ width: 768, height: 1024 });
  const tabletDimensions = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(tabletDimensions.bodyWidth).toBeLessThanOrEqual(tabletDimensions.viewportWidth);
});

test('moves a card with the keyboard', async ({ page }) => {
  await page.goto('/');
  await createBoard(page, 'Keyboard launch');

  const planning = page.getByRole('region', { name: 'Planning' });
  const ideas = page.getByRole('region', { name: 'Ideas' });
  const moveHandle = planning.getByRole('button', { name: 'Move Sprint outline' });

  await moveHandle.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Escape');

  await expect(planning.getByRole('article', { name: /Sprint outline/ })).toBeVisible();
  await expect(ideas.getByRole('article', { name: /Sprint outline/ })).toHaveCount(0);

  await moveHandle.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');

  await expect(ideas.getByRole('article', { name: /Sprint outline/ })).toBeVisible();
  await expect(planning.getByRole('article', { name: /Sprint outline/ })).toHaveCount(0);
});

test('creates and switches between session-only boards', async ({ page }) => {
  await page.goto('/');
  await createBoard(page, 'Marketing', 'Plan a memorable launch');
  await expect(page.getByText('Plan a memorable launch')).toBeVisible();

  await page.getByRole('button', { name: 'Delete Launch teaser campaign' }).click();
  await page.getByRole('button', { name: 'Add board' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Create another floboard' })).toBeVisible();
  await createBoard(page, 'Product');

  await expect(page.getByRole('button', { name: 'Product' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { level: 1, name: 'Product' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete Launch teaser campaign' })).toBeVisible();

  await page.getByRole('button', { name: 'Marketing' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Marketing' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Launch teaser campaign' })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Name your first floboard' })).toBeVisible();
});

test('deletes the active board after confirmation and selects a remaining board', async ({ page }) => {
  await page.goto('/');
  await createBoard(page, 'Marketing');
  await page.getByRole('button', { name: 'Add board' }).click();
  await createBoard(page, 'Product');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete the flo' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Marketing' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Product' })).toHaveCount(0);
});
