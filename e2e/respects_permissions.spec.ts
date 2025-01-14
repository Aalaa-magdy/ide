import { test, expect, Page } from '@playwright/test';
import { testRunCode, goToPage, createNew, switchLang } from './helpers';

// note: these tests are currently quite bad -- we need error handling for when permission is denied
// rather than just silently failing.

test.describe('Respects Permissions', () => {
  test('should support view only', async ({ page, browser }) => {
    const context2 = await browser.newContext();

    const page2 = await context2.newPage();

    await createNew(page);
    await page.waitForSelector('text="Run Code"');
    await page.click('text=File');
    await page.click('text=Settings');
    await page.click('div[role="radio"]:has-text("View Only")');
    await page.click('text=Save');

    await goToPage(page, page2);
    await page2.waitForSelector('text="View Only"');

    // let monaco load
    await page.waitForTimeout(500);
    await page2.waitForTimeout(500);

    // test input
    await page2.click('[data-test-id="input-editor"]');
    await page2.waitForTimeout(200);
    await page2.keyboard.type('1 2 3');
    await page2.waitForTimeout(200);
    expect(await page2.$('text="1 2 3"')).toBeFalsy();

    await page.click('[data-test-id="input-editor"]');
    await page.waitForTimeout(200);
    await page.keyboard.type('1 2 3');
    await page.waitForTimeout(200);
    expect(await page.$('text="1 2 3"')).toBeTruthy();
    await page2.waitForSelector('text="1 2 3"');

    // test scribble
    await page2.click('text=scribble');
    await page2.waitForTimeout(200);
    await page2.click('[data-test-id="scribble-editor"]');
    await page2.waitForTimeout(200);
    await page2.keyboard.type('testing scribble');
    await page2.waitForTimeout(200);
    expect(await page2.$('text="testing scribble"')).toBeFalsy();

    await page.click('text=scribble');
    await page.waitForTimeout(200);
    await page.click('[data-test-id="scribble-editor"]');
    await page.waitForTimeout(200);
    await page.keyboard.type('testing scribble');
    await page.waitForTimeout(200);
    expect(await page.$('text="testing scribble"')).toBeTruthy();
    await page2.waitForSelector('text="testing scribble"');

    // test editor
    await page2.click('.view-lines div:nth-child(10)');
    await page.waitForTimeout(200);
    await page2.keyboard.type('// this is a comment');
    await page.waitForTimeout(200);
    expect(await page2.$('text="// this is a comment"')).toBeFalsy();
    await page.click('.view-lines div:nth-child(10)');
    await page.waitForTimeout(200);
    await page.keyboard.type('// this is a comment');
    await page.waitForTimeout(200);
    expect(await page.$('text="// this is a comment"')).toBeTruthy();
    await page2.waitForSelector('text="// this is a comment"');

    // test run buttons -- only the first page should work
    await testRunCode(page);
    await expect(
      page2.getByRole('button', { name: 'Run Code' })
    ).toBeDisabled();

    await switchLang(page, 'Java');
    await page.waitForSelector('button:has-text("Run Code")');
    await page2.waitForSelector('button:has-text("Run Code")');
    await page2.click('.view-lines div:nth-child(2)');
    await page.waitForTimeout(200);
    await page2.keyboard.type('// this is a comment');
    await page.waitForTimeout(200);
    expect(await page2.$('text="// this is a comment"')).toBeFalsy();
    await page.click('.view-lines div:nth-child(2)');
    await page.waitForTimeout(200);
    await page.keyboard.type('// this is a comment');
    await page.waitForTimeout(200);
    expect(await page.$('text="// this is a comment"')).toBeTruthy();
    await page2.waitForSelector('text="// this is a comment"');

    await switchLang(page, 'Python 3.8.1');
    await page.waitForSelector('button:has-text("Run Code")');
    await page2.waitForSelector('button:has-text("Run Code")');
    await page2.click('.view-lines div:nth-child(5)');
    await page.waitForTimeout(200);
    await page2.keyboard.type('# this is a comment');
    await page.waitForTimeout(200);
    expect(await page2.$('text="# this is a comment"')).toBeFalsy();
    await page.click('.view-lines div:nth-child(5)');
    await page.waitForTimeout(200);
    await page.keyboard.type('# this is a comment');
    await page.waitForTimeout(200);
    expect(await page.$('text="# this is a comment"')).toBeTruthy();
    await page2.waitForSelector('text="# this is a comment"');

    await page2.close();
    await context2.close();
  });

  test('should work when default permission is changed', async ({
    page,
    browser,
  }) => {
    const context2 = await browser.newContext();

    const page2 = await context2.newPage();

    await createNew(page);
    await page.waitForSelector('button:has-text("Run Code")');

    await goToPage(page, page2);
    await page2.waitForSelector('button:has-text("Run Code")');

    // let monaco load
    await page.waitForTimeout(500);
    await page2.waitForTimeout(500);

    // test input: everything should still work right now
    await page2.click('[data-test-id="input-editor"]');
    await page2.keyboard.type('1 2 3');
    await page2.waitForSelector('text="1 2 3"');

    // try view only
    await page.click('text=File');
    await page.click('text=Settings');
    await page.click('div[role="radio"]:has-text("View Only")');
    await page.click('text=Save');
    await page2.waitForSelector('text="View Only"');

    // test input: we shouldn't be able to type anything on page 2
    await page2.click('[data-test-id="input-editor"]');
    await page2.keyboard.type('4 5 6');
    expect(await page2.$('text="4 5 6"')).toBeFalsy();

    // try private
    await page.click('text=File');
    await page.click('text=Settings');
    await page.click('div[role="radio"]:has-text("Private")');
    await page.click('text=Save');
    await page2.waitForSelector('text="This file is private."');

    // back to read/write
    await page.click('text=File');
    await page.click('text=Settings');
    await page.click('div[role="radio"]:has-text("Public Read & Write")');
    await page.click('text=Save');
    await page2.waitForSelector('button:has-text("Run Code")');
    // let monaco load
    await page2.waitForTimeout(500);

    // test input: we should be able to type stuff now
    await page2.click('[data-test-id="input-editor"]');
    await page2.keyboard.type('0 9 8');
    // 1 2 3 from above
    await page2.waitForSelector('text="1 2 30 9 8"');

    await page2.close();
    await context2.close();
  });
});
