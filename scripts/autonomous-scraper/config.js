// Autonomous Scraper Configuration

export const BASE_URL = 'https://www.yahboom.net/study/buildingbit-super-kit';
export const BUILD_API = 'https://www.yahboom.net/build';

// All discovered build IDs from the Yahboom site (234 total)
// These are fetched via /build?id=X to get iframe URLs
export const ALL_BUILD_IDS = {
  // Assembly course builds (main project pages)
  assembly: [
    { title: '1.1Mobile shooter', buildId: '3875' },
    { title: '1.2Pretty car', buildId: '3876' },
    { title: '1.3Clip robot', buildId: '3877' },
    { title: '1.4Proficient carrier', buildId: '3878' },
    { title: '1.5Skip car', buildId: '3879' },
    { title: '1.6Freestyle', buildId: '3882' },
    { title: '1.7Spider', buildId: '3880' },
    { title: '1.8Lifting platform', buildId: '3881' },
    { title: '1.9Biped robot', buildId: '3883' },
    { title: '1.10Changing Face', buildId: '3884' },
    { title: '1.11Carousel', buildId: '3885' },
    { title: '1.12Oscillating fan', buildId: '3886' },
    { title: '1.13Airplane', buildId: '3887' },
    { title: '1.14Unicycle', buildId: '3888' },
    { title: '1.15Auto-door', buildId: '3889' },
    { title: '1.16Dragon knight', buildId: '3890' },
    { title: '1.17Ultrasonic handheld rangefinder', buildId: '15636' },
    { title: '1.18Small flying car obstacle avoidance', buildId: '15637' },
    { title: '1.19Changing face', buildId: '15638' },
    { title: '1.20Adjustable RGB light', buildId: '15639' },
    { title: '1.21Adjustable fan', buildId: '15640' },
    { title: '1.22Photosensitive emergency light', buildId: '15641' },
    { title: '1.23Small flash', buildId: '15642' },
    { title: '1.24Intelligent desk lamp', buildId: '15643' },
    { title: '1.25Hand car', buildId: '15644' },
    { title: '1.26Safety alarm', buildId: '15645' },
    { title: '1.27Environmental monitoring station', buildId: '15646' },
    { title: '1.28Smart fan', buildId: '15647' },
    { title: '1.29Automatic color sorting machine', buildId: '15648' },
    { title: '1.30Color guide car', buildId: '15649' },
    { title: '1.31Joystick control light', buildId: '15650' },
    { title: '1.32Rocker control car', buildId: '15651' },
  ],

  // MakeCode lessons (Section 3 - Basic modeling MakeCode course)
  makecode: {
    'A.Mobile shooter': [
      { title: '1.Cannonball shooting', buildId: '3757' },
      { title: '2.Music fortress', buildId: '3759' },
      { title: '3.APP control', buildId: '3760' },
      { title: '4.Micro:bit handle control', buildId: '3761' },
      { title: '5.WiFi camera control', buildId: '11254' },
    ],
    'B.Pretty car': [
      { title: '1.Dancer', buildId: '3762' },
      { title: '2.APP control', buildId: '3763' },
      { title: '3.Micro:bit handle control', buildId: '3764' },
      { title: '4.WiFi camera control', buildId: '11255' },
    ],
    'C.Clip robot': [
      { title: '1.Dancing and singing', buildId: '3765' },
      { title: '2.Button control clip', buildId: '3766' },
      { title: '3.APP control', buildId: '3767' },
      { title: '4.Micro:bit handle control', buildId: '3768' },
      { title: '5.WiFi camera control', buildId: '11257' },
    ],
    'D.Proficient carrier': [
      { title: '1.Dancing', buildId: '3769' },
      { title: '2.Button control shovel', buildId: '3770' },
      { title: '3.Transportation', buildId: '3771' },
      { title: '4.APP control', buildId: '3772' },
      { title: '5.Micro:bit handle control', buildId: '3773' },
      { title: '6.WiFi camera control', buildId: '11258' },
    ],
    'E.Skip car': [
      { title: '1.Dance battle', buildId: '3774' },
      { title: '2.Button control skip car', buildId: '3775' },
      { title: '3.Powerful carrier', buildId: '3776' },
      { title: '4.APP control', buildId: '3777' },
      { title: '5.Micro:bit handle control', buildId: '3778' },
      { title: '6.WiFi camera control', buildId: '11259' },
    ],
    'F.Freestyle': [
      { title: '1.Dancing and singing', buildId: '3779' },
      { title: '2.Freestyle advance', buildId: '3780' },
      { title: '3.Micro:bit handle control', buildId: '3781' },
    ],
    'G.Spider': [
      { title: '1.Spider advance', buildId: '3782' },
      { title: '2.The dancing spider', buildId: '3783' },
      { title: '3.Micro:bit handle control', buildId: '3784' },
    ],
    'H.Lifting platform': [
      { title: '1.Lift up and down', buildId: '3785' },
      { title: '2.Motor linkage', buildId: '3786' },
      { title: '3.Micro:bit handle control', buildId: '3787' },
    ],
    'I.Biped robot': [
      { title: '1.Biped robot advance', buildId: '3788' },
      { title: '2.Biped robot walk', buildId: '3789' },
      { title: '3.Micro:bit handle control', buildId: '3790' },
    ],
    '0.Basic course': [
      { title: '1.Buzzer play music', buildId: '3751' },
      { title: '2.Control RGB color', buildId: '3752' },
      { title: '3.Control all RGB lights', buildId: '3753' },
      { title: '4.Drive 270°building block servo', buildId: '3754' },
      { title: '5.Drive 180° servo', buildId: '3755' },
      { title: '6.Drive motor', buildId: '3756' },
    ],
  },

  // Python lessons (Section 4)
  python: {
    'A.Mobile shooter': [
      { title: '1.Cannonball shooting', buildId: '3824' },
      { title: '2.Music fortress', buildId: '3825' },
      { title: '3.Micro:bit handle control', buildId: '3826' },
    ],
    'B.Pretty car': [
      { title: '1.Dancer', buildId: '3827' },
      { title: '2.Micro:bit handle control', buildId: '3828' },
    ],
    'G.Spider': [
      { title: '1.Spider advance', buildId: '3848' },
      { title: '2.The dancing spider', buildId: '3849' },
      { title: '3.Micro:bit handle control', buildId: '3850' },
    ],
    '0.Basic course': [
      { title: '1.Buzzer play music', buildId: '3818' },
      { title: '2.Control RGB color', buildId: '3819' },
      { title: '3.Control all RGB lights', buildId: '3820' },
      { title: '4.Drive 270°building block servo', buildId: '3821' },
      { title: '5.Drive 180° servo', buildId: '3822' },
      { title: '6.Drive motor', buildId: '3823' },
    ],
  },

  // Sensor Principles (Section 5.1)
  sensorPrinciples: [
    { title: '1.1 About ultrasonic sensors', buildId: '15652' },
    { title: '1.2 Ultrasonic ranging', buildId: '15653' },
    { title: '1.3 About potentiometers', buildId: '15658' },
    { title: '1.4 Adjust potentiometer', buildId: '15659' },
    { title: '1.5 About photosensitive sensors', buildId: '15660' },
    { title: '1.6 Read the light intensity', buildId: '15671' },
    { title: '1.7 About infrared modules', buildId: '15670' },
    { title: '1.8 Obstacle detection', buildId: '15669' },
    { title: '1.9 About human infrared sensing modules', buildId: '15668' },
    { title: '1.10 Human body detection', buildId: '15667' },
    { title: '1.11 About temperature-humidity modules', buildId: '15666' },
    { title: '1.12 Read temperature humidity', buildId: '15664' },
    { title: '1.13 About color recognition sensors', buildId: '15663' },
    { title: '1.14 Color recognition', buildId: '15665' },
    { title: '1.15 About rocker module', buildId: '15662' },
    { title: '1.16 Control rocker', buildId: '15661' },
  ],

  // Sensor Advanced (Section 5.2)
  sensorAdvanced: [
    { title: '2.1 Hand-held range finder', buildId: '15672' },
    { title: '2.2 Adjustable RGB light', buildId: '15675' },
    { title: '2.3 Emergency light', buildId: '15673' },
    { title: '2.4 Intelligent desk lamp', buildId: '15674' },
  ],
};

export const TIMEOUTS = {
  navigation: 60000,
  elementWait: 30000,
  networkIdle: 10000,
};

export const RATE_LIMIT = {
  requestsPerMinute: 20,
  pauseBetweenBuilds: 3000,
};

export const RETRY = {
  maxRetries: 3,
  baseDelayMs: 2000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
};

export const SELECTORS = {
  // Main navigation
  assemblySection: 'text=1.Assembly Course',
  makecodeSection: 'text=3.MakeCode Course',
  pythonSection: 'text=4.Python Course',
  sensorSection: 'text=5.Sensor Advanced Course',

  // Content areas
  article: 'article',
  leftMenu: '.left-menu',

  // Lesson content (for parsing)
  learningObjectives: 'h2:has-text("Learning objectives"), h2:has-text("learning objectives")',
  motorWiring: 'h2:has-text("Motor wiring"), h2:has-text("motor wiring")',
  blocksUsed: 'h3:has-text("Building blocks"), h3:has-text("building blocks")',
  combinedBlocks: 'h3:has-text("Combined blocks"), h3:has-text("combined blocks")',
  phenomenon: 'h2:has-text("Experimental phenomenon"), h2:has-text("experimental phenomenon")',
};

// Build ID to MakeCode section mapping
export const MAKECODE_SECTIONS = {
  '1.1': { section: '3.A', name: 'Mobile shooter' },
  '1.7': { section: '3.G', name: 'Spider' },
  '1.8': { section: '3.H', name: 'Lifting platform' },
  '1.9': { section: '3.I', name: 'Biped robot' },
  '1.10': { section: '3.J', name: 'Changing Face' },
  '1.11': { section: '3.K', name: 'Carousel' },
  '1.12': { section: '3.L', name: 'Oscillating fan' },
  '1.14': { section: '3.N', name: 'Unicycle' },
  '1.15': { section: '3.O', name: 'Auto-door' },
  '1.16': { section: '3.P', name: 'Dragon knight' },
  '1.17': { section: '3.Q', name: 'Ultrasonic handheld rangefinder' },
  '1.18': { section: '3.R', name: 'Small flying car obstacle avoidance' },
  '1.19': { section: '3.S', name: 'Changing face' },
};

// Build ID to Python section mapping
export const PYTHON_SECTIONS = {
  '1.1': { section: '4.A', name: 'Mobile shooter' },
  '1.7': { section: '4.G', name: 'Spider' },
  '1.8': { section: '4.H', name: 'Lifting platform' },
  '1.9': { section: '4.I', name: 'Biped robot' },
  '1.10': { section: '4.J', name: 'Changing Face' },
  '1.11': { section: '4.K', name: 'Carousel' },
  '1.12': { section: '4.L', name: 'Oscillating fan' },
  '1.14': { section: '4.N', name: 'Unicycle' },
  '1.15': { section: '4.O', name: 'Auto-door' },
  '1.16': { section: '4.P', name: 'Dragon knight' },
  '1.17': { section: '4.Q', name: 'Ultrasonic handheld rangefinder' },
  '1.18': { section: '4.R', name: 'Small flying car obstacle avoidance' },
  '1.19': { section: '4.S', name: 'Changing face' },
};

// Sensor builds with advanced courses
export const SENSOR_BUILDS = {
  '1.17': { section: '5.3.1', sensors: ['ultrasonic'] },
  '1.18': { section: '5.3.1', sensors: ['ultrasonic'] },
  '1.20': { section: '5.3.2', sensors: ['light'] },
  '1.22': { section: '5.3.2', sensors: ['light'] },
  '1.24': { section: '5.3.2', sensors: ['light'] },
  '1.26': { section: '5.3.6', sensors: ['PIR'] },
  '1.27': { section: '5.3.3', sensors: ['temperature'] },
  '1.28': { section: '5.3.3', sensors: ['temperature'] },
  '1.29': { section: '5.3.4', sensors: ['color'] },
  '1.30': { section: '5.3.4', sensors: ['color'] },
  '1.31': { section: '5.3.5', sensors: ['joystick'] },
  '1.32': { section: '5.3.5', sensors: ['joystick'] },
};

// Sensor principles chapter mapping
export const SENSOR_PRINCIPLES = {
  ultrasonic: ['1.1', '1.2'],  // About ultrasonic, Ultrasonic ranging
  light: ['2.1', '2.2'],       // About light sensors, Light sensing
  PIR: ['3.1', '3.2'],         // About PIR, Motion detection
  temperature: ['4.1', '4.2'], // About temp sensors, Temperature reading
  color: ['5.1', '5.2'],       // About color sensors, Color recognition
  joystick: ['6.1', '6.2'],    // About joysticks, Joystick control
};

export const PATHS = {
  buildsJson: 'public/data/builds.json',
  stateFile: 'data/scrape-state.json',
  courseMappings: 'data/course-mappings.json',
  sensorPrinciples: 'data/sensor-principles.json',
  rawImages: 'raw/images',
  publicImages: 'public/images/builds',
};
