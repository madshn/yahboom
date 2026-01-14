// Parse lesson HTML into structured data

import { logger } from '../utils/logger.js';

/**
 * Extract text content from an element, following it after a heading
 */
function getTextAfterHeading(document, headingText) {
  const headings = document.querySelectorAll('h2, h3, h4');
  for (const heading of headings) {
    if (heading.textContent.toLowerCase().includes(headingText.toLowerCase())) {
      // Get all text until next heading
      let text = '';
      let sibling = heading.nextElementSibling;
      while (sibling && !['H2', 'H3', 'H4'].includes(sibling.tagName)) {
        text += sibling.textContent + '\n';
        sibling = sibling.nextElementSibling;
      }
      return text.trim();
    }
  }
  return null;
}

/**
 * Extract images that follow a specific heading
 */
function getImagesAfterHeading(document, headingText) {
  const headings = document.querySelectorAll('h2, h3, h4');
  for (const heading of headings) {
    if (heading.textContent.toLowerCase().includes(headingText.toLowerCase())) {
      const images = [];
      let sibling = heading.nextElementSibling;
      while (sibling && !['H2', 'H3', 'H4'].includes(sibling.tagName)) {
        const imgs = sibling.querySelectorAll('img');
        imgs.forEach(img => {
          if (img.src) {
            images.push({
              src: img.src,
              alt: img.alt || '',
            });
          }
        });
        sibling = sibling.nextElementSibling;
      }
      return images;
    }
  }
  return [];
}

/**
 * Parse MakeCode lesson content from page
 */
export async function parseMakeCodeLesson(page) {
  return page.evaluate(() => {
    const lesson = {
      title: null,
      objective: null,
      motorWiring: null,
      blocksUsed: [],
      code: null,
      hexFile: null,
      phenomenon: null,
      images: [],
    };

    // Helper: get text after heading
    function getTextAfter(searchText) {
      const headings = document.querySelectorAll('h2, h3, h4');
      for (const h of headings) {
        if (h.textContent.toLowerCase().includes(searchText.toLowerCase())) {
          let text = '';
          let sib = h.nextElementSibling;
          while (sib && !['H2', 'H3', 'H4'].includes(sib.tagName)) {
            text += sib.textContent + '\n';
            sib = sib.nextElementSibling;
          }
          return text.trim();
        }
      }
      return null;
    }

    // Helper: get images after heading
    function getImagesAfter(searchText) {
      const headings = document.querySelectorAll('h2, h3, h4');
      for (const h of headings) {
        if (h.textContent.toLowerCase().includes(searchText.toLowerCase())) {
          const imgs = [];
          let sib = h.nextElementSibling;
          while (sib && !['H2', 'H3', 'H4'].includes(sib.tagName)) {
            sib.querySelectorAll('img').forEach(img => {
              if (img.src && !img.src.includes('data:')) {
                imgs.push({ src: img.src, alt: img.alt || '' });
              }
            });
            sib = sib.nextElementSibling;
          }
          return imgs;
        }
      }
      return [];
    }

    // Title - usually h1 or first prominent text
    const h1 = document.querySelector('h1');
    if (h1) lesson.title = h1.textContent.trim();

    // Learning objectives
    lesson.objective = getTextAfter('learning objective');

    // Motor wiring
    const wiringText = getTextAfter('motor wiring');
    const wiringImages = getImagesAfter('motor wiring');
    if (wiringText || wiringImages.length > 0) {
      lesson.motorWiring = {
        description: wiringText,
        images: wiringImages,
        connections: [],
      };

      // Try to parse connection details (M1, M3, etc.)
      if (wiringText) {
        const m1Match = wiringText.match(/M1[^.]*interface[^.]*/i);
        const m3Match = wiringText.match(/M3[^.]*interface[^.]*/i);
        if (m1Match) {
          lesson.motorWiring.connections.push({
            component: 'left motor',
            port: 'M1',
            notes: m1Match[0].trim(),
          });
        }
        if (m3Match) {
          lesson.motorWiring.connections.push({
            component: 'right motor',
            port: 'M3',
            notes: m3Match[0].trim(),
          });
        }
      }
    }

    // Blocks used - look for categories and blocks
    const blocksText = getTextAfter('building blocks');
    const blocksImages = getImagesAfter('building blocks');
    if (blocksText) {
      // Try to parse block categories
      const categories = ['Basic', 'Input', 'Loops', 'Logic', 'Variables', 'SuperBit', 'Music'];
      categories.forEach(cat => {
        const regex = new RegExp(`${cat}[:\\s]+([^\\n]+)`, 'i');
        const match = blocksText.match(regex);
        if (match) {
          lesson.blocksUsed.push({
            category: cat,
            blocks: match[1].split(',').map(b => b.trim()),
            images: blocksImages,
          });
        }
      });
    }

    // Combined blocks / code
    const codeText = getTextAfter('combined block');
    const codeImages = getImagesAfter('combined block');
    if (codeText || codeImages.length > 0) {
      lesson.code = {
        description: codeText,
        images: codeImages,
      };
    }

    // Hex file - look for download link or file name
    const hexLinks = document.querySelectorAll('a[href*=".hex"]');
    if (hexLinks.length > 0) {
      lesson.hexFile = hexLinks[0].href.split('/').pop();
    } else {
      // Try to find hex file name in text
      const hexMatch = document.body.textContent.match(/microbit-[^.\s]+\.hex/i);
      if (hexMatch) {
        lesson.hexFile = hexMatch[0];
      }
    }

    // Experimental phenomenon
    lesson.phenomenon = getTextAfter('experimental phenomenon');

    // Collect all images
    document.querySelectorAll('article img, .content img, img').forEach(img => {
      if (img.src && !img.src.includes('data:') && img.src.includes('yahboom')) {
        lesson.images.push({
          src: img.src,
          alt: img.alt || '',
          context: img.closest('p')?.textContent?.slice(0, 50) || '',
        });
      }
    });

    return lesson;
  });
}

/**
 * Parse Python lesson content from page
 */
export async function parsePythonLesson(page) {
  return page.evaluate(() => {
    const lesson = {
      title: null,
      objective: null,
      code: null,
      imports: [],
      explanation: null,
      phenomenon: null,
    };

    // Title
    const h1 = document.querySelector('h1');
    if (h1) lesson.title = h1.textContent.trim();

    // Look for code blocks
    const codeBlocks = document.querySelectorAll('pre, code, .hljs');
    if (codeBlocks.length > 0) {
      lesson.code = codeBlocks[0].textContent.trim();

      // Extract imports
      const importMatches = lesson.code.match(/^(?:from|import)\s+.+$/gm);
      if (importMatches) {
        lesson.imports = importMatches.map(i => i.trim());
      }
    }

    // Learning objective
    const headings = document.querySelectorAll('h2, h3');
    for (const h of headings) {
      if (h.textContent.toLowerCase().includes('objective')) {
        const sib = h.nextElementSibling;
        if (sib) lesson.objective = sib.textContent.trim();
        break;
      }
    }

    // Phenomenon
    for (const h of headings) {
      if (h.textContent.toLowerCase().includes('phenomenon')) {
        const sib = h.nextElementSibling;
        if (sib) lesson.phenomenon = sib.textContent.trim();
        break;
      }
    }

    return lesson;
  });
}

/**
 * Parse sensor principles content
 */
export async function parseSensorPrinciples(page) {
  return page.evaluate(() => {
    const content = {
      title: null,
      text: null,
      images: [],
    };

    const h1 = document.querySelector('h1');
    if (h1) content.title = h1.textContent.trim();

    // Get main content
    const article = document.querySelector('article');
    if (article) {
      content.text = article.textContent.trim();

      article.querySelectorAll('img').forEach(img => {
        if (img.src && !img.src.includes('data:')) {
          content.images.push({
            src: img.src,
            alt: img.alt || '',
          });
        }
      });
    }

    return content;
  });
}

export default {
  parseMakeCodeLesson,
  parsePythonLesson,
  parseSensorPrinciples,
};
