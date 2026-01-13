import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log('🧪 Running gallery validation tests...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let passed = 0;
    let failed = 0;

    try {
        // Test 1: Page loads
        console.log('Test 1: Page loads correctly');
        await page.goto(BASE_URL, { timeout: 10000 });
        const title = await page.title();
        if (title.includes('Building:bit')) {
            console.log('  ✓ Page title is correct');
            passed++;
        } else {
            console.log(`  ✗ Page title wrong: ${title}`);
            failed++;
        }

        // Test 2: Gallery cards are rendered
        console.log('\nTest 2: Gallery cards render');
        await page.waitForSelector('.gallery-card', { timeout: 5000 });
        const cards = await page.$$('.gallery-card');
        if (cards.length === 3) {
            console.log(`  ✓ Found ${cards.length} gallery cards`);
            passed++;
        } else {
            console.log(`  ✗ Expected 3 cards, found ${cards.length}`);
            failed++;
        }

        // Test 3: Images load correctly (local WebP)
        console.log('\nTest 3: Local images load');
        const images = await page.$$eval('.gallery-card img', imgs =>
            imgs.map(img => ({
                src: img.src,
                loaded: img.complete && img.naturalWidth > 0
            }))
        );

        const loadedImages = images.filter(img => img.loaded && img.src.includes('.webp'));
        if (loadedImages.length === 3) {
            console.log(`  ✓ All ${loadedImages.length} images loaded (WebP format)`);
            passed++;
        } else {
            console.log(`  ✗ Only ${loadedImages.length}/3 images loaded`);
            images.forEach((img, i) => console.log(`    Image ${i+1}: ${img.src.slice(-40)} - ${img.loaded ? 'OK' : 'FAILED'}`));
            failed++;
        }

        // Test 4: Card content is English
        console.log('\nTest 4: Card content is in English');
        const cardTitles = await page.$$eval('.card-title', els => els.map(el => el.textContent));
        const englishTitles = cardTitles.filter(t => /^[a-zA-Z0-9\s\-]+$/.test(t.trim()));
        if (englishTitles.length === cardTitles.length) {
            console.log(`  ✓ All ${cardTitles.length} titles are in English`);
            cardTitles.forEach(t => console.log(`    - ${t}`));
            passed++;
        } else {
            console.log(`  ✗ Some titles not in English`);
            cardTitles.forEach(t => console.log(`    - ${t}`));
            failed++;
        }

        // Test 5: Modal opens when card is clicked
        console.log('\nTest 5: Modal opens on card click');
        await page.click('.gallery-card:first-child');
        await page.waitForSelector('.modal.active', { timeout: 3000 });
        const modalVisible = await page.$('.modal.active');
        if (modalVisible) {
            console.log('  ✓ Modal opens correctly');
            passed++;
        } else {
            console.log('  ✗ Modal did not open');
            failed++;
        }

        // Test 6: Modal has Build Instructions button (opens step viewer)
        console.log('\nTest 6: Modal has Build Instructions button');
        const buildLink = await page.$('#assemblyLink');
        if (buildLink) {
            console.log('  ✓ Build Instructions button found');
            passed++;
        } else {
            console.log('  ✗ Build Instructions button missing');
            failed++;
        }

        // Test 7: Modal has coding options
        console.log('\nTest 7: Modal has coding options');
        const codingOptions = await page.$$('.coding-option');
        if (codingOptions.length > 0) {
            console.log(`  ✓ Found ${codingOptions.length} coding option(s)`);
            const optionTexts = await page.$$eval('.coding-option .option-title', els => els.map(el => el.textContent));
            optionTexts.forEach(t => console.log(`    - ${t}`));
            passed++;
        } else {
            console.log('  ✗ No coding options found');
            failed++;
        }

        // Close modal
        await page.click('#closeModal');
        await page.waitForTimeout(500);

        // Test 8: Filter buttons work
        console.log('\nTest 8: Filter buttons work');
        await page.click('[data-filter="advanced"]');
        await page.waitForTimeout(500);
        const advancedCards = await page.$$('.gallery-card');
        if (advancedCards.length === 1) {
            console.log('  ✓ Advanced filter shows 1 card');
            passed++;
        } else {
            console.log(`  ✗ Advanced filter shows ${advancedCards.length} cards (expected 1)`);
            failed++;
        }

        // Test 9: All Projects filter shows all
        await page.click('[data-filter="all"]');
        await page.waitForTimeout(500);
        const allCards = await page.$$('.gallery-card');
        if (allCards.length === 3) {
            console.log('  ✓ All Projects filter shows 3 cards');
            passed++;
        } else {
            console.log(`  ✗ All Projects filter shows ${allCards.length} cards (expected 3)`);
            failed++;
        }

        // Test 10: Step viewer opens from Build Instructions
        console.log('\nTest 10: Step viewer opens');
        await page.click('.gallery-card:first-child');
        await page.waitForSelector('.modal.active', { timeout: 3000 });
        await page.click('#assemblyLink');
        await page.waitForTimeout(500);
        const stepViewer = await page.$('.step-viewer.active');
        if (stepViewer) {
            console.log('  ✓ Step viewer opens correctly');
            passed++;

            // Check step viewer has content
            const stepImage = await page.$('#stepImage');
            const stepCounter = await page.$eval('#stepCounter', el => el.textContent);
            if (stepCounter && stepCounter.includes('/')) {
                console.log(`  ✓ Step counter shows: ${stepCounter}`);
                passed++;
            } else {
                console.log('  ✗ Step counter not displaying');
                failed++;
            }

            // Test navigation
            await page.click('.step-next');
            await page.waitForTimeout(300);
            const newCounter = await page.$eval('#stepCounter', el => el.textContent);
            if (newCounter.startsWith('2')) {
                console.log('  ✓ Step navigation works');
                passed++;
            } else {
                console.log('  ✗ Step navigation failed');
                failed++;
            }

            // Close step viewer with Escape
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
        } else {
            console.log('  ✗ Step viewer did not open');
            failed++;
        }

        // Test 11: Lesson viewer opens from coding options
        console.log('\nTest 11: Lesson viewer opens');
        await page.click('.gallery-card:first-child');
        await page.waitForSelector('.modal.active', { timeout: 3000 });
        await page.click('.coding-option.makecode');
        await page.waitForTimeout(500);
        const lessonViewer = await page.$('.lesson-viewer.active');
        if (lessonViewer) {
            console.log('  ✓ Lesson viewer opens correctly');
            passed++;

            // Check lesson list
            const lessonItems = await page.$$('.lesson-item');
            if (lessonItems.length > 0) {
                console.log(`  ✓ Found ${lessonItems.length} lessons in list`);
                passed++;
            } else {
                console.log('  ✗ No lessons found');
                failed++;
            }

            // Check copy button exists
            const copyBtn = await page.$('.copy-btn');
            if (copyBtn) {
                console.log('  ✓ Copy button available');
                passed++;
            } else {
                console.log('  ✗ Copy button not found');
                failed++;
            }

            // Close lesson viewer
            await page.click('.lesson-close-btn');
            await page.waitForTimeout(300);
        } else {
            console.log('  ✗ Lesson viewer did not open');
            failed++;
        }

        // Take a screenshot for review
        await page.screenshot({ path: 'public/images/test-screenshot.png', fullPage: true });
        console.log('\n📸 Screenshot saved to public/images/test-screenshot.png');

    } catch (err) {
        console.log(`\n❌ Test error: ${err.message}`);
        failed++;
    } finally {
        await browser.close();
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(console.error);
