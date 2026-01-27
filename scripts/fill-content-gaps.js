#!/usr/bin/env node
/**
 * Fill Content Gaps
 *
 * Adds missing descriptions and sensor/peripheral data to builds.json
 * using content-master-map.json and devices.json
 */

import fs from 'fs';
import path from 'path';

const BUILDS_PATH = path.join(process.cwd(), 'public/data/builds.json');
const DEVICES_PATH = path.join(process.cwd(), 'public/data/devices.json');
const MASTER_MAP_PATH = path.join(process.cwd(), 'public/data/content-master-map.json');

// Kid-friendly descriptions for each build type
const DESCRIPTIONS = {
  "1.1": "A super cool tank on wheels that shoots projectiles! Build it, code it, and have target practice with your friends.",
  "1.2": "A stylish car that dances and moves in cool patterns. You can control it with your phone or the game controller!",
  "1.3": "A robot with claws that can grab things! Make it dance and sing while picking up small objects.",
  "1.4": "A helpful carrier robot with a shovel to move things around. Great for transporting your small toys!",
  "1.5": "A jumping car that can hop and skip! Watch it bounce around and do tricks.",
  "1.6": "A freestyle robot that you control however you want. Make it dance, spin, and do your own moves!",
  "1.7": "A creepy-crawly spider robot with legs that move! Make it dance and scare your friends.",
  "1.8": "A lifting platform that goes up and down like an elevator. Press buttons to control the height!",
  "1.9": "A walking robot on two legs like a person! Teach it to walk, dance, and wave hello.",
  "1.10": "A fun robot that changes its face! Watch it smile, frown, and make silly expressions.",
  "1.11": "A spinning merry-go-round with music! Build your own mini carnival ride.",
  "1.12": "A fan that swings back and forth to keep you cool on hot days. You control the speed!",
  "1.13": "A model airplane with parts that move! Make the propeller spin and wings tilt.",
  "1.14": "A one-wheeled robot that balances and moves around. Watch it roll in circles!",
  "1.15": "An automatic door that opens when you approach. Like a real store entrance!",
  "1.16": "A dragon knight that waves its wings! Make it look like it's flying.",
  "1.17": "A handheld device that measures distances using sound waves. Point it at things to see how far away they are!",
  "1.18": "A smart car that avoids obstacles by itself! Watch it drive around without bumping into things.",
  "1.19": "A face-changing robot with an infrared sensor that reacts when you get close!",
  "1.20": "A colorful light that you control with a dial. Turn the knob to change brightness and colors!",
  "1.21": "A fan with adjustable speed! Turn the dial to make it blow faster or slower.",
  "1.22": "A light that turns on automatically when it gets dark. Great for nighttime!",
  "1.23": "A vibrating alarm clock that wakes you up by shaking! Set the time and feel the buzz.",
  "1.24": "A robot that follows light! Shine a flashlight to guide it around the room.",
  "1.25": "A swimming robot that can detect obstacles underwater! Watch it navigate like a fish.",
  "1.26": "A spider robot that runs away when you get near! It uses a motion sensor to detect you.",
  "1.27": "A weather station that shows temperature and humidity on the screen. Check if it's hot or cold!",
  "1.28": "A smart fan that speeds up when it's hot and slows down when it's cool. It knows the temperature!",
  "1.29": "A robot that can see colors! Show it different colored objects and watch it react.",
  "1.30": "A door that only opens for the right color! Like a secret password, but with colors.",
  "1.31": "A light that you control with a joystick! Move it around to change the colors.",
  "1.32": "A car you drive with a joystick! Push forward to go, pull back to stop."
};

function fillContentGaps() {
  console.log('📝 Filling content gaps in builds.json\n');
  console.log('═'.repeat(50) + '\n');

  const builds = JSON.parse(fs.readFileSync(BUILDS_PATH, 'utf8'));
  const devices = JSON.parse(fs.readFileSync(DEVICES_PATH, 'utf8'));
  const masterMap = JSON.parse(fs.readFileSync(MASTER_MAP_PATH, 'utf8'));

  let descriptionsAdded = 0;
  let sensorsAdded = 0;
  let controllersAdded = 0;

  for (const build of builds.builds) {
    const buildNum = parseFloat(build.id);

    // Always use our kid-friendly descriptions
    const newDesc = DESCRIPTIONS[build.id];
    if (newDesc && build.description !== newDesc) {
      console.log(`  + Updating description for ${build.id} ${build.name}`);
      build.description = newDesc;
      descriptionsAdded++;
    }

    // Set sensors and controllers from devices.json mapping (overwrite existing)
    const deviceMapping = devices.buildDeviceMapping[build.id];
    if (deviceMapping) {
      // Set sensors (replace any existing incorrect data)
      const newSensors = deviceMapping.sensors || [];
      if (JSON.stringify(build.sensors) !== JSON.stringify(newSensors)) {
        build.sensors = newSensors;
        if (newSensors.length > 0) {
          console.log(`  + Setting sensors for ${build.id}: ${newSensors.join(', ')}`);
        } else if (build.sensors?.length > 0) {
          console.log(`  - Clearing incorrect sensors from ${build.id}`);
        }
        sensorsAdded++;
      }

      // Set controllers
      const newControllers = deviceMapping.controllers || [];
      if (JSON.stringify(build.controllers) !== JSON.stringify(newControllers)) {
        build.controllers = newControllers;
        if (newControllers.length > 0) {
          console.log(`  + Setting controllers for ${build.id}: ${newControllers.join(', ')}`);
        }
        controllersAdded++;
      }
    }
  }

  // Save updated builds
  fs.writeFileSync(BUILDS_PATH, JSON.stringify(builds, null, 2));

  console.log('\n' + '═'.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Descriptions added: ${descriptionsAdded}`);
  console.log(`   Sensors added: ${sensorsAdded}`);
  console.log(`   Controllers added: ${controllersAdded}`);
  console.log('\n✅ builds.json updated successfully');
}

fillContentGaps();
