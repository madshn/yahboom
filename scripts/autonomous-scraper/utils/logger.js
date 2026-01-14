// Structured logging utility

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function timestamp() {
  return new Date().toISOString().slice(11, 19);
}

function formatMessage(level, context, message, data) {
  const parts = [`[${timestamp()}]`, `[${level}]`];
  if (context) parts.push(`[${context}]`);
  parts.push(message);
  if (data) parts.push(JSON.stringify(data));
  return parts.join(' ');
}

export const logger = {
  info(message, context = null, data = null) {
    console.log(
      `${COLORS.blue}${formatMessage('INFO', context, message, data)}${COLORS.reset}`
    );
  },

  success(message, context = null, data = null) {
    console.log(
      `${COLORS.green}${formatMessage('OK', context, message, data)}${COLORS.reset}`
    );
  },

  warn(message, context = null, data = null) {
    console.log(
      `${COLORS.yellow}${formatMessage('WARN', context, message, data)}${COLORS.reset}`
    );
  },

  error(message, context = null, data = null) {
    console.error(
      `${COLORS.red}${formatMessage('ERROR', context, message, data)}${COLORS.reset}`
    );
  },

  debug(message, context = null, data = null) {
    if (process.env.DEBUG) {
      console.log(
        `${COLORS.dim}${formatMessage('DEBUG', context, message, data)}${COLORS.reset}`
      );
    }
  },

  progress(current, total, item) {
    const pct = Math.round((current / total) * 100);
    const bar = '='.repeat(Math.floor(pct / 5)).padEnd(20, ' ');
    console.log(
      `${COLORS.cyan}[${timestamp()}] [${bar}] ${pct}% (${current}/${total}) ${item}${COLORS.reset}`
    );
  },

  phase(name) {
    console.log(
      `\n${COLORS.bright}${COLORS.magenta}${'='.repeat(60)}${COLORS.reset}`
    );
    console.log(
      `${COLORS.bright}${COLORS.magenta}  PHASE: ${name}${COLORS.reset}`
    );
    console.log(
      `${COLORS.bright}${COLORS.magenta}${'='.repeat(60)}${COLORS.reset}\n`
    );
  },

  summary(stats) {
    console.log(`\n${COLORS.bright}--- SUMMARY ---${COLORS.reset}`);
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');
  },
};

export default logger;
